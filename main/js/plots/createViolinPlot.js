// Async function to create a d3 violin plot for a given independent variable and a set of genes

// expression_data is the array os JSONs of gene expression data to visualize
// violin_div is the name of the object on the html page to build the plot
// curPlot is the name of the Expression vs. indeptVarType plot we are generating
// facet_by_fields are the clinical fields selected in the partition selection box

let tooltipNum = 0;

const normalizeCategoryLabel=(label)=>String(label).replaceAll("_", " ")

/** Create violin plots;
 *
 * @param {ExpressionData[]} expression_data - Array of expression data objects.
 * @param {HTMLDivElement} violin_div - Div element in which to put violin plot.
 * @param {string} curPlot - Gene for this plot.
 * @param {string[]} facet_by_fields - Variables to partition violin curves by.
 *
 * @returns {undefined}
*/
const createViolinPlot = async function(expression_data, 
    violin_div,
    curPlot, 
    facet_by_fields = [],
    clinical_and_mutation_data, 
    mutation_genes) {
    
    facet_by_fields = facet_by_fields.map(item => item === "tumor_type" ? "cohort" : item);

    // Get the num of the div so that the id of everything else matches. Will be used later when creating svg and tooltip
    let divNum = violin_div.id.replace(/\D/g, '');
    // Flatten barcodes into a 1-D array
    let cohort_barcodes = expression_data.map(obj => obj.tcga_participant_barcode);
    // Set up basis for violin curve colors
    var colors = ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
                    "#ffff33","#a65628","#f781bf","#999999"];
    function shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }
    shuffle(colors);
    var violinCurveColors = [];

    // --------------------------------------------------------------

    // Set up the figure dimensions:
    var margin = {top: 40, right: 30, bottom: 80, left: 40};
     // baseInnerWidth = 505 - margin.left - margin.right
    const minBandWidth=65; //min horizontal space per group before enabling horizontal scroll
    const shouldExpandRight = facet_by_fields.length>=2; // expand plot right if more than 2 partition vars are selected
    // const height = 200 - margin.top - margin.bottom;

    // Filter out patients with null expression values:
    expression_data = expression_data.filter(patientData => patientData.expression_log2 != null);
    //  Filter out data that does not belong to curPlot (ie, for this gene)
    expression_data = expression_data.filter(patientData => patientData.gene == curPlot);
    // Checking that filtered data length is > 0
    if(expression_data.length <= 0) {
        return;
    }

    let myGroups = [];

    // If user has selected fields to facet by
    if(facet_by_fields.length > 0) {
        for(let i = 0; i < expression_data.length; i++) {
            // Get matching index in clinical_and_mutation_data for current patient index in expression_data
            let patientIndex = findMatchByTCGABarcode(expression_data[i], clinical_and_mutation_data);
            if(patientIndex >= 0) {
                // Create keyToFacetBy for each patient
                let keyToFacetBy = facet_by_fields.map(field => clinical_and_mutation_data[patientIndex][field]).join(" ");
                expression_data[i]["facetByFieldKey"] = keyToFacetBy;
            } else {
                // Handle edge case for 'NA'
                expression_data[i]["facetByFieldKey"] = "(NA)";
            }
        }

        myGroups = d3.map(expression_data, d => d.facetByFieldKey).keys();
    } else {
        // Default to showing the whole cohort if no facet fields are selected
        myGroups = ["My cohort"];
        expression_data.forEach(d => {
            d.facetByFieldKey = "My cohort"; // Set the facet key for all entries to "My cohort"
        });
    }

    // Compute counts for each violin curve group
    let myGroupCounts = {};
    for(let group of myGroups) {
        myGroupCounts[group] = expression_data.filter(d => d.facetByFieldKey === group).length;
    }

    // Populate violinCurveColors
    for (let index = 0; index < myGroups.length; index++) {
        violinCurveColors.push(colors[index % colors.length]);
    }

    

    // Build SVG Object
    let svgID = "svgViolinPlot" + divNum;
    let svgDivId = `svgViolin${divNum}`;

    const svgContainer=d3.select("#" + svgDivId)
        .style("width", "100%")
        .style('overflow-x','auto')
        .style('overflow-y','hidden')
        .style('max-width', '100%')
        
    
    // const fallbackInnerWidth=505-margin.left-margin.right;
    const containerNode=svgContainer.node();
    const containerPixelWidth = containerNode?.clientWidth || Math.min(window.innerWidth * 0.8, 1200);
    const availablePixelWidth=Math.max(0, Math.floor(containerPixelWidth) - margin.left - margin.right);

    // container-visible baseline width (no expansion case)
    const baseVisibleInnerWidth = Math.max(
        505 - margin.left - margin.right,
        availablePixelWidth
    );

    // width required to keep violin spacing constant
    const requiredInnerWidth = myGroups.length * minBandWidth;

    // only expand right after threshold is met
    const width = shouldExpandRight
        ? Math.max(baseVisibleInnerWidth, requiredInnerWidth)
        : baseVisibleInnerWidth;

    // const baseInnerWidth=Math.max(fallbackInnerWidth, availablePixelWidth);
    // const visibleGroupCount = 2;
    // const minVisibleWidth = Math.max(visibleGroupCount * minBandWidth, availablePixelWidth);
    // //expand plot width when many groups are selected
    // const width=Math.max(minVisibleWidth, myGroups.length*minBandWidth);
    const svgWidth = width + margin.left + margin.right;

    const containerHeight = containerNode?.clientHeight || Math.min(window.innerHeight * 0.6, 600);
    const availableHeight = Math.max(200, Math.floor(containerHeight) - margin.top - margin.bottom);
    const svgHeight = availableHeight + margin.top + margin.bottom;

    const height = availableHeight;

    let svgObject = svgContainer.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .attr("id", svgID)
        .attr("indepVarType", "gene")
        .attr("cohort", curPlot)
        .append("g")
        .attr("id", (svgID + 'Position'))
        .attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")");

    // Get min and max expression values for y axis:
    const geneExpressionValues = expression_data.map(d => d.expression_log2);
    const minExpressionLevel = Math.min(...geneExpressionValues);
    const maxExpressionLevel = Math.max(...geneExpressionValues);

    // Build and show the Y scale
    const y = d3.scaleLinear()
        .domain([minExpressionLevel - 2, maxExpressionLevel + 2])
        .range([height, 0]);
    svgObject.append("g").call(d3.axisLeft(y)).style("font-size", "12px");

    // Append y-axis label
    svgObject.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -(height / 2.0))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .text("Expression Level (log2)");

    // Build and show the X scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01);

    svgObject.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(normalizeCategoryLabel))
        .selectAll(".tick text")
        .attr("transform", "rotate(-20), translate(-10, 5)")
        .call(wrap, x.bandwidth())
        .style("font-size", "12px");

    // Set up distributions and statistics info for each gene's expression
    const kde = kernelDensityEstimator(kernelEpanechnikov(0.7), y.ticks(50));
    let sumstat;

    if (facet_by_fields.length === 0) {
        // Create a single entry for "My cohort" and compute density for the entire dataset
        const input = expression_data.map(d => d.expression_log2);
        sumstat = [{ key: "My cohort", value: kde(input) }];
    } else {
        // If facet_by_fields is not empty, proceed with nesting
        sumstat = d3.nest()                                               
            .key(d => d.facetByFieldKey)
            .rollup(d => kde(d.map(g => g.expression_log2)))
            .entries(expression_data);
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

        let currentExpressionArray = expression_data.filter(x => x.facetByFieldKey === sumstat[i].key)
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
                                "Cohort: " + normalizeCategoryLabel(d.key) + spacing +
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

    //Add title to graph
    svgObject.append("text")
        .attr("x", width/2)
        .attr("y", -25)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
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
 * @param {?HTMLDivElement} partition_div_id - the html id passed over for the violinsDiv
 * @param {string[]} geneQuery - Array of gene names
 * @returns {string[]} list of choices for the partition box
 */
let createViolinPartitionBox = async function(expression_data, partition_div_id, geneQuery, clinical_and_mutation_data, mutation_genes) {
    var div_box = d3.select(`#${partition_div_id}`);
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
                rebuildViolinPlot(expression_data = expression_data,
                    partitionBoxId = partition_div_id, 
                    geneQuery = geneQuery, 
                    clinical_and_mutation_data = clinical_and_mutation_data, 
                    mutation_genes = mutation_genes);
            });

        label2.append("span")
           .text(' ' + data)
           .style('font-weight', 'normal')
           .style("color", "#5f5f5f");
    }

    // Get potential stratification variables
    // We need to filter to clinical variables that are suitable for stratification
    let stratification_vars = [];
    if (clinical_and_mutation_data && clinical_and_mutation_data.length > 0) {
        // Get all keys from the clinical and mutation data
        const allKeys = Object.keys(clinical_and_mutation_data[0]);
        // Filter to variables that make sense for stratification
        stratification_vars = allKeys.filter(key => {
            // Skip technical IDs and dates
            if (key.includes('barcode') || 
                    key.includes('date') || 
                    key === 'tool' ||
                    key.includes('days')) {
                        return false;
            }
            // Skip genes not selected in mutations data explore
            if (key.includes("Mutation") && !mutation_genes.includes(key.split("_")[0]))
                return false
            
            // Count distinct values for this key
            const distinctValues = new Set();
            clinical_and_mutation_data.forEach(patient => {
                if (patient[key] !== 'NA' && patient[key] !== null && patient[key] !== undefined && patient[key] !== "(NA)") {
                    distinctValues.add(patient[key]);
                }
            });
            // Only use variables with 2-10 distinct values (categorical)
            return distinctValues.size >= 2 && distinctValues.size <= 10;
        });
    }  
    // Sort variables alphabetically
    stratification_vars.sort();
    // Make a checkbox for each option
    stratification_vars.forEach(el => renderCB(div_body,el))
    update();

    var choices = [];
    d3.select('#'+partition_div_id).selectAll(".myViolinCheckbox").each(function(d)
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
let rebuildViolinPlot = async function(expression_data, partitionBoxId, geneQuery, clinical_and_mutation_data, mutation_genes) {
    var selectedOptions = getPartitionBoxSelections(partitionBoxId);

    for(var index = 0; index < geneQuery.length; index++) {
        var svgDivId = "svgViolin" + index;
        var svgDiv = document.getElementById(svgDivId);
        svgDiv.innerHTML = "";
        var violinDivId = "violinPlot" + index;
        createViolinPlot(
            expression_data = expression_data, 
            violin_div = document.getElementById(violinDivId), 
            curPlot = geneQuery[index], 
            facet_by_fields = selectedOptions,
            clinical_and_mutation_data = clinical_and_mutation_data,
            mutation_genes = mutation_genes);
    }
};

/** Helper function to acquire the index of a patient's clinical data based on their tcga_participant_barcode
 * 
 * @param {ExpressionData[]} patient - expression data objects.
 * @param {clinical_and_mutation_data[]} clinical_and_mutation_data - Array of clinical and mutation data objects.
 * @returns {number} index of tcga_participant_barcode of patient in the clinical data 
 */
function findMatchByTCGABarcode(patient, clinical_and_mutation_data)
{
    for(var index = 0; index < clinical_and_mutation_data.length; index++)
    {
        if(clinical_and_mutation_data[index]["tcga_participant_barcode"] == (patient["tcga_participant_barcode"]))
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
            y = text.attr("y") || 0,
            dy = parseFloat(text.attr("dy")) || 0,
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