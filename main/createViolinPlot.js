// Async function to create a d3 violin plot for a given independent variable and a set of genes

// indepVarType is the type of independent variable for the plot (probably either 'cohort' or 'mutatedGene')
    // NOTE: The function is currently only set to handle indepVarType='cohort'
// indepVar is the independent variable (ex1: 'PAAD', ex2: 'TP53')
// dataInput is the array os JSONs of gene expression data to visualize
// svgObject is the object on the html page to build the plot

createViolinPlot = async function(indepVarType, indepVars, dataInput, svgObject) {

    // Set up margins:
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 1250 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;

    // Filter out null values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    // Get myGroups of genes:
    var myGroups = d3.map(dataInput, function(d){return d.gene;}).keys();
    var numOfGenes = myGroups.length;

    // Helper function to sort genes by median expression:
    function compareGeneExpressionMedian(a,b) {
        var aArray = d3.map(dataInput.filter(x => x.gene == a), function(d){return d.expression_log2;}).keys();
        var bArray = d3.map(dataInput.filter(x => x.gene == b), function(d){return d.expression_log2;}).keys();
        var aMedian = d3.quantile(aArray,0.5);
        var bMedian = d3.quantile(bArray,0.5);
        
        return aMedian - bMedian;
    };

    // Sort myGroups by median expression:
    myGroups.sort((a,b) => compareGeneExpressionMedian(a,b));


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build the Axis and Color Scales Below ///////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Get min and max expression values for y axis:
    var geneExpressionValues = d3.map(dataInput, function(d){return d.expression_log2}).keys();
    let minExpressionLevel = Math.min(...geneExpressionValues);
    let maxExpressionLevel = Math.max(...geneExpressionValues);
    
    // Build and Show the Y scale
    var y = d3.scaleLinear()
        .domain([minExpressionLevel, maxExpressionLevel])
        .range([height, 0]);
    svgObject.append("g").call( d3.axisLeft(y));

    // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3.scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svgObject.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build the Axis and Color Scales Above ///////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// Set up Distributions and Statistics Info for Each Gene's Expression Below /////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Features density estimation:
    // The value passed to kernelEpanechnikov determines smoothness:
    var kde = kernelDensityEstimator(kernelEpanechnikov(0.7), y.ticks(50))
    
    /*Each entry in geneStatistics will be an array of the following format:
    1) Gene name
    2) Average gene expression level
    3) Median gene expression level
    4) Maximum gene expression level
    5) Mininum gene expression level
    */
    var geneStatistics = [];

    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()                                                // nest function allows to group the calculation per level of a factor
        .key(function(d) {return d.gene;})
        .rollup(function(d) {                                              // For each key..
            input = d.map(function(g) { return g.expression_log2;});

            if(geneStatistics.length < numOfGenes) {
                geneStatistics.push([average(input), d3.quantile(input, 0.5),
                    Math.max.apply(null, input), Math.min.apply(null, input)]);
            };

            density = kde(input);                                           // Implement kernel density estimation
            return(density);
        })
        .entries(dataInput)

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for(i in sumstat) {

        allBins = sumstat[i].value
        lengths = allBins.map(function(a){return a.length;})
        longest = d3.max(lengths)

        if (longest > maxNum) {
            maxNum = longest;
        }

        // Add statisitc info for each gene:
        var currentExpressionArray = d3.map(dataInput.filter(x => x.gene == sumstat[i].key), function(d){return d.expression_log2;}).keys();
        sumstat[i].median = d3.quantile(currentExpressionArray, 0.5);
        sumstat[i].Qthree = d3.quantile(currentExpressionArray, 0.75);
        sumstat[i].Qone = d3.quantile(currentExpressionArray, 0.25);
        sumstat[i].average = average(currentExpressionArray);
        sumstat[i].min = Math.min(...currentExpressionArray);
        sumstat[i].max = Math.max(...currentExpressionArray);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// Set up Distributions and Statistics Info for Each Gene's Expression Above /////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////// Build the Mouseover Tool Below ///////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Build the scroll over tool:
    // create a tooltip
    var tooltip = d3.select("#violinPlotRef")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        tooltip
        .style("opacity", 1)
        d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)             
    }
    var mousemove = function(d) {
        tooltip
        .style("left", (d3.mouse(this)[0]+70) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
        .attr("transform", "translate(" + width/2 + ")")
        for (prop in this) {
            const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
            var tooltipstring = "\xa0\xa0" + 
                                "Gene: " + d.key + spacing +
                                "Min: " + String(d.min.toFixed(4)) + spacing +
                                "Q1: " + String(d.Qone.toFixed(4)) + spacing +
                                "Median: " + String(d.median.toFixed(4)) + spacing +
                                "Average: " + String(d.average.toFixed(4)) + spacing +
                                "Q3: " + String(d.Qthree.toFixed(4)) + spacing +
                                "Max: " + String(d.max.toFixed(4))
                                ;
            return tooltip.style("visibility", "visible").html(tooltipstring);
                                                               
        };

    }
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        d3.select(this)
        .style("stroke", "none")
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////// Build the Mouseover Tool Above ///////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////// Build the Violin Plot Below /////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3.scaleLinear()
    .range([0, x.bandwidth()])
    .domain([-maxNum ,maxNum])

    // Add the shape to this svg!
    svgObject
    .selectAll("myViolin")
    .data(sumstat)
    .enter()        // So now we are working group per group
    .append("g")
    .attr("transform", function(d){ return("translate(" + x(d.key) +" , 0)")}) // Translation on the right to be at the group position
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .append("path")
        .datum(function(d){return(d.value);})     // So now we are working bin per bin
        .style("stroke", "none")
        .style("fill","#69b3a2")
        .attr("d", d3.area()
            .x0(function(d){ return(xNum(-d[1])) } )
            .x1(function(d){ return(xNum(d[1])) } )
            .y(function(d){ return(y(d[0])) } )
            .curve(d3.curveCatmullRom))  // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        

    if (indepVarType == 'cohort') {
        // Add title to graph
        svgObject.append("text")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "left")
            .style("font-size", "26px")
            .text("Gene Expression Violin Plot for "+indepVars.join(' and '))

    } 
    else if (indepVarType == 'mutatedGene') {
        // Add title to graph
        svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Violin Plot for Patients with a mutated "+indepVars+" Gene")
    };
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// Helper Functions Below ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Helper function for average
function average(values) {
    var sum = 0;

    for(var index = 0; index < values.length; index++) {
        sum += (Number)(values[index]);
    };

    return (Number)(sum/values.length);
};


// Helper functions for kernel density estimation from (https://gist.github.com/mbostock/4341954):
function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
};

function kernelEpanechnikov(k) {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////// End Of Program ///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////