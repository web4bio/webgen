createViolinPlot = async function(indepVarType, indepVars, dataInput, svgObject)
{
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 1250 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;

    // Filter out null values:
    dataInput = dataInput.filter(patientData => patientData.expression_log2 != null);

    var myGroups = d3.map(dataInput, function(d){return d.gene;}).keys();
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
        .padding(0.2)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svgObject.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

    // Features of the histogram
    var histogram = d3.histogram()
        .domain(y.domain())
        .thresholds(y.ticks(150))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
        .value(dataInput => dataInput)

    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()  // nest function allows to group the calculation per level of a factor
    .key(function(d) { return d.gene;})
    .rollup(function(d) 
    {   // For each key..
        input = d.map(function(g) 
        {   
            return g.expression_log2;
        });    // Keep the variable called expression_log2
        bins = histogram(input)   // And compute the binning on it.
        return(bins);
    })
    .entries(dataInput)

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for(i in sumstat)
    {
        allBins = sumstat[i].value
        console.log(allBins);
        lengths = allBins.map(function(a){return a.length;})
        longest = d3.max(lengths)

        if (longest > maxNum) 
        {
            maxNum = longest;
        }
    }

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
    .append("path")
        .datum(function(d){return(d.value)})     // So now we are working bin per bin
        .style("stroke", "none")
        .style("fill","#69b3a2")
        .attr("d", d3.area()
            .x0(function(d){ return(xNum(-d.length)) } )
            .x1(function(d){ return(xNum(d.length)) } )
            .y(function(d){ return(y(d.x0)) } )
            .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        )


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