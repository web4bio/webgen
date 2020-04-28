createViolinPlot = async function(indepVarType, indepVars, dataInput, svgObject) {

    var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 1250 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;

    // Filter out null values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    // Get myGroups of genes:
    var myGroups = d3.map(dataInput, function(d){return d.gene;}).keys();
    var numOfGenes = myGroups.length;

    // Sort myGroups by median expression:
    function compareGeneExpressionMedian(a,b) {
        aArray = d3.map(dataInput.filter(x => x.gene == a), function(d){return d.expression_log2;}).keys();
        bArray = d3.map(dataInput.filter(x => x.gene == b), function(d){return d.expression_log2;}).keys();
        aMedian = median(aArray);
        bMedian = median(bArray);

        return aMedian - bMedian;
    };
    myGroups.sort(function(a,b) {return compareGeneExpressionMedian(a,b)});

    // Get myVars of expressionValues:
    var myVarsTemp = d3.map(dataInput, function(d){return d.expression_log2}).keys();

    var myVars = [];
    
    var index = 0;

    for(index = 0; index < myVarsTemp.length; index++)
    {
        myVars.push(parseFloat(myVarsTemp[index]));
    }

    let maxExpressionLevel = Math.max.apply(null, myVars);
    let minExpressionLevel = Math.min.apply(null, myVars);

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
    var currentGene;

    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()                                                // nest function allows to group the calculation per level of a factor
        .key(function(d) 
        {
            return d.gene;
        })
        .rollup(function(d) {                                              // For each key..
            input = d.map(function(g) { return g.expression_log2;});
            if(geneStatistics.length < numOfGenes)
            {
                geneStatistics.push([average(input), median(input),
                    Math.max.apply(null, input), Math.min.apply(null, input)]);
            }

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
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3.scaleLinear()
        .range([0, x.bandwidth()])
        .domain([-maxNum ,maxNum])


    var tooltip = d3.select("body").append("div")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");

    // Add the shape to this svg!
    svgObject
    .selectAll("myViolin")
    .data(sumstat)
    .enter()        // So now we are working group per group
    .append("g")
    .attr("transform", function(d){ return("translate(" + x(d.key) +" , 0)")}) // Translation on the right to be at the group position
    .append("path")
        .datum(function(d){console.log(d);return(d.value);})     // So now we are working bin per bin
        .style("stroke", "none")
        .style("fill","#69b3a2")
        .attr("d", d3.area()
            .x0(function(d){ return(xNum(-d[1])) } )
            .x1(function(d){ return(xNum(d[1])) } )
            .y(function(d){ return(y(d[0])) } )
            .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        )
        .on("mouseover", function()
        {
            d3.select(this).transition()
                .duration("50")
                .attr("opacity", "0.5");
            
            for(var prop in this)
            {
                console.log(prop + " : " + this[prop]);
            }
            
            return tooltip.style("visibility", "visible").text("This works");
        })

        .on("mousemove", function()
        {
            return tooltip.style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        })

        .on("mouseout", function()
        {
            d3.select(this).transition()
                .duration("50")
                .attr("opacity", "1");

            tooltip.style("visiblity", "hidden").text("");
        })


    if (indepVarType == 'cohort') 
    {
        // Add title to graph
        svgObject.append("text")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "left")
            .style("font-size", "26px")
            .text("Gene Expression Violin Plot for "+indepVars.join(' and '))

    } 
    else if (indepVarType == 'mutatedGene') 
    {
        // Add title to graph
        svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Violin Plot for Patients with a mutated "+indepVars+" Gene")
    };
};


// Helper function for median:
function median(values){
    if(values.length ===0) return 0;
  
    values.sort(function(a,b){
      return a-b;
    });
  
    var half = Math.floor(values.length / 2.0);
  
    if (values.length % 2) {
      return Number(values[half]);
    };
    
    return (Number(values[half - 1]) + Number(values[half])) / 2;
};

//Helper function for average
function average(values)
{
    var sum = 0;

    for(var index = 0; index < values.length; index++)
    {
        sum += (Number)(values[index]);
    }

    return (Number)(sum/values.length);
}

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

// END OF PROGRAM