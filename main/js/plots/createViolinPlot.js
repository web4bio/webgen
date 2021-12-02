// Async function to create a d3 violin plot for a given independent variable and a set of genes

// dataInput is the array os JSONs of gene expression data to visualize
// violinDiv is the name of the object on the html page to build the plot
// curPlot is the name of the Expression vs. indeptVarType plot we are generating
// facetByFields are the clinical fields selected in the partition selection box

let tooltipNum = 0;

/** Create violin plots;
 *
 * @param {ExpressionData[]} dataInput - Array of expression data objects.
 * @param {HTMLDivElement} violinDiv - Div element in which to put violin plot.
 * @param {string} curPlot - Gene for this plot.
 * @param {string[]} facetByFields - Variables to partition violin curves by.
 *
 * @returns {undefined}
*/
const createViolinPlot = function(dataInput, violinDiv, curPlot, facetByFields) {
    //get the num of the div so that the id of everything else matches. Will be used later when creating svg and tooltip
    let divNum = violinDiv.id[violinDiv.id.length - 1];

    let clinicalData = "";
    if(facetByFields.length > 0)
        clinicalData = cache.get('rnaSeq', 'clinicalData');

    //Set up violin curve colors
    var colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
                    "#ffff33","#a65628","#f781bf","#999999"];
    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }
    shuffle(colors);
    var violinCurveColors = [];

    // Set up the figure dimensions:
    //var margin = {top: 10, right: 30, bottom: 30, left: 40},
    var margin = {top: 10, right: 30, bottom: 10, left: 40},
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Filter out null values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    //Filter out data that does not belong to curPlot
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
                //Add parentheses for formatting purposes
                var keyToFacetBy = dataInput[i]['cohort'] + " (";
                //Iterate over the clinical fields to facet by to create keyToFacetBy
                for(var fieldIndex = 0; fieldIndex < facetByFields.length; fieldIndex++)
                {
                    //Append additional JSON field to data for the purpose of creating a key to facet by
                    clinicalField = facetByFields[fieldIndex];
                    keyToFacetBy += clinicalData[clinicalDataIndex][clinicalField]
                    if(fieldIndex < facetByFields.length-1)
                    {
                        keyToFacetBy += " ";
                    }
                }
                keyToFacetBy += ")";
                //We now create the 'facetByFieldKey' attribute in the JSON data
                dataInput[i]["facetByFieldKey"] = keyToFacetBy;
            }

            else
            {
                //Handle edge case for 'NA'
                dataInput[i]["facetByFieldKey"] = dataInput[i]['cohort'] + " (NA)";
            }

        }

        myGroups = d3.map(dataInput, function(d){return d.facetByFieldKey;}).keys();
    }
    else
    {
        myGroups = d3.map(dataInput, function(d){return d['cohort'];}).keys();
    }

    // Helper function to sort groups by median expression:
    function compareGeneExpressionMedian(a,b) {
        var aArray = d3.map(dataInput.filter(x => x.cohort == a), function(d){return d.expression_log2;}).keys();
        var bArray = d3.map(dataInput.filter(x => x.cohort == b), function(d){return d.expression_log2;}).keys();
        var aMedian = d3.quantile(aArray.sort(function(a,b) {return a - b ;}), 0.5);
        var bMedian = d3.quantile(bArray.sort(function(a,b) {return a - b ;}), 0.5);

        return aMedian - bMedian;
    };

    // Sort myGroups by median expression:
    if(facetByFields.length == 0){
        myGroups.sort((a,b) => compareGeneExpressionMedian(a,b,'cohort'));
    }
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
    let svgDivId = `svgViolin${divNum}`;

    //create the svg element for the violin plot
    //let svgObject = d3.select(violinDiv).append("svg")
    let svgObject = d3.select("#" + svgDivId).append("svg")
      //.attr("viewBox", `0 -50 1250 475`)  // This line makes the svg responsive
      .attr("viewBox", `0 -35 1250 475`)  // This line makes the svg responsive
      .attr("id", svgID)
      .attr("indepVarType", "gene") //The attributes added on this line and the lines below are used when rebuilding the plot
      .attr("cohort", curPlot)
      .append("g")
      .attr("id", (svgID + 'Position'))
      .attr("transform",
          "translate(" + (margin.left) + "," +
                      (margin.top + ySpacing*divNum*0.25) + ")");

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
        .attr("transform", "rotate(-45), translate(-10, 5)")
        .call(wrap, x.bandwidth());

    svgObject.append("text")
        .attr("transform", "translate(" + width/2 + ", " + (height + margin.top + 30) + ")")
        //.style("text-anchor", "middle")
        .text('Cohort');

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
                return d['cohort'];
            }
            else
            {
                return d.facetByFieldKey;
            }
        })
        .rollup(function(d) {                                              // For each key..
            input = d.map(function(g) { return g.expression_log2;});
            density = kde(input);   
            console.log(density);                                        // Implement kernel density estimation
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
            currentExpressionArray = d3.map(dataInput.filter(x => x['cohort'] == sumstat[i].key), function(d){return d.expression_log2;}).keys();
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
    var tooltip = d3.select("#" + svgDivId)
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
        .attr("transform", "translate(" + width/4 + ")")

        for (prop in this) {
            const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
            var tooltipstring = "\xa0\xa0" +
                                "Cohort: " + d.key + spacing +
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

    // Add title to graph
    svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Violin Plot for "+ curPlot);
};




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// Helper Functions Below ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** Helper function for average
 * 
 * @param {number|number[]} values - average of expression_log2 for the gene of current plot
 * @returns {Number} sum of expression_log2 divided by length of values array
 */
function average(values) {
    var sum = 0;

    for(var index = 0; index < values.length; index++)
        sum += (Number)(values[index]);

    return (Number)(sum/values.length);
};


/** Helper functions for kernel density estimation from (https://gist.github.com/mbostock/4341954):
 * 
 * @param {number} kernel - value passed from kernelEpanechnikov(k)
 * @param {number|number[]} X - passed from d3.scaleLinear.ticks() that generates an array of numbers inside an interval
 * @returns 
 */
function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
};

/** Helper functions for kernel density estimation to determine smoothness
 * 
 * @param {number} k - decimal value passed 
 * @returns {number} smoothness value
 */
function kernelEpanechnikov(k) {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
};

/** Helper function for standard deviation
 * 
 * @param {number} mean - the average value from sumstat (stats summary)
 * @param {number} values - current expression array
 * @returns {number} the standard deviation result
 */
function standardDeviation(mean, values)
{
    var sum = 0;
    for(var index = 0; index < values.length; index++)
    {
        sum += Math.pow(values[index] - mean, 2);
    }

    return (Number)(Math.pow(sum/(values.length-1), 0.5));
}

/** Creates the partition selector for the violin plots
 * 
 * @param {?HTMLDivElement} violinsDivId - the html id passed over for the violinsDiv
 * @param {string[]} geneQuery - Array of gene names
 * @returns {string[]} list of choices for the partition box
 */
let createViolinPartitionBox = async function(violinsDivId, geneQuery)
{
    var partitionDivId = "violinPartition";
    var div_box = d3.select('#'+partitionDivId);
    div_box.append('text')
        .style("font-size", "20px")
        .text('Select variables to partition violin curves by:');
    div_box.append('div')
        .attr('class','viewport')
        .attr("id", "partitionSelectViolinPlot")
        .style('overflow-y', 'scroll')
        .style('height', '90px')
        .style('width', '500px')
        .append('div')
        .attr('class','body');
    var selectedText = div_box.append('text');
    let div_body = div_box.select('.body');

    var choices;
    function update()
    {
        choices = [];
        d3.selectAll(".myViolinCheckbox").each(function(d)
        {
            let cb = d3.select(this);
            if(cb.property('checked')){ choices.push(cb.property('value')); };
        });

        if(choices.length > 0){ selectedText.text('Selected: ' + choices.join(', ')); }
        else { selectedText.text('None selected'); };
    }

  // function to create a pair of checkbox and text
    function renderCB(div_obj, data)
    {
        const label = div_obj.append('div').attr('id', data);

        label.append("label")
           .attr("class", "switch")
           .append("input")
           .attr("class", "myViolinCheckbox")
           .attr("value", data)
           .attr("type", "checkbox")
           .on('change', function () {
                update();
                rebuildViolinPlot(partitionDivId, geneQuery);
            })
           .attr("style", 'opacity: 1; position: relative; pointer-events: all')
           .append("span")
           .attr("class", "slider round")
           .attr('value', data);

        label.append('text')
           .text(data);
    }

    // data to input = clinical vars from query
    let clinicalVars = localStorage.getItem("clinicalFeatureKeys").split(",");
    let var_opts = clinicalVars;

    // make a checkbox for each option
    var_opts.forEach(el => renderCB(div_body,el))
    update();

    var choices = [];
    d3.select('#'+partitionDivId).selectAll(".myViolinCheckbox").each(function(d)
    {
        let cb = d3.select(this);
        if(cb.property('checked')){ choices.push(cb.property('value')); };
    });

    /*
    div_box.append("break");
    div_box.append('button')
        .text("Rebuild Violin Plot")
        .attr("class", "col s3 btn waves-effect waves-light")
        .attr("id", "submitButton")
        .attr("onclick", "rebuildViolinPlot('" + partitionDivId + "', '" + geneQuery + "')");
    */

    return choices;
};

/** Returns array of the selection clinical features in the partition box corresponding to violinDivId
 * 
 * @param {?HTMLDivElement} violinsDivId - the html id passed over for the violinsDiv 
 * @returns {string[]} list of choices for the partition box that was selected by user
 */
let getPartitionBoxSelections = function(violinsDivId)
{
    var selectedOptions = [];
    d3.select('#'+violinsDivId).selectAll(".myViolinCheckbox").each(function(d)
    {
        let cb = d3.select(this);
        if(cb.property('checked')){ selectedOptions.push(cb.property('value')); };
    });
    return selectedOptions;
}

/** Rebuilds the violin plot associated with violinDivId
 * 
 * @param {?HTMLDivElement} violinsDivId - the html id passed over for the violinsDiv 
 * @param {string[]} geneQuery - Array of gene names
 * @returns {undefined} 
 */
let rebuildViolinPlot = function(violinsDivId, geneQuery) {
    var selectedOptions = getPartitionBoxSelections(violinsDivId);

    //geneQuery = geneQuery.split(",");
    for(var index = 0; index < geneQuery.length; index++) {
        var svgDivId = "svgViolin" + index;
        var svgDiv = document.getElementById(svgDivId);
        svgDiv.innerHTML = "";
        var violinDivId = "violinPlot" + index;
        createViolinPlot(cache.get('rnaSeq', 'expressionData'),
                        document.getElementById(violinDivId), geneQuery[index], selectedOptions);
    }
};

/** Helper function to acquire the index of a patient's clinical data based on their tcga_participant_barcode
 * 
 * @param {ExpressionData[]} patient - expression data objects.
 * @param {clinicalData[]} clinicalData - Array of clinical data objects.
 * @returns {number} index of tcga_participant_barcode of patient in the clinical data 
 */
function findMatchByTCGABarcode(patient, clinicalData)
{
    for(var index = 0; index < clinicalData.length; index++)
    {
        if(clinicalData[index]["tcga_participant_barcode"] == (patient["tcga_participant_barcode"]))
            return index;
    }

    return -1;
}

/** Helper function to create multi-line x-axis labels
 * 
 * unused function
 * 
 * @param {text} text - x-axis labels 
 * @param {number} width - length of the labels
 */
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
