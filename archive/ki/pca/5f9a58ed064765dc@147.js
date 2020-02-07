// https://observablehq.com/@seitzej/pca-from-cluster-v2@147
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# PCA from Cluster v2`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Current forms of interaction

- Clicking on the *square or name/number* of a group will lower the opacity of all the other groups
- Clicking anywhere on the white bacground will bring the opacity back for all the groups

#### to be determined/created:

- Kaplan-Meier Analysis chart
- Dimensions table and/or heat map
- Table for risk ratios (e.g. risk of Stroke) per group 
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md `<br>
### PCA`
)});
  main.variable(observer("chart")).define("chart", ["d3","DOM","width","height","margin","maxOpacity","xAxis","yAxis","data","x","y","color","groups","selectGroup"], function(d3,DOM,width,height,margin,maxOpacity,xAxis,yAxis,data,x,y,color,groups,selectGroup)
{
  const svg = d3.select(DOM.svg(width, height));
  
  svg.append("rect")
    .attr("id", "background")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.top - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "white")
    .on("click", d => { d3.selectAll(".points, .keyRects").transition().attr("opacity", maxOpacity) })
  
   svg.append("g")
      .call(xAxis);
  
  svg.append("g")
      .call(yAxis);
  
  svg.append("g")
    .selectAll("circle")
    .data(data)
    .enter().append("circle")
      .attr("class", "points")
      .attr("cx", d => x(d.pc1))
      .attr("cy", d => y(d.pc2))
      .attr("fill", d => color(d.group))
      .attr("opacity", 0.7)
      .attr("r", 4);
  
  const key = svg.append("g")
    .selectAll("rect")
    .data(groups)
  
    key.enter().append("rect")
      .attr("class", "keyRects")
      .attr("x", width - margin.left - 20)
      .attr("y", (d, i) => i * 20)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => color(d))
      .on("click", d => {
      return selectGroup(this, d)
      })
      
    key.enter().append("text")
      .attr("x", d => width - margin.left + 12)
      .attr("y", (d, i) => i * 20)
      .attr("dy", "0.7em")
      .text(d => d)
      .style("font-size", "12px")
      .on("click", d => {
      return selectGroup(this, d)
      });

  return svg.node();
}
);
  main.variable(observer("selectGroup")).define("selectGroup", ["d3","maxOpacity"], function(d3,maxOpacity){return(
function selectGroup(ctx, group) {
  const groupElements = d3.selectAll(".points")
    .filter(d => d.group !== group);
  
  const activeGroup = d3.selectAll(".keyRects")
    .filter(d => d === group);
  
  const otherElements = d3.selectAll(".points")
    .filter(d => d.group === group);
  
  const otherGroups = d3.selectAll(".keyRects")
    .filter(d => d !== group);
  
  groupElements.transition().attr("opacity", 0.2);
  otherGroups.transition().attr("opacity", 0.2);
  
  otherElements.transition().attr("opacity", maxOpacity);
  activeGroup.transition().attr("opacity", maxOpacity);
}
)});
  main.variable(observer("color")).define("color", ["d3","groups"], function(d3,groups){return(
d3.scaleOrdinal(d3.schemeDark2)
  .domain(groups)
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc1))
    .range([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","data","height","margin"], function(d3,data,height,margin){return(
d3.scaleLinear()
    .domain(d3.extent(data, d => d.pc2))
    .range([height - margin.bottom, margin.top])
)});
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x","width"], function(height,margin,d3,x,width){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text("PC1"))
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y"], function(margin,d3,y){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("PC2"))
)});
  main.variable(observer("data")).define("data", ["d3","parsePCA"], function(d3,parsePCA){return(
d3.csv("https://gist.githubusercontent.com/jotasolano/0a48d0c5846b48ce239a52d48ae4df8e/raw/ef440312744b2bd06ca10f7b850d8aadf1c28a77/sample_pca.csv", parsePCA)
)});
  main.variable(observer("parsePCA")).define("parsePCA", function(){return(
function parsePCA(d) {
  return {
    pc1: +d["PC1"],
    pc2: +d["PC2"],
    group: d.cluster
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md `### Testing binned data`
)});
  main.variable(observer("collapse")).define("collapse", function(){return(
function collapse(grid_points) {
    let collapsed = new Map();

    // create a map x => y => group => count
    for (let pt of grid_points) {
        let x_coll = collapsed.get(pt.x_bin);
        if (x_coll === undefined) {
            x_coll = new Map();
            collapsed.set(pt.x_bin, x_coll);
        }
        let y_coll = x_coll.get(pt.y_bin);
        if (y_coll === undefined) {
            y_coll = new Map();
            x_coll.set(pt.y_bin, y_coll);
        }
        let count = y_coll.get(pt.group);
        if (count === undefined) {
            count = 1;
            y_coll.set(pt.group, count);
        } else {
            y_coll.set(pt.group, count + 1);
        }
    }

    let arr = [];

    for (let x_map of collapsed) {
        console.log('x', x_map);
        let x = x_map[0];
        for (let y_map of x_map[1]) {
            let y = y_map[0];
            for (let gc of y_map[1]) {
                let group = gc[0];
                let count = gc[1];
                arr.push({
                    'pc1': x,
                    'pc2': y,
                    'group': group,
                    'count': count
                });
            }
        }
    }

    return arr;
}
)});
  main.variable(observer("get_grid_point")).define("get_grid_point", function(){return(
function get_grid_point(x, y, x_min, y_min, x_bin_width, y_bin_width, group) {
    let i = 0;
    let x_left = x_min;

    let j = 0;
    let y_left = y_min;
    
    while (x_left + x_bin_width <= x) {
        x_left += x_bin_width;
        i += 1;
    }

    while (y_left + y_bin_width <= y) {
        y_left += y_bin_width;
        j += 1;
    }

    return {
        'x_bin': i,
        'y_bin': j,
        'group': group
    };
}
)});
  main.variable(observer("bins")).define("bins", ["d3","R","get_grid_point","collapse"], function(d3,R,get_grid_point,collapse){return(
function bins(data, x_bins, y_bins) {
    const [x_min, x_max] = d3.extent(data, R.prop('pc1'));
    const [y_min, y_max] = d3.extent(data, R.prop('pc2'));

    const x_bin_width = (x_max - x_min) / x_bins;
    const y_bin_width = (y_max - y_min) / y_bins;

    const grid = data.map(v => get_grid_point(v.pc1, v.pc2, x_min, y_min, x_bin_width, y_bin_width, v.group));
    return collapse(grid);
}
)});
  main.variable(observer("binnedData")).define("binnedData", ["bins","data"], function(bins,data){return(
bins(data, 50, 50)
)});
  main.variable(observer("Binnedchart")).define("Binnedchart", ["d3","DOM","width","height","margin","maxOpacity","xAxisBinned","yAxisBinned","binnedData","xBinned","yBinned","color","groups","selectGroup"], function(d3,DOM,width,height,margin,maxOpacity,xAxisBinned,yAxisBinned,binnedData,xBinned,yBinned,color,groups,selectGroup)
{
  const svg = d3.select(DOM.svg(width, height));
  
  svg.append("rect")
    .attr("id", "background")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.top - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "white")
    .on("click", d => { d3.selectAll(".points, .keyRects").transition().attr("opacity", maxOpacity) })
  
   svg.append("g")
      .call(xAxisBinned);
  
  svg.append("g")
      .call(yAxisBinned);
  
  svg.append("g")
    .selectAll("circle")
    .data(binnedData)
    .enter().append("circle")
      .attr("class", "points")
      .attr("cx", d => xBinned(d.pc1))
      .attr("cy", d => yBinned(d.pc2))
      .attr("fill", d => color(d.group))
      .attr("opacity", 0.7)
      .attr("r", 4);
  
  const key = svg.append("g")
    .selectAll("rect")
    .data(groups)
  
    key.enter().append("rect")
      .attr("class", "keyRects")
      .attr("x", width - margin.left - 20)
      .attr("y", (d, i) => i * 20)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => color(d))
      .on("click", d => {
      return selectGroup(this, d)
      })
      
    key.enter().append("text")
      .attr("x", d => width - margin.left + 12)
      .attr("y", (d, i) => i * 20)
      .attr("dy", "0.7em")
      .text(d => d)
      .style("font-size", "12px")
      .on("click", d => {
      return selectGroup(this, d)
      });

  return svg.node();
}
);
  main.variable(observer("xBinned")).define("xBinned", ["d3","binnedData","margin","width"], function(d3,binnedData,margin,width){return(
d3.scaleLinear()
    .domain(d3.extent(binnedData, d => d.pc1))
    .range([margin.left, width - margin.right])
)});
  main.variable(observer("yBinned")).define("yBinned", ["d3","binnedData","height","margin"], function(d3,binnedData,height,margin){return(
d3.scaleLinear()
    .domain(d3.extent(binnedData, d => d.pc2))
    .range([height - margin.bottom, margin.top])
)});
  main.variable(observer("xAxisBinned")).define("xAxisBinned", ["height","margin","d3","xBinned","width"], function(height,margin,d3,xBinned,width){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xBinned))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text("PC1"))
)});
  main.variable(observer("yAxisBinned")).define("yAxisBinned", ["margin","d3","yBinned"], function(margin,d3,yBinned){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yBinned))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("PC2"))
)});
  main.variable(observer()).define(["md"], function(md){return(
md `### Generic vars`
)});
  main.variable(observer("groups")).define("groups", ["d3","data"], function(d3,data){return(
d3.set(data, d => d.group).values()
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 20, right: 200, bottom: 30, left: 30}
)});
  main.variable(observer("height")).define("height", function(){return(
500
)});
  main.variable(observer("maxOpacity")).define("maxOpacity", function(){return(
0.7
)});
  main.variable(observer()).define(["md"], function(md){return(
md `### Dependencies`
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("https://d3js.org/d3.v5.min.js")
)});
  main.variable(observer("R")).define("R", ["require"], function(require){return(
require("https://cdnjs.cloudflare.com/ajax/libs/ramda/0.25.0/ramda.min.js")
)});
  return main;
}
