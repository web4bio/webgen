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
const createViolinPlot = async function(dataInput, violinDiv, curPlot, facetByFields) {
    
    facetByFields = facetByFields.map(item => item === "tumor_type" ? "cohort" : item);

    // Get the num of the div so that the id of everything else matches. Will be used later when creating svg and tooltip
    let divNum = violinDiv.id[violinDiv.id.length - 1];

    let clinicalData = "";
    
    // if at least one facet field is selected, then get its clinical data from the cache
    if(facetByFields.length > 0) {
        clinicalData = await cache.get('rnaSeq', 'clinicalData');
        clinicalData = clinicalData.clinicalData;
    }
    
    // Set up basis for violin curve colors
    var colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
                    "#ffff33","#a65628","#f781bf","#999999"];
    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }
    shuffle(colors);
    var violinCurveColors = [];

    // Set up the figure dimensions:
    var margin = {top: 0, right: 30, bottom: 10, left: 40},
        width = 505 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    // Filter out patients with null expression values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    // Filter out data that does not belong to curPlot (ie, for this gene)
    dataInput = dataInput.filter(patientData => patientData.gene == curPlot);

    // Checking that filtered data length is > 0
    if(dataInput.length <= 0) {
        return;
    }

    let myGroups = [];

    // If user has selected fields to facet by
    if(facetByFields.length > 0) {
        for(let i = 0; i < dataInput.length; i++) {
            // Get matching index in clinicalData for current patient index in dataInput
            let patientIndex = findMatchByTCGABarcode(dataInput[i], clinicalData);
         
            if(patientIndex >= 0) {
                // Create keyToFacetBy for each patient
                let keyToFacetBy = facetByFields.map(field => clinicalData[patientIndex][field]).join(" ");
                dataInput[i]["facetByFieldKey"] = keyToFacetBy;
            } else {
                // Handle edge case for 'NA'
                dataInput[i]["facetByFieldKey"] = "(NA)";
            }
        }

        myGroups = d3.map(dataInput, d => d.facetByFieldKey).keys();
    } else {
        // Default to showing the whole cohort if no facet fields are selected
        myGroups = ["My cohort"];
        dataInput.forEach(d => {
            d.facetByFieldKey = "My cohort"; // Set the facet key for all entries to "My cohort"
        });
    }

    // Compute counts for each violin curve group
    let myGroupCounts = {};
    for(let group of myGroups) {
        myGroupCounts[group] = dataInput.filter(d => d.facetByFieldKey === group).length;
    }

    // Populate violinCurveColors
    for (let index = 0; index < myGroups.length; index++) {
        violinCurveColors.push(colors[index % colors.length]);
    }

    // Build SVG Object
    let svgID = "svgViolinPlot" + divNum;
    let svgDivId = `svgViolin${divNum}`;

    let svgObject = d3.select("#" + svgDivId).append("svg")
        .attr("viewBox", `0 -35 505 300`)
        .attr("id", svgID)
        .attr("indepVarType", "gene")
        .attr("cohort", curPlot)
        .append("g")
        .attr("id", (svgID + 'Position'))
        .attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")");

    // Get min and max expression values for y axis:
    const geneExpressionValues = dataInput.map(d => d.expression_log2);
    const minExpressionLevel = Math.min(...geneExpressionValues);
    const maxExpressionLevel = Math.max(...geneExpressionValues);

    // Build and show the Y scale
    const y = d3.scaleLinear()
        .domain([minExpressionLevel - 2, maxExpressionLevel + 2])
        .range([height, 0]);
    svgObject.append("g").call(d3.axisLeft(y)).style("font-size", "8px");

    // Append y-axis label
    svgObject.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -(height / 2.0))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "9px")
        .text("Expression Level (log2)");

    // Build and show the X scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01);

    svgObject.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll(".tick text")
        .attr("transform", "rotate(-20), translate(-10, 5)")
        .call(wrap, x.bandwidth())
        .style("font-size", "8px");

    // Set up distributions and statistics info for each gene's expression
    const kde = kernelDensityEstimator(kernelEpanechnikov(0.7), y.ticks(50));
    let sumstat;

    if (facetByFields.length === 0) {
        // Create a single entry for "My cohort" and compute density for the entire dataset
        const input = dataInput.map(d => d.expression_log2);
        sumstat = [{ key: "My cohort", value: kde(input) }];
    } else {
        // If facetByFields is not empty, proceed with nesting
        sumstat = d3.nest()                                               
            .key(d => d.facetByFieldKey)
            .rollup(d => kde(d.map(g => g.expression_log2)))
            .entries(dataInput);
    }

    // Calculate statistics for each group
    let maxNum = 0;
    for (let i in sumstat) {
        const allBins = sumstat[i].value;
        const lengths = allBins.map(a => a.length);
        const longest = d3.max(lengths);

        if (longest > maxNum) {
            maxNum = longest;
        }

        let currentExpressionArray = dataInput.filter(x => x.facetByFieldKey === sumstat[i].key)
            .map(d => d.expression_log2)
            .sort((a, b) => a - b);

        // Calculate statistics
        sumstat[i].median = d3.quantile(currentExpressionArray, 0.5);
        sumstat[i].Qthree = d3.quantile(currentExpressionArray, 0.75);
        sumstat[i].Qone = d3.quantile(currentExpressionArray, 0.25);
        sumstat[i].average = average(currentExpressionArray);
        sumstat[i].standardDeviation = Number(standardDeviation(sumstat[i].average, currentExpressionArray));
        sumstat[i].min = Number(currentExpressionArray[0]);
        sumstat[i].max = Number(currentExpressionArray[currentExpressionArray.length - 1]);
        sumstat[i].nSamples = Number(myGroupCounts[sumstat[i].key]);
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
                                "Max: " + String(d.max.toFixed(4)) + spacing +
                                "Number of Samples: " + String(d.nSamples)
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

    // xVals will store the specific x-coordinates to place the box-and-whisker plots for each violin curve
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

    // Embed box-and-whisker plot inside of each violin curve
    for(var index = 0; index < sumstat.length; index++)
    {
        // Adding whisker on the box-and-whisker plot
        svgObject.append("line")
            .attr("x1", xVals[index])
            .attr("x2", xVals[index])
            .attr("y1", y(sumstat[index].min))
            .attr("y2", y(sumstat[index].max))
            .attr("stroke", "black")
            .attr("stroke-width", x.bandwidth()/500);

        // Adding rectangle for each box-and-whisker plot
        var rectWidth = x.bandwidth()/25;
        svgObject.append("rect")
            .attr("x", xVals[index] - rectWidth/2)
            .attr("y", y(sumstat[index].Qthree))
            .attr("height", y(sumstat[index].Qone) - y(sumstat[index].Qthree))
            .attr("width", rectWidth)
            .attr("stroke", "black")
            .style("stroke-width", x.bandwidth()/500)
            .attr("fill", "none");

        // Median line for box-and-whisker plot
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
        .attr("x", width/2)
        .attr("y", -25)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(curPlot);
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
 * @returns {function} kernel density estimation
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
 * @param {?HTMLDivElement} partitionDivId - the html id passed over for the violinsDiv
 * @param {string[]} geneQuery - Array of gene names
 * @returns {string[]} list of choices for the partition box
 */
let createViolinPartitionBox = async function(partitionDivId, geneQuery)
{
    var div_box = d3.select(`#${partitionDivId}`);
    div_box
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Select partition variables')
        .attr("class", "col s3")
        .style("margin-top", "30px")
        .style("margin-left", "20px");
    div_box.append('br')
    div_box.append('div')
        .attr('class','viewport')
        .attr("id", "partitionSelectViolinPlot")
        .style('overflow-y', 'scroll')
        .style('height', '365px')
        .style('width', '300px')
        .style('text-align', 'left')
        .style("font-size", "14px")
        .append('div')
        .attr('class','body');
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
    }

  // function to create a pair of checkbox and text
    function renderCB(div_obj, data) {
        const label = div_obj.append('div')
        const label2 = label.append("label")
        label2.append("input")
            .attr('id', data)
           .attr("class", "myViolinCheckbox")
           .attr("value", data)
           .attr("type", "checkbox")
           .on('change', function () {
                update();
                rebuildViolinPlot(partitionDivId, geneQuery);
            });

        label2.append("span")
           .text(' ' + data)
           .style('font-weight', 'normal')
           .style("color", "#5f5f5f");
    }

    // data to input = clinical vars from query
    let partitionVars = localStorage.getItem("mutationAndClinicalFeatureKeys").split(",");
    let var_opts = partitionVars;

    // make a checkbox for each option
    
    const unwantedKeys = new Set(['date', 'tcga_participant_barcode', 'tool']);
    var_opts = var_opts.filter(item => !unwantedKeys.has(item));
    var_opts = var_opts.map(item => item === "cohort" ? "tumor_type" : item);
    var_opts.forEach(el => renderCB(div_body,el))
    update();

    var choices = [];
    d3.select('#'+partitionDivId).selectAll(".myViolinCheckbox").each(function(d)
    {
        let cb = d3.select(this);
        if(cb.property('checked')){ choices.push(cb.property('value')); };
    });
    return choices;
}

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
 * @param {?HTMLDivElement} partitionBoxId - the html id passed over for the violinsDiv 
 * @param {string[]} geneQuery - Array of gene names
 * @returns {undefined} 
 */
let rebuildViolinPlot = async function(partitionBoxId, geneQuery) {
    var selectedOptions = getPartitionBoxSelections(partitionBoxId);

    for(var index = 0; index < geneQuery.length; index++) {
        var svgDivId = "svgViolin" + index;
        var svgDiv = document.getElementById(svgDivId);
        svgDiv.innerHTML = "";
        var violinDivId = "violinPlot" + index;
        let expressionData = await cache.get('rnaSeq', 'expressionData');
        createViolinPlot(expressionData.expressionData, document.getElementById(violinDivId), geneQuery[index], selectedOptions);
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

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
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