// Async function to create a d3 violin plot for a given independent variable and a set of genes

// indepVarType is the type of independent variable for the plot (probably either 'cohort' or 'gene')
    // NOTE: The function is currently only set to handle indepVarType='cohort'
// indepVar is the independent variable (ex1: 'PAAD', ex2: 'TP53')
// dataInput is the array os JSONs of gene expression data to visualize
// violinDiv is the name of the object on the html page to build the plot
// curPlot is the name of the Expression vs. indeptVarType plot we are generating

var tooltipNum = 0;
createViolinPlot = async function(indepVarType, indepVars, dataInput, violinDiv, curPlot, facetByFields) {    
    //get the num of the div so that the id of everything else matches. Will be used later when creating svg and tooltip
    let divNum = violinDiv.id.replace("ViolinDiv", "");

    let clinicalData = JSON.parse(sessionStorage.getItem("clinicalDataQuery"));

    //Set up violin curve colors
    var colors = ["#f1f291", "#69b3a2", "#bfb7f7", "#f26d5c", "#71a9d1", "#f0a94f"];
    var violinCurveColors = [];

    // Set up the figure dimensions:
    //var margin = {top: 10, right: 30, bottom: 30, left: 40},
    var margin = {top: 10, right: 30, bottom: 80, left: 40},
        width = 1250 - margin.left - margin.right,
        height = 440 - margin.top - margin.bottom;

    // Filter out null values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    //Filter out data that does not belong to curPlot
    if(indepVarType == "gene")
        dataInput = dataInput.filter(patientData => patientData.cohort == curPlot);
    else if(indepVarType == "cohort")
        dataInput = dataInput.filter(patientData => patientData.gene == curPlot);

    var myGroups;
    //Add new field to data for purpose of creating keys and populating myGroups
    if(facetByFields.length > 0)
    {        
        for(var i = 0; i < dataInput.length; i++)
        {
            //Get matching index in clinicalData for current patient index in dataInput
            var clinicalDataIndex = findMatchByTCGABarcode(dataInput[i], clinicalData);
         
            if(clinicalDataIndex >= 0)
            {
                var keyToFacetBy = dataInput[i][indepVarType] + " (";
                //Iterate over the clinical fields to facet by to create keyToFacetBy
                for(var fieldIndex = 0; fieldIndex < facetByFields.length; fieldIndex++)
                {
                    //Append additional JSON field to data for the purpose of creating a key to facet by
                    clinicalField = facetByFields[fieldIndex];
                    //dataInput[i][clinicalField] = clinicalData[clinicalDataIndex][clinicalField];
                    keyToFacetBy += clinicalData[clinicalDataIndex][clinicalField] 
                    if(fieldIndex < facetByFields.length-1)
                    {
                        keyToFacetBy += " ";
                    }
                }
                keyToFacetBy += ")";
                dataInput[i]["facetByFieldKey"] = keyToFacetBy;
            }

            else
            {
                dataInput[i]["facetByFieldKey"] = dataInput[i][indepVarType] + " (NA)";
            }

        }

        myGroups = d3.map(dataInput, function(d){return d.facetByFieldKey;}).keys();
    }
    else
    {
        myGroups = d3.map(dataInput, function(d){return d.cohort}).keys();
    }

    console.log(myGroups);

    // Helper function to sort groups by median expression:
    function compareGeneExpressionMedian(a,b) {
        var aArray = d3.map(dataInput.filter(x => x[indepVarType] == a), function(d){return d.expression_log2;}).keys();
        var bArray = d3.map(dataInput.filter(x => x[indepVarType] == b), function(d){return d.expression_log2;}).keys();
        var aMedian = d3.quantile(aArray.sort(function(a,b) {return a - b ;}), 0.5);
        var bMedian = d3.quantile(bArray.sort(function(a,b) {return a - b ;}), 0.5);
        
        return aMedian - bMedian;
    };

    // Sort myGroups by median expression:
    if(facetByFields.length == 0)
        myGroups.sort((a,b) => compareGeneExpressionMedian(a,b));
    else
        myGroups.sort();


    //Populate violinCurveColors
    var colorsArrIndex = 0;
    for(var index = 0; index < myGroups.length; index++)
    {
        violinCurveColors.push(colors[colorsArrIndex]);
        colorsArrIndex++;

        if(colorsArrIndex == colors.length)
        {
            colorsArrIndex = 0;
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build SVG Object Below //////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //Spacing between plots
    let ySpacing = margin.top;
    
    //matching the num of div to num of svg in the div
    let svgID = "svgViolinPlot" + divNum;

    //create the svg element for the violin plot
    let svgObject = d3.select(violinDiv).append("svg")
      .attr("viewBox", `0 -50 1250 475`)  // This line makes the svg responsive
      .attr("id", svgID)
      .attr("indepVarType", indepVarType) //The attributes added on this line and the lines below are used when rebuilding the plot
      .attr("indepVars", indepVars)
      .attr(indepVarType, curPlot)
      .append("g")
      .attr("id", (svgID + 'Position'))
      .attr("transform",
          "translate(" + (margin.left-20) + "," + 
                      (margin.top + ySpacing*index*0.25) + ")");

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build SVG Object Above //////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    //Append y-axis label
    svgObject.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Expression Level");

    // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3.scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svgObject.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll(".tick text")
        .call(wrap, x.bandwidth());

    svgObject.append("text")             
        .attr("transform", "translate(" + width/2 + ", " + (height + margin.top + 30) + ")")
        //.style("text-anchor", "middle")
        .text("Gene");

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
    

    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()                                                // nest function allows to group the calculation per level of a factor
        .key(function(d) 
        {
            if(facetByFields.length == 0)  
            {
                return d[indepVarType];
            }
            else
            {
                return d.facetByFieldKey;
            }
        })
        .rollup(function(d) {                                              // For each key..
            input = d.map(function(g) { return g.expression_log2;});
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

        // Add statisitc info for each group:
        var currentExpressionArray
        if(facetByFields.length == 0)
        {
            currentExpressionArray = d3.map(dataInput.filter(x => x[indepVarType] == sumstat[i].key), function(d){return d.expression_log2;}).keys();
        }
        else
        {
            currentExpressionArray = d3.map(dataInput.filter(x => x.facetByFieldKey == sumstat[i].key), function(d){return d.expression_log2;}).keys();
        }
        currentExpressionArray.sort(function(a,b) {return a - b ;});
        sumstat[i].median = d3.quantile(currentExpressionArray, 0.5);
        sumstat[i].Qthree = d3.quantile(currentExpressionArray, 0.75);
        sumstat[i].Qone = d3.quantile(currentExpressionArray, 0.25);
        sumstat[i].average = average(currentExpressionArray);
        sumstat[i].standardDeviation = Number(standardDeviation(sumstat[i].average, 
            currentExpressionArray));
        sumstat[i].min = Number(currentExpressionArray[0]);
        sumstat[i].max = Number(currentExpressionArray[currentExpressionArray.length-1]);
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
    var tooltip = d3.select(violinDiv)
        .append("div")
        .style("opacity", 0)
        .attr("id", "tooltip" + divNum)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three functions that change the tooltip when user hover / move / leave a cell
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
                                "Mean: " + String(d.average.toFixed(4)) + spacing +
                                "Standard Deviation: " + String(d.standardDeviation.toFixed(4)) 
                                + spacing + 
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

    //xVals will store the specific x-coordinates to place the box-and-whisker plots for each violin curve
    var xVals = [];
    //colorsIndex is used to cycle through violinCurveColors to assign each violin curve a color
    var colorsIndex = 0;

    // Add the shape to this svg!
    svgObject
    .selectAll("myViolin")
    .data(sumstat)
    .enter()        // So now we are working group per group
    .append("g")
    .attr("transform", function(d)
    {
        xVals.push(x(d.key) + (x.bandwidth()/2));
        return("translate(" + x(d.key) +" , 0)")
    }) // Translation on the right to be at the group position
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .append("path")
        .datum(function(d){return(d.value);})     // So now we are working bin per bin
        .style("stroke", "none")
        .style("fill", function(d)
        {
            var colorToReturn = violinCurveColors[colorsIndex];
            colorsIndex++;
            return colorToReturn;
        })
        .attr("d", d3.area()
            .x0(function(d){ return(xNum(-d[1])) } )
            .x1(function(d){ return(xNum(d[1])) } )
            .y(function(d){ return(y(d[0])) } )
            .curve(d3.curveCatmullRom))  // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference

    //Embed box-and-whisker plot inside of each violin curve
    for(var index = 0; index < sumstat.length; index++)
    {
        //Adding whisker on the box-and-whisker plot
        svgObject.append("line")
            .attr("x1", xVals[index])
            .attr("x2", xVals[index])
            .attr("y1", y(sumstat[index].min))
            .attr("y2", y(sumstat[index].max))
            .attr("stroke", "black")
            .attr("stroke-width", x.bandwidth()/500);

        //Adding rectangle for each box-and-whisker plot
        var rectWidth = x.bandwidth()/25;
        svgObject.append("rect")
            .attr("x", xVals[index] - rectWidth/2)
            .attr("y", y(sumstat[index].Qthree))
            .attr("height", y(sumstat[index].Qone) - y(sumstat[index].Qthree))
            .attr("width", rectWidth)
            .attr("stroke", "black")
            .style("stroke-width", x.bandwidth()/500)
            .attr("fill", "none");

        //Median line for box-and-whisker plot
        svgObject.append("line")
            .attr("x1", xVals[index] - rectWidth/2)
            .attr("x2", xVals[index] + rectWidth/2)
            .attr("y1", y(sumstat[index].median))
            .attr("y2", y(sumstat[index].median))
            .attr("stroke", "black")
            .attr("stroke-width", x.bandwidth()/500);
    }


    if (indepVarType == 'cohort') {
        // Add title to graph
        svgObject.append("text")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "left")
            .style("font-size", "26px")
            .text("Gene Expression Violin Plot for "+ curPlot)
    } 
    else if (indepVarType == 'gene') {
        // Add title to graph
        svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Violin Plot for "+ curPlot +" Gene")
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

    for(var index = 0; index < values.length; index++)
        sum += (Number)(values[index]);

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

//Helper function for standard deviation
function standardDeviation(mean, values)
{
    var sum = 0;
    for(var index = 0; index < values.length; index++)
    {
        sum += Math.pow(values[index] - mean, 2);
    }

    return (Number)(Math.pow(sum/(values.length-1), 0.5));
}

function findMatchByTCGABarcode(patient, clinicalData)
{
    for(var index = 0; index < clinicalData.length; index++)
    {
        if(clinicalData[index]["tcga_participant_barcode"] == (patient["tcga_participant_barcode"]))
            return index;
    }

    return -1;
}

//Helper function to create multi-line x-axis labels
function wrap(text, width) 
{
    text.each(function() 
    {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) 
      {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) 
        {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0)
                                        .attr("y", y)
                                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                        .text(word);
        }
      }
    });
  }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////// End Of Program ///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////