// Async function to create a d3 heatmap for a given independent variable and a set of genes

// expressionData is the array os JSONs of gene expression data to visualize
// clinicalAndMutationData is the array containing clinical data
// divObject is the div object on the html page to build the plot

/** Create the heatmap.
 *
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 * @param {ClinicalData[]} clinicalAndMutationData - Array of clinical and mutation data objects.
 * @param {HTMLDivElement} divObject - An HTML div element in which to put heatmap.
 *
 * @returns {undefined}
*/
const createHeatmap = async function (expressionData, clinicalAndMutationData, divObject) {
    ///// BUILD SVG OBJECTS /////
    // Create div for clinical feature sample track variable selector as scrolling check box list
    // Note that we are using the Grid system for Materialize
    var gridRow = divObject.append("div");
    gridRow.attr("id", "heatmapGridRow").attr("class", "row");
    // var optionsPanel = getElementById('violinPlots');
    // optionsPanel.style('margin-top', '0');
    //Append column for div options panel
    var div_optionsPanels = gridRow.append('div');
    div_optionsPanels.attr("id", "optionsPanels");
    div_optionsPanels.attr("class", "col s3");
    div_optionsPanels.style("margin-top", "30px");
    div_optionsPanels.style("margin-left", "20px");
    var div_clinSelect = div_optionsPanels.append('div');
    div_clinSelect.attr("id", "heatmapPartitionSelector");
    div_clinSelect.append('text')
        .style('font-size', '20px')
        .text('Select clinical variables\nto display sample tracks:');
    div_clinSelect
        .append('div')
        .attr('class', 'viewport')
        .style('overflow-y', 'scroll')
        .style('height', '365px')
        .style('width', '300px')
        .style('text-align', 'left')
        .append('div')
        .attr('class', 'clin_selector');
    let div_selectBody = div_clinSelect.select('.clin_selector'); // body for check vbox list
    // var selectedText = div_clinSelect.append('text') // text to update what variables selected
    //     .style('font-size', '16px');
    // div_clinSelect.append('div')
    //     .append('button') // button to update heatmap, define update function below
    //     .attr('type', 'button')
    //     .attr('class', 'updateHeatmapButton')
    //     .text('Update heatmap');

    // functions to get check box selection and update text
    var choices;
    function getClinvarSelection() {
        choices = [];
        div_selectBody.selectAll('.myCheckbox').each(function(d){
            let cb = d3.select(this);
            if(cb.property('checked')){ choices.push(cb.property('value')); };
          });
        return choices
    };
    function updateSelectedText() {
        choices = getClinvarSelection();
        if(choices.length > 0){ selectedText.text('Selected: ' + choices.join(', ')); }
        else { selectedText.text('None selected'); };
    };

    // function to create a pair of checkbox and text
    function renderCB(div_obj, id) {
        const label = div_obj.append('div');
        label.append('input')
            .attr('id', 'check' + id)
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('value', id)
            .on('change', function () {
                // updateSelectedText();
                sortGroups();
                updateHeatmap();
            })
            .attr('style', 'opacity: 1; position: relative; pointer-events: all');
        label.append('text')
            .text(' ' + id);
    };
    // populate clinical feature sample track variable selector
    // get unique clinical features
    var clin_vars = Object.keys(clinicalAndMutationData[0]).sort();
    clin_vars.forEach(el => renderCB(div_selectBody, el));

    // automatically check off selected boxes from clinical query box
    sampTrackVars = $('.clinicalMultipleSelection').select2('data').map((el) => el.id);
    sampTrackVars.forEach(id => {
        div_selectBody.select('#check'+id).property('checked', true);
    });
    // updateSelectedText();

    // Create div for sorting options (checkboxes)
    var sortOptionDiv = div_optionsPanels.append('div')
        .text('Sort options: ')
        .style('font-size', '20px');
    // var sortCurrentText = sortOptionDiv
    //     .append('tspan')
    //     .text('mean expression (default)');
    var toggle_str =
        "<label class='switch'>" +
        "Mean Expression" +
        "<input type='checkbox' id='toggleClust'>" +
        "<span class='lever'></span>" +
        "Hierarchical Clustering" +
        "</label>";
    sortToggleDiv = sortOptionDiv.append("div")
        .attr("align", "center")
        .attr("class", "switch")
        .style("padding-bottom", "10px")
        .html(toggle_str);
    toggleClust = sortToggleDiv.select("#toggleClust")
    toggleClust.on('change', function () {
        // function to update state of sortCurrentText and doCluster
        // sortCurrentText.text(this.checked ? 'hierarchical clustering' : 'mean expression (default)');
        doCluster = (this.checked ? true : false);
        sortGroups();
        updateHeatmap();
    });

    ///// BUILD SVG OBJECTS /////
    // Set up dimensions for heatmap:
    var margin = { top: 80, right: 20, space: 5, bottom: 30, left: 50},//100 },
        frameWidth = 1050,
        heatWidth = frameWidth - margin.left - margin.right,
        legendWidth = 50,
        heatHeight = 300,
        sampTrackHeight = 25,
        dendHeight = Math.round(heatHeight / 2),
        frameHeight = margin.top + heatHeight + margin.space + dendHeight + margin.bottom;
        xAxisHeight = frameHeight - 5
        yAxisHeight = Math.round(frameHeight / 1.5)
    // Create svg object frame for the plots
    var heatmapCol = gridRow.append('div');
    heatmapCol.attr("class", "col s8");
    //Place heatmap in right-hand column
    var svg_frame = heatmapCol.append('svg')
        .attr('width', frameWidth)
        .attr('height', frameHeight);

    // Add title listing cohorts
    // Get unique cohort IDs (for title)
    const cohortIDs = d3.map(expressionData, d => d.cohort).keys();
    svg_frame.append("text")
        .attr('id', 'heatmapTitle')
        .attr("x", margin.left)
        .attr("y", margin.top - 25)
        .style("font-size", "26px")
        .text("Gene Expression Heatmap for " + cohortIDs.join(' and '));

    svg_frame.append("text")
        .attr('id', 'heatmapXAxisLabel')
        .style("font-size", "14px")
        .attr("transform", `translate(${Math.round(frameWidth / 2)},${xAxisHeight})`)
        .text("Patient Samples");

    svg_frame.append("text")
        .attr('id', 'heatmapYAxisLabel')
        .style("font-size", "14px")
        .attr("transform", `translate(15,${yAxisHeight}),rotate(-90)`)
        .text("Transcripts");    

    // Add nested svg for dendrogram
    var svg_dendrogram = svg_frame
        .append("svg")
        .attr("class", "dendrogram")
        .attr("width", heatWidth)
        .attr("height", dendHeight)
        .attr("x", margin.left)
        .attr("y", margin.top);

    // Add nested svg for sampletrack
    var svg_sampletrack = svg_frame
        .append("svg")
        .attr("class", "sampletrack")
        .attr("width", frameWidth)
        .attr("height", margin.space + sampTrackHeight)
        .attr("y", margin.top + dendHeight + margin.space)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.space + ")");

    // Add nested svg for heatmap
    var svg_heatmap = svg_frame
        .append("svg")
        .attr("class", "heatmap")
        .attr("width", frameWidth)
        .attr("height", heatHeight + margin.space + margin.bottom)
        .attr("y", margin.top + dendHeight + margin.space + sampTrackHeight + margin.space)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.space + ")");

    // Create div for tooltip
    var div_tooltip = heatmapCol
        .append("div")
        .style("opacity", 1)
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style('width', frameWidth + 'px');
    div_tooltip.html("\xa0\xa0Hover over an element to use tooltip.");

    // Add div for sample track legend
    var div_sampLegend = heatmapCol
        .append("div")
        .attr("class", "legend")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style('width', frameWidth + 'px')
        .style('height', frameHeight/2);
    div_sampLegend
        .append("text")
        .style("font-size", "18px")
        .text("Clinical Feature Sample Tracks Legend:");
    var svg_sampLegend = div_sampLegend
        .append("div")
        .attr('id', 'legend')
        .attr('class', 'viewport')
        .style('overflow', 'scroll')
        .append("svg")
        .attr("class", "sampLegend")
        .attr("width", frameWidth)
        .attr("height", sampTrackHeight + 2 * margin.space)
        .append("g")
        .attr("transform", "translate(" + margin.space + "," + margin.space*3 + ")");


    ///// DATA PROCESSING /////
    // Set the columns to be the set of TCGA participant barcodes 'barcodes' and the rows to be the set of genes called 'geneID'
    // Get unique TCGA IDs
    var unique_ids = d3.map(expressionData, d => d.tcga_participant_barcode).keys();
    let barcodes = unique_ids;
    let geneID = d3.map(expressionData, d => d.gene).keys();

    // Cluster IDs by expression:
    // 1. Merge data into wide format (for hclust algorithm)
    var data_merge = mergeExpression(expressionData);

    // function for mean expression of a branch of tree
    function branchMean(branch) {
        let leaf_ind = [].concat.apply([], branch.leaves().map(el => el.data.indexes));
        return leaf_ind.reduce((a, b) => a + data_merge[b].exps.reduce((a,b) => a+b, 0), 0) / leaf_ind.length;
    };

    // 2. sort groups based on doCluster flag (controlled by sort options checkbox)
    // false: sort by mean expression (default)
    // true : sort by hierarchichal clustering
    var doCluster = false, clusterReady = false, clust_results, sortOrder, root;
    function sortGroups() {
        if (!data_merge || data_merge.length === 0) {
            console.error(
                'data_merge is undefined, null, or empty. Cannot sort groups.'
            );
            return;
        }
        if (doCluster && !clusterReady) { // do hierarchical clustering, if not already done (clusterReady)
            // call clustering function from hclust library
            clust_results = clusterData({
                data: data_merge,
                key: 'exps',
                onProgress: onClusteringProgress,
            });
            // re-sort clustering based on average expression within leaves
            root = d3.hierarchy(clust_results.clusters).sort((a,b) => d3.descending(branchMean(a),branchMean(b)));
            sortOrder =  [].concat.apply([], root.leaves().map(el => el.data.indexes));

            clust_results.order = sortOrder; // extract sort order from clust_results
            clusterReady = true;
        } else if (doCluster && clusterReady) { // if clustering already done, no need to re-run
            sortOrder = clust_results.order;
        }
        else { // sort by mean expression
            // compute expression means
            const ngene = data_merge[0].genes.length;
            const means = data_merge.map(el => (el.exps.reduce((acc, val) => acc + val, 0)) / ngene);

            // sort by mean value
            sortOrder = new Array(data_merge.length);
            for (var i = 0; i < data_merge.length; ++i) sortOrder[i] = i;
            sortOrder.sort((a, b) => { return means[a] > means[b] ? -1 : 1; });
        }
        barcodes = unique_ids;
        barcodes = sortOrder.map(i => barcodes[i]);
    };
    sortGroups();


    ///// Build the Axis and Color Scales Below /////
    // Build x scale for heatmap
    let x = d3.scaleBand()
        .range([0, heatWidth - legendWidth])
        .domain(barcodes);

    // Build y scale for heatmap
    let y = d3.scaleBand()
        .range([0, heatHeight])
        .domain(geneID);

    // Define minZ and maxZ for the color interpolator
    let minZ = -2,
        maxZ = 2;

    // Position scale for the legend
    let zScale = d3.scaleLinear().domain([minZ, maxZ]).range([heatHeight, 0]);

    // Create zArr array to build legend:
    let zArr = [];
    let step = (maxZ - minZ) / (1000 - 1);
    for (var i = 0; i < 1000; i++) {
        zArr.push(minZ + (step * i));
    };

    // Build color scale for gene expression (z-score)
    let interpCol_exp = d3.interpolateRgbBasis(["blue", "white", "red"])
    let colorScale_exp = d3.scaleSequential()
        .interpolator(interpCol_exp) // d3 interpolated color gradient
        .domain([minZ, maxZ]);

    // Elbow function for dendrogram connections
    function elbow(d) {
        const scale = dendHeight / root.data.height;
        return "M" + d.parent.x + "," + (dendHeight - d.parent.data.height * scale) + "H" + d.x + "V" + (dendHeight - d.data.height * scale);
    };

    // function to get width of bounding text box for a given string, font-size
    let svg_temp = heatmapCol.append("svg");
    function getTextWidth(str, fs) {
        let text_temp = svg_temp
            .append('text')
            .style('font-size', fs + "px")
            .text(str);
        var dim = text_temp.node().getBBox();
        svg_temp.html("");
        return dim.width
    };
    // function to get median of an array (for continuous variable color scale middle pivot)
    let median = function (x) {
        if (x.length % 2) {
            return x[Math.floor(x.length / 2)]; // if odd length take middle
        } else {
            return (x[Math.floor(x.length / 2) - 1] + x[Math.floor(x.length / 2)])/2; // if even length average middle 2
        };
    }



    ///// Build the Mouseover Tool Functions /////
    // Three functions that change the tooltip when user hover / move / leave a cell
    let mouseover = function (d) {
        // Make tooltip appear and color heatmap object black
        div_tooltip.style("opacity", 1);
        d3.select(this).style("fill", "black");
        // Make dendrogram path bold
        let id_ind = unique_ids.indexOf(d.tcga_participant_barcode);
        svg_dendrogram.selectAll('path')
            .filter(d => d.data.indexes.includes(id_ind))
            .style("stroke-width", "2px");
    };
    const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
    let mousemove = function (d) {
        if (!d.expression_log2) {d.expression_log2 = 0}; // catch error if null
        // Print data to tooltip from hovered-over heatmap element d
        div_tooltip.html("\xa0\xa0" +
            "Cohort: " + d.cohort + spacing +
            "TCGA Participant Barcode: " + d.tcga_participant_barcode + spacing +
            "Gene: " + d.gene + spacing +
            "Expression Level (log2): " + d.expression_log2.toFixed(5) + spacing +
            "Expression Z-Score: " + d["z-score"].toFixed(5));
    };
    let mouseleave = function (d) {
        // Make tooltip disappear and heatmap object return to z-score color
        div_tooltip.style("opacity", 0);
        d3.select(this).style("fill", d => colorScale_exp(d["z-score"]));
        // Make dendrogram path unbold
        let id_ind = unique_ids.indexOf(d.tcga_participant_barcode);
        svg_dendrogram.selectAll('path')
            .filter(d => d.data.indexes.includes(id_ind))
            .style("stroke-width", "0.5px");
    };
    let mousemove_samp = function (d) {
        let v = d3.select(this).attr("var");
        div_tooltip.html("\xa0\xa0" +
            "Cohort: " + d.cohort + spacing +
            "TCGA Participant Barcode: " + d.tcga_participant_barcode + spacing +
            v + ": " + d[v]);
    };
    let mouseleave_samp = function (d) {
        div_tooltip.style("opacity", 0);
        d3.select(this).style("fill", d3.select(this).attr("fill0")); // re-fill color based on stored attribute
        // Make dendrogram path unbold
        let id_ind = unique_ids.indexOf(d.tcga_participant_barcode);
        svg_dendrogram.selectAll('path')
            .filter(d => d.data.indexes.includes(id_ind))
            .style("stroke-width", "0.5px");
    };


    ///// Build the Heatmap, Legend, and Dendrogram Below /////
    // Append the y-axis to the heatmap:
    svg_heatmap.append("g")
        .style("font-size", 9.5)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();
    // Build the Legend:
    svg_heatmap.selectAll()
        .data(zArr)
        .enter()
        .append('rect')
        .attr('x', heatWidth - margin.right)
        .attr('y', d => zScale(d))
        .attr("width", legendWidth / 2)
        .attr("height", 1 + (heatHeight / zArr.length))
        .style("fill", d => colorScale_exp(d));
    // Append the z-axis to the legend:
    svg_heatmap.append("g")
        .style("font-size", 10)
        .attr("transform", "translate(" + heatWidth + ",0)")
        .call(d3.axisRight().scale(zScale).tickSize(5).ticks(5));

    ///// Update function for creating plot with new order (clustering), new sample tracks
    function updateHeatmap() {
        // Build new x scale based on borcodes (in case re-sorted)
        x = x.domain(barcodes);

        // Re/build the heatmap (selecting by custom key 'tcga_id:gene'):
        svg_heatmap.selectAll()
            .data(expressionData, d => (d.tcga_participant_barcode + ':' + d.gene))
            .enter()
            .append("rect")
            .attr("x", d => x(d.tcga_participant_barcode))
            .attr("y", d => y(d.gene))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale_exp(d["z-score"]))
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Re/build sample tracks (currently only handles categorical data)
        // Get sample track selected vars (only in observable)
        let sampTrackVars = getClinvarSelection();
        // make new structure with fields for variable varname, domain of unique values, vartype (default categorical)
        // also for legend: max size of variable name and all unique variable labels (for column width), and number of variables (for legend height)
        let sampTrack_obj = sampTrackVars.map(v => {
            // get all values for variable v
            let domain = clinicalAndMutationData.filter(el => (barcodes.includes(el.tcga_participant_barcode)))
            .map(d =>  d[v]).filter(el => el !== "NA").sort();
            domain = [...new Set(domain)]; // get unique values only

            // determine if variable categorical or continuous (numeric)
            let continuousMap = clinicalAndMutationData.map(x => x[v].match(/^[0-9/.]+$/));
            let percentNull = continuousMap.filter(x => x == null).length / continuousMap.length;
            let type = "categorical"; // assume categorical by default
            if(percentNull < 0.95 & (v != 'vital_status')) {
              type = "continuous";
              domain = domain.map(el => Number(el)).filter(el => !Number.isNaN(el)).sort((a,b) => a-b);
            };

            // estimate text sizes needed for each column using getTextWidth() command on variable name and labels
            let var_width = getTextWidth(v + ":\xa0", 15); // text width of variable name
            let lab_width = Math.max(...domain.map(el => getTextWidth("\xa0" + el, 10))); // max text width of each unique label

            // calculate width and height of legend column for this variable
            let leg_wd = Math.ceil(Math.max(lab_width + sampTrackHeight, var_width));
            let leg_ht = (sampTrackHeight + margin.space) * domain.length;
            if (type == "continuous") {leg_ht = heatHeight + margin.space} // if continuous, make height equal to colorbar (heatHeight same as heatmap colorbar)

            // return summary of variable data
            return { varname: v, vartype: type, domain: domain, nlab: domain.length, leg_width: leg_wd, leg_height: leg_ht };
        });
        // calculate cumulative sum of column widths with spacing for x-positioning each variable (for legend)
        const cumulativeSum = (sum => value => sum += value)(0);
        let x_spacing = sampTrack_obj.map(el => el.leg_width + margin.space).map(cumulativeSum);
        sampTrack_obj = sampTrack_obj.map(o => { o.x = x_spacing[sampTrack_obj.indexOf(o)] - o.leg_width; return o });

        // Build color scales for all selected variables
        // adjust scales for categorical or continuous
        let colorScale_all = sampTrack_obj.reduce( (acc,el) => {
            if (el.vartype == "continuous") {
                acc[el.varname] = d3.scaleLinear()
                    .domain([Math.min(...el.domain), median(el.domain), Math.max(...el.domain)]) // compute median for middle pivot in color scale
                    .range([ "green", "white", "orange"]);
            } else {
                acc[el.varname] = d3.scaleOrdinal()
                    .domain(el.domain)
                    .range(d3.schemeCategory10)
                    .unknown("lightgray");
            };
            return acc
        }, {});

        // Recompute total sample tracks height and update svg_sampletrack height
        let sampTrackHeight_total = (sampTrackHeight + margin.space) * sampTrackVars.length;
        svg_frame.select('.sampletrack').attr('height', sampTrackHeight_total);

        // Build new scale for sample track labels:
        let y_samp = d3.scaleBand()
            .range([0, sampTrackHeight_total])
            .domain(sampTrackVars);

        // Build sample track for each variable
        svg_sampletrack.html(""); // have to clear to keep some spaces as white
        sampTrackVars.forEach(v => {
            svg_sampletrack.selectAll()
                .data(clinicalAndMutationData.filter(el => (barcodes.includes(el.tcga_participant_barcode))),
                    d => (d.tcga_participant_barcode + ":" + v))
                .enter()
                .append("rect")
                .attr("var", v)
                .attr("x", d => x(d.tcga_participant_barcode))
                .attr("y", y_samp(v))
                .attr("width", x.bandwidth())
                .attr("height", sampTrackHeight)
                .style("fill", d => {if (d[v]=="NA") {return "lightgray"} else {return colorScale_all[v](d[v])} }) // catch NA manually since d3.scaleLinear has no unknown option
                .attr("fill0", d => {if (d[v]=="NA") {return "lightgray"} else {return colorScale_all[v](d[v])} })
                .on("mouseover", mouseover)
                .on("mousemove", mousemove_samp)
                .on("mouseleave", mouseleave_samp);
        });
        // Append labels axis to the sample track:
        svg_sampletrack.select('#sampLabels').remove(); // first remove previous labels
        svg_sampletrack.append("g")
            .attr('id', 'sampLabels')
            .style('font-size', 9.5)
            .call(d3.axisRight(y_samp).tickSize(0))
            .attr("transform", "translate(" + (heatWidth-legendWidth) + ",0)")
            .select(".domain").remove();

        // Sample Track Legend:
        // fill sample track legend based on info in sampTrack_obj
        svg_sampLegend.html("");
        sampTrack_obj.forEach(v => {
            svg_sampLegend // add variable title
                .append("text")
                .attr("x", v.x)
                .attr("alignment-baseline", "hanging")
                .style("font-size", "15px")
                .attr("text-decoration", "underline")
                .text(v.varname + ":");
            if (v.vartype == "categorical" ) { // if categorical, then make boxes for categorical labels
            svg_sampLegend.selectAll() // add box
                .data(v.domain, d => v.varname + ":" + d + "_box")
                .enter()
                .append("rect")
                .attr("x", v.x)
                .attr("y", (d, i) => 20 + i * (sampTrackHeight + margin.space))
                .attr("width", sampTrackHeight)
                .attr("height", sampTrackHeight)
                .style("fill", d => colorScale_all[v.varname](d))
                .style("stroke", "black");
            svg_sampLegend.selectAll() // add label
                .data(v.domain, d => v.varname + ":" + d + "_text")
                .enter()
                .append("text")
                .attr("x", v.x + sampTrackHeight)
                .attr("y", (d, i) => 20 + i * (sampTrackHeight + margin.space) + sampTrackHeight / 2)
                .attr("alignment-baseline", "central")
                .style("font-size", "10px")
                .text(d => "\xa0" + d);
            } else { // if not categorical, then make legend colorbar for continuous variable
                // Position scale for the legend
                let minV = Math.min(...v.domain)
                let maxV = Math.max(...v.domain)
                let vScale = d3.scaleLinear().domain([minV, maxV]).range([heatHeight, 0]);

                let vArr = []; // Create vArr array to build legend:
                let step = (maxV - minV) / (1000 - 1);
                for (var i = 0; i < 1000; i++) {
                    vArr.push(minV + (step * i));
                };
                svg_sampLegend.selectAll() // Build continuous Legend:
                    .data(vArr)
                    .enter()
                    .append('rect')
                    .attr('x', v.x)
                    .attr('y', d => 20 + vScale(d))
                    .attr("width", sampTrackHeight)
                    .attr("height", 1 + (heatHeight / vArr.length))
                    .style("fill", d => colorScale_all[v.varname](d));
                svg_sampLegend.append("g") // Append axis to legend:
                    .style("font-size", 10)
                    .attr("transform", "translate(" + (v.x + sampTrackHeight) + ",20)")
                    .call(d3.axisRight().scale(vScale).tickSize(5).ticks(5))
                svg_sampLegend.append("text")
                    .attr('transform', "translate(" + (v.x + 4) + "," + (vScale(median(v.domain)) + 20) + ")")
                    .style("font-size", "5px")
                    .text("median");
            };
        });

        // adjust sampLegend size based on legend sizes for each variable: maximum height, sum of widths
        let sampLegendHeight = 20 + (Math.max(...sampTrack_obj.map(el => el.leg_height),0)) + margin.space;
        div_sampLegend.select(".sampLegend")
            .attr("height", sampLegendHeight)
            .attr("width", sampTrack_obj.reduce((a, b) => a + b.leg_width + sampTrackHeight + margin.space, 0));
        if (sampLegendHeight < 200) {
            div_sampLegend.select('#legend')
                .style('height', (sampLegendHeight + margin.space) + 'px');
        } else {
            div_sampLegend.select('#legend')
                .style('height', '200px');
        };

        if (sampTrackVars.length == 0) {
            svg_sampLegend
                .append("text")
                .attr("alignment-baseline", "hanging")
                .style("font-size", "18px")
                .text("No clinical features selected");
            div_sampLegend.select(".sampLegend")
                .attr("height", 20)
                .attr("width", 250);
            div_sampLegend.select('#legend')
                .style('height', '20px');
        };

        // Generate dendrogram IF clustering selected and ready
        if (doCluster && clusterReady) { // only show dendrogram if these flags indicate to show
            // Build dendrogram as links between nodes:
            var cluster = d3.cluster().size([heatWidth - legendWidth, dendHeight]); // match dendrogram width to heatmap x axis range
            root = d3.hierarchy(clust_results.clusters).sort((a,b) => d3.descending(branchMean(a),branchMean(b)));
            cluster(root);

            // Build dendrogram as links between nodes:
            svg_dendrogram.selectAll('path')
                .data(root.descendants().slice(1))
                .enter()
                .append('path')
                .attr("d", elbow)
                .style("fill", 'none')
                .style("stroke-width", "0.5px")
                .attr("stroke", 'black');

            // Give dendrogram svg height and shift down heatmap + sampletracks
            svg_dendrogram.attr("height", dendHeight);
            svg_frame.select(".sampletrack")
                .attr("y", margin.top + dendHeight)
            svg_frame.select(".heatmap")
                .attr("y", margin.top + dendHeight + sampTrackHeight_total);
            frameHeight = margin.top + dendHeight + margin.space + heatHeight + sampTrackHeight_total + margin.bottom;

            yAxisHeight = Math.round(frameHeight - (frameHeight / 4))
            xAxisHeight = frameHeight - 5
        } else { // otherwise remove the dendrogam and shift the heatmap up
            svg_dendrogram.attr("height", 0);
            svg_frame.select(".sampletrack")
                .attr("y", margin.top)
            svg_frame.select(".heatmap")
                .attr("y", margin.top + sampTrackHeight_total);
            frameHeight = margin.top + heatHeight + sampTrackHeight_total + margin.bottom;

            yAxisHeight = Math.round(frameHeight / 1.5)
            xAxisHeight = frameHeight - 5
        }
        svg_frame.select("#heatmapYAxisLabel")
            .attr("transform", `translate(15,${yAxisHeight}),rotate(-90)`)
        svg_frame.select("#heatmapXAxisLabel")
            .attr("transform", `translate(${Math.round(frameWidth / 2)},${xAxisHeight})`)
        // apply new frameHeight (adjusting for dendrogram and # sample tracks)
        svg_frame.attr('height', frameHeight);
    };
    updateHeatmap();
};
