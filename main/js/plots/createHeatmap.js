// Async function to create a d3 heatmap for a given independent variable and a set of genes

// indepVarType is the type of independent variable for the plot (such as 'cohort' or 'mutatedGene')
    // NOTE: The function is currently only set to handle indepVarType='cohort'
// indepVar is the independent variable (ex1: 'PAAD', ex2: 'TP53')
// dataInput is the array os JSONs of gene expression data to visualize
// svgObject is the object on the html page to build the plot
 
createHeatmap = async function(indepVarType, indepVars, dataInput, svgObject) {

    ///// DATA PROCESSING /////
    // Set the columns to be the set of TCGA participant barcodes 'myGroups' and the rows to be the set of genes called 'myVars'
    let myGroups = d3.map(dataInput, function(d){return d.tcga_participant_barcode;}).keys();
    let myVars = d3.map(dataInput, function(d){return d.gene;}).keys();

    // Get unique TCGA IDs
    var unique_ids = d3.map(dataInput, function(d){return d.tcga_participant_barcode}).keys();
    
    // Cluster IDs by expression:
    // 1. Merge data into wide format (for hclust algorithm)
    var data_merge = mergeExpression(dataInput);
    // 2. Call clustering function from hclust library
    var clust_results = clusterData({data: data_merge, key: 'exps'});
    // 3. Extract order from clust_results, use to reorder myGroups
    const sortOrder = clust_results.order;
    myGroups = sortOrder.map(i => myGroups[i]);


    ///// BUILD SVG OBJECTS /////
    // Set up dimensions:
    var margin = {top: 80, right: 30, space:5, bottom: 30, left: 60},
        frameWidth = 1250, // ideally get from svgObject
        frameHeight = 500,
        heatWidth = frameWidth - margin.left - margin.right,
        heatHeight = Math.round((frameHeight - margin.top - margin.space - margin.bottom) * 2/3),
        legendWidth = 50,
        dendHeight = Math.round(heatHeight/2);

    // First add title to graph listing genes
    svgObject.append("text")
        .attr("x", margin.left)
        .attr("y", margin.top-25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Heatmap for "+indepVars.join(' and '))

    // create nested svg for dendrogram
    var svg_dendrogram = svgObject
        .append("svg")
        .attr("class", "dendrogram")
            .attr("width", heatWidth)
            .attr("height", dendHeight)
            .attr("x", margin.left)
            .attr("y", margin.top)

    // create nested svg for heatmap
    var svg_heatmap = svgObject
        .append("svg")
            .attr("class", "heatmap")
            .attr("width", frameWidth )
            .attr("height", heatHeight + margin.space + margin.bottom )
            .attr("y", margin.top+dendHeight)
            .append("g")
                .attr("transform","translate(" + margin.left + "," + margin.space+ ")");

    // create svg div for tooltip
    var tooltip = d3.select("#heatmapRef")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");


    ///// Build the Axis and Color Scales Below /////
    // Build x scale and axis for heatmap::
    let x = d3.scaleBand()
        .range([ 0, heatWidth-legendWidth ])
        .domain(myGroups);

    // Build y scale and axis for heatmap:
    let y = d3.scaleBand()
        .range([ heatHeight, 0 ])
        .domain(myVars);

    // Define minZ and maxZ for the color interpolator (this may become a user defined value later on):
    let minZ = -2;
    let maxZ = 2;

    // Position scale for the legend:
    let zScale = d3.scaleLinear().domain([minZ, maxZ]).range([heatHeight,0]);
    let legendAxis = d3.axisRight()
        .scale(zScale)
        .tickSize(5)
        .ticks(5);

    // Create zArr array to build legend:
    let zArr = [];
    let step = (maxZ - minZ) / (1000 - 1);
    for(var i = 0; i < 1000; i++) {
      zArr.push(minZ + (step * i));
    };

    // Build color scale
    let interpolateRdBkGn = d3.interpolateRgbBasis(["blue","white","red"])
    let myColor = d3.scaleSequential()
        .interpolator(interpolateRdBkGn)    // A different d3 interpolator can be used here for a different color gradient
        .domain([minZ, maxZ]);              // This domain scale will change the coloring of the heatmap.


    ///// Define Dendrogram Layout /////
    // Create the cluster layout:
    var cluster = d3.cluster().size([heatWidth - legendWidth, dendHeight]); // match dendrogram width to heatmap x axis range

    // Give the data to this cluster layout:
    var data = clust_results.clusters;
    var root = d3.hierarchy(data);
    cluster(root);

    // Elbow function for plotting connections
    const scale = dendHeight/root.data.height
    function elbow(d) {
        return "M" + d.parent.x + "," + (dendHeight-d.parent.data.height*scale) + "H" + d.x + "V" + (dendHeight-d.data.height*scale);
    };


    ///// Build the Mouseover Tool /////
    // Three functions that change the tooltip when user hover / move / leave a cell
    let mouseover = function(d) {
        // Make tooltip appear and color heatmap object black
        tooltip
            .style("opacity", 1);
        d3.select(this)
            .style("fill", "black")
        // Make dendrogram path bold
        let id_ind = unique_ids.indexOf(d.tcga_participant_barcode);           
        svg_dendrogram.selectAll('path')
            .filter(function (d) { return d.data.indexes.includes(id_ind)})
            .style("stroke-width","2px");
    };
    const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
    let mousemove = function(d) {
        // Print data to tooltip from hovered-over heatmap element d
        tooltip
            .html("\xa0\xa0" + 
                "Cohort: " + d.cohort + spacing +
                "TCGA Participant Barcode: " + d.tcga_participant_barcode + spacing +
                "Gene: " + d.gene + spacing +
                "Expression Level (log2): " + d.expression_log2.toFixed(5) + spacing + 
                "Expression Z-Score: " + d["z-score"].toFixed(5))
            //.style("left", (d3.mouse(this)[0]) + "px")
            //.style("top", (d3.mouse(this)[1]) + "px");
    };
    let mouseleave = function(d) {
        // Make tooltip disappear and heatmap object return to z-score color
        tooltip
            .style("opacity", 0);
        d3.select(this)
            .style("fill", function(d) {return myColor(d["z-score"])} )
        // Make dendrogram path unbold
        let id_ind = unique_ids.indexOf(d.tcga_participant_barcode);
        svg_dendrogram.selectAll('path')
            .filter(function (d) { return d.data.indexes.includes(id_ind)})
            .style("stroke-width","0.5px");
    };


    ///// Build the Heatmap, Legend, and Dendrogram Below /////
    // Build the heatmap:
    svg_heatmap.selectAll()
        .data(dataInput, function(d) {return d.tcga_participant_barcode+':'+d.gene;})
        .enter()
        .append("rect")
        .attr("x", function(d) {return x(d.tcga_participant_barcode) })
        .attr("y", function(d) {return y(d.gene) })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) {return myColor(d["z-score"])} )
        .style("stroke-width", 2)
        .style("stroke", "none")
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    // Append the y axis to the heatmap:
    svg_heatmap.append("g")
        .style("font-size", 9.5)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();

    // Build the Legend:   
    svg_heatmap.selectAll()
        .data(zArr)
        .enter()
        .append('rect')
        .attr('x', heatWidth-margin.right)
        .attr('y', function(r) { return zScale(r) })
        .attr("width", legendWidth/2 )
        .attr("height", 1 + (heatHeight/zArr.length) )
        .style("fill", function(r) {return myColor(r)} );
    // Append the axis for the legend:
    svg_heatmap.append("g")
        .style("font-size",10)
        .attr("transform", "translate("+ heatWidth + ",0)")
        .call(legendAxis);

    // Build dendrogram as links between nodes:
    svg_dendrogram.selectAll('path')
        .data( root.descendants().slice(1) )
        .enter()
        .append('path')
        .attr("d", elbow)
        .style("fill", 'none')
        .style("stroke-width","0.5px")
        .attr("stroke", 'black')
};