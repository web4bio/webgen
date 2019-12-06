// https://observablehq.com/@fil/hello-umap-js@421
import define1 from "./e93997d5089d7165@2200.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Hello UMAP-js`
)});
  main.variable(observer()).define(["md","tex"], function(md,tex){return(
md`[UMAP](https://github.com/lmcinnes/umap), by Leland McInnes et al., is a python package that reads a list of data point coordinates in ${tex`\mathbb{R}^n`}, and calls  to output a list of coordinates in, for example, ${tex`\mathbb{R}^2`}, while maintaining as much as possible of the initial topology: points that are “neighbors” in the original space will be “neighbors” in the projected space.

In other words, UMAP (“Uniform Manifold Approximation and Projection”) is capable of doing dimensionality reduction, like [t-SNE](https://beta.observablehq.com/@fil/tsne-js-worker), but arguably more grounded from a mathematical standpoint ([DOI:10.21105/joss.00861](https://doi.org/10.21105/joss.00861)).

I've been dreaming of a JavaScript port, and … [Andy Coenen](https://github.com/cannoneyed) has just released [UMAP-js](https://github.com/PAIR-code/umap-js)! It's properly amazing…

_See also:_
- https://observablehq.com/@fil/umap-js-worker for the worker version;
- [Frida Kahlo’s palette](https://observablehq.com/@fil/frida-kahlos-palette) for a better choice of colors;
- [MNIST UMAP-js](https://observablehq.com/@fil/mnist-umap-js) for a more realistic application.
- [UMAP & a personalized distance function](https://observablehq.com/@fil/umap-a-personalized-distance-function).
`
)});
  main.variable(observer("view")).define("view", ["DOM","width","height","data","show_dynamic","dynamic","fixed","d3"], function(DOM,width,height,data,show_dynamic,dynamic,fixed,d3)
{
  const context = DOM.context2d(width, height);

  const points = data,
    positions = show_dynamic ? dynamic : fixed;

  const scaleX = d3
      .scaleLinear()
      .domain([-7, 7]) //.domain(d3.extent(positions.map(d => d[0])))
      .range([10, width - 10]),
    scaleY = d3
      .scaleLinear()
      .domain([-7, 7]) //.domain(d3.extent(positions.map(d => d[1])))
      .range([10, height - 10]);

  const path = d3.geoPath().context(context);

  points.forEach((point, i) => {
    context.beginPath();
    path({
      type: "Point",
      coordinates: [scaleX(positions[i][0]), scaleY(positions[i][1])]
    });
    context.fillStyle = `rgba(${[
      point[0] * 255,
      point[1] * 255,
      point[2] * 255,
      0.5 + 0.5 * point[3]
    ]})`;
    context.fill();
  });

  return context.canvas;
}
);
  main.variable(observer("viewof show_dynamic")).define("viewof show_dynamic", ["checkbox"], function(checkbox){return(
checkbox(["Show dynamic"])
)});
  main.variable(observer("show_dynamic")).define("show_dynamic", ["Generators", "viewof show_dynamic"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], function(md){return(
md`----
_ Create random colors in the 4-dimensional space of (rgba)_`
)});
  main.variable(observer("n")).define("n", function(){return(
1000
)});
  main.variable(observer("data")).define("data", ["n"], function(n){return(
Array.from({ length: n }, () => Array.from({ length: 4 }, Math.random))
)});
  main.variable(observer()).define(["md"], function(md){return(
md`----
_ Apply UMAP-js _`
)});
  main.variable(observer("UMAP")).define("UMAP", ["require"], async function(require){return(
(await require("umap-js@1.3.1")).UMAP
)});
  main.variable(observer("fixed")).define("fixed", ["UMAP","data"], function(UMAP,data){return(
new UMAP({
  nComponents: 2,
  minDist: 0.1,
  nNeighbors: 15
}).fit(data)
)});
  main.variable(observer("dynamic")).define("dynamic", ["show_dynamic","UMAP","data"], function*(show_dynamic,UMAP,data)
{
  if (!show_dynamic) return;
  const umap = new UMAP({
      nComponents: 2,
      minDist: 0.1,
      nNeighbors: 15
    }),
    nEpochs = umap.initializeFit(data);

  for (let i = 0; i < nEpochs; i++) {
    umap.step();
    if (i % 5 === 0) yield umap.getEmbedding();
  }
  yield umap.getEmbedding();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`See the parameters at https://github.com/PAIR-code/umap-js/blob/master/README.md#parameters `
)});
  main.variable(observer()).define(["md"], function(md){return(
md`----
_ boring zone _`
)});
  main.variable(observer("height")).define("height", ["width"], function(width){return(
width * 0.6
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  const child1 = runtime.module(define1);
  main.import("checkbox", child1);
  return main;
}
