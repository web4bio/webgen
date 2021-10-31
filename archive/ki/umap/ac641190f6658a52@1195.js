// https://observablehq.com/@mbostock/lets-try-t-sne@1195
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Let’s Try t-SNE!`
)});
  main.variable(observer()).define(["md","inlineSprite","colors"], function(md,inlineSprite,colors){return(
md`Each number below represents a hand-drawn digit (such as ${inlineSprite(5)} or ${inlineSprite(2)}) positioned by similarity using t-SNE. Notice that digits representing the same number (say ${inlineSprite(10)}, ${inlineSprite(15)} and ${inlineSprite(19)}, in <span style="color:${colors[0]};">blue</span>) tend to cluster together.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`t-SNE allows us to see patterns and clusters in many-dimensional data, such as the images of digits here, by reducing the data to two dimensions and producing something akin to a map or scatterplot. It’s a bit magical, like being able to perceive hyperdimensional space. Though see [*Wattenberg et al.*](https://distill.pub/2016/misread-tsne/) for limitations!

In this notebook, we’ll learn how to run t-SNE with TensorFlow.js.

Note: [WebGL2 required](https://caniuse.com/#feat=webgl2). (Sorry, Safari.)`
)});
  main.variable(observer("viewof restart")).define("viewof restart", ["html"], function(html)
{
  const form = html`<form><button name=button>Restart`;
  form.value = 0;
  form.button.onclick = event => {
    ++form.value;
    form.dispatchEvent(new CustomEvent("input"));
    event.preventDefault();
  };
  return form;
}
);
  main.variable(observer("restart")).define("restart", ["Generators", "viewof restart"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["restart","html","width","DOM","tsne","data","NUM_POINTS","colors","labels"], async function*(restart,html,width,DOM,tsne,data,NUM_POINTS,colors,labels)
{
  if (!restart) {
    yield html`<img src=https://user-images.githubusercontent.com/230541/50366746-76ba4a00-0530-11e9-8c23-9fbed27d9280.png>`;
    return;
  }
  const height = width;
  const context = DOM.context2d(width, height);
  for await (const coordinates of tsne(data)) {
    context.clearRect(0, 0, width, height);
    for (let i = 0; i < NUM_POINTS; ++i) {
      const x = coordinates[(i << 1) + 0];
      const y = coordinates[(i << 1) + 1];
      context.fillStyle = colors[labels[i]];
      context.fillText(labels[i], x * width, y * height);
    }
    yield context.canvas;
  }
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`*Based on [a TensorFlow.js example](https://github.com/tensorflow/tfjs-examples/tree/master/tsne-mnist-canvas).*`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Libraries

First let’s load TensorFlow.js. It’s modular, and here we need the core ([tfjs-core](https://github.com/tensorflow/tfjs-core)) and the t-SNE implementation ([tfjs-tsne](https://github.com/tensorflow/tfjs-tsne)). The JavaScript ecosystem hasn’t fully standardized on ES modules yet, so unfortunately we have to jump through a few hoops to [require](https://github.com/observablehq/stdlib/blob/master/README.md#require) compatible versions.`
)});
  main.variable(observer("tf")).define("tf", ["require"], async function(require)
{
  const r = require.alias({
    "@tensorflow/tfjs-core": "@tensorflow/tfjs-core@0.14.3",
    "@tensorflow/tfjs-tsne": "@tensorflow/tfjs-tsne@0.2.0"
  });
  const [tf, tsne] = await Promise.all([
    r("@tensorflow/tfjs-core"),
    r("@tensorflow/tfjs-tsne")
  ]);
  tf.tsne = tsne;
  return tf;
}
);
  main.variable(observer()).define(["md","NUM_DATASET_ELEMENTS"], function(md,NUM_DATASET_ELEMENTS){return(
md`## Images

Next, let’s get the data! The MNIST dataset consists of ${NUM_DATASET_ELEMENTS.toLocaleString()} little images of hand-drawn numbers. Loading each image separately would be unbearably slow, so Mother Google (the provider of this example dataset) has thoughtfully combined all of the images into one. It’s big (10.2MB), but workable.`
)});
  main.variable(observer("sprites")).define("sprites", function(){return(
new Promise((resolve, reject) => {
  const image = new Image;
  image.width = 33;
  image.height = 33;
  image.style.imageRendering = "pixelated";
  image.crossOrigin = "anonymous";
  image.src = "https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png";
  image.onload = () => resolve(image);
  image.onerror = reject;
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`This is a [cross-origin request](/@mbostock/cross-origin-images) because we want to read the constituent pixel values. To extract the individual images, or *sprites*, out of the big image, we must know how the sprites are arranged. Here are the first 120:`
)});
  main.variable(observer()).define(["DOM","IMAGE_WIDTH","sprites"], function(DOM,IMAGE_WIDTH,sprites)
{
  const n = 120;
  const context = DOM.context2d(IMAGE_WIDTH, n, 1);
  context.canvas.style.imageRendering = "pixelated";
  context.canvas.style.maxWidth = "100%";
  context.drawImage(sprites, 0, 0, IMAGE_WIDTH, n, 0, 0, IMAGE_WIDTH, n);
  return context.canvas;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`Can you see them? They’re not tiled, like you might expect. Instead, each sprite is sliced into rows per pixel, like paper through a shredder, and rearranged into a single row in the big image. To reconstruct a sprite, we must reverse the process.

The transformation, animated:`
)});
  main.variable(observer()).define(["html","SPRITE_SIZE","DOM","sprites"], function(html,SPRITE_SIZE,DOM,sprites){return(
html`<div style="position:relative;height:${SPRITE_SIZE}px;">
  ${Array.from({length: SPRITE_SIZE}, (_, i) => {
    const context = DOM.context2d(SPRITE_SIZE, 1, 1);
    context.drawImage(sprites, i * SPRITE_SIZE, 0, SPRITE_SIZE, 1, 0, 0, SPRITE_SIZE, 1);
    const {canvas} = context;
    canvas.style.position = "absolute";
    canvas.style.animation = `3s linear sprite-slice-${i} infinite alternate`;
    return html`
    <style>
      @keyframes sprite-slice-${i} {
        0% { left: ${i * SPRITE_SIZE}px; top: 0; }
        20% { left: ${i * SPRITE_SIZE}px; top: 0; }
        50% { left: ${i * SPRITE_SIZE}px; top: ${i}px; }
        80% { left: 0; top: ${i}px; }
        100% { left: 0; top: ${i}px; }
      }
    </style>
    ${canvas}
    `;
  })}
</div>`
)});
  main.variable(observer()).define(["md","IMAGE_WIDTH","tex","SPRITE_SIZE","NUM_DATASET_ELEMENTS"], function(md,IMAGE_WIDTH,tex,SPRITE_SIZE,NUM_DATASET_ELEMENTS){return(
md`The big image is ${IMAGE_WIDTH.toLocaleString()}px wide, so each sprite is ${tex`\sqrt{${IMAGE_WIDTH}}`} = ${SPRITE_SIZE.toLocaleString()}×${SPRITE_SIZE.toLocaleString()}px tall. And since we have ${NUM_DATASET_ELEMENTS.toLocaleString()} test images, the big image is ${NUM_DATASET_ELEMENTS.toLocaleString()}px tall.`
)});
  main.variable(observer("NUM_DATASET_ELEMENTS")).define("NUM_DATASET_ELEMENTS", ["sprites"], function(sprites){return(
sprites.naturalHeight
)});
  main.variable(observer("IMAGE_WIDTH")).define("IMAGE_WIDTH", ["sprites"], function(sprites){return(
sprites.naturalWidth
)});
  main.variable(observer("SPRITE_SIZE")).define("SPRITE_SIZE", ["IMAGE_WIDTH"], function(IMAGE_WIDTH){return(
Math.sqrt(IMAGE_WIDTH)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`To confirm that we understand the sprite image format correctly, let’s extract a few random sprites and look at them.`
)});
  main.variable(observer()).define(["html","sprite","sprites"], function(html,sprite,sprites){return(
html`${Array.from({length: 10}, () => {
  return sprite(Math.random() * sprites.naturalHeight | 0);
})}`
)});
  main.variable(observer("sprite")).define("sprite", ["DOM","SPRITE_SIZE","sprites"], function(DOM,SPRITE_SIZE,sprites){return(
function sprite(i) {
  const context = DOM.context2d(SPRITE_SIZE, SPRITE_SIZE, 1);
  for (let y = 0; y < SPRITE_SIZE; ++y) {
    context.drawImage(sprites, y * SPRITE_SIZE, i, SPRITE_SIZE, 1, 0, y, SPRITE_SIZE, 1);
  }
  return context.canvas;
}
)});
  main.variable(observer()).define(["md","inlineSprite"], function(md,inlineSprite){return(
md`And here’s a tweaked display to embed the sprites in prose (*e.g.*, ${inlineSprite(41)}):`
)});
  main.variable(observer("inlineSprite")).define("inlineSprite", ["sprite"], function(sprite){return(
function inlineSprite(i) {
  const canvas = sprite(i);
  canvas.style.filter = "invert(1)";
  canvas.style.width = "21px";
  canvas.style.height = "21px";
  return canvas;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Labels

Recognizing numbers is a [classification problem](https://en.wikipedia.org/wiki/Statistical_classification): for each image of a digit, we wish to know which number (0 through 9) it represents. These ten numbers correspond to ten *classes*, and the MNIST dataset provides *labels* that specify which classes apply to each image.

We’re not actually attempting classification in this notebook—we’re doing [dimensionality reduction](https://en.wikipedia.org/wiki/Dimensionality_reduction) with t-SNE to visualize the dataset, and the labels are only used for color. The MNIST dataset is used for a variety of machine learning examples and tests, and understanding these applications sheds some light on the data’s representation.`
)});
  main.variable(observer("NUM_CLASSES")).define("NUM_CLASSES", function(){return(
10
)});
  main.variable(observer()).define(["md"], function(md){return(
md`You might expect the labels to tell you which class (number) corresponds to each image. Instead, there are nine 0’s and one 1 for each image: a 1 if the image has that class, and a 0 if it doesn’t. This is [one-hot encoding](https://en.wikipedia.org/wiki/One-hot). Although it does not apply here because a digit can’t be both a two and a three simultaneously, in general with image classification an image may be in more than one class, or zero classes.`
)});
  main.variable(observer("datasetLabels")).define("datasetLabels", ["NUM_CLASSES","NUM_POINTS"], function(NUM_CLASSES,NUM_POINTS){return(
fetch("https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8")
  .then(response => response.arrayBuffer())
  .then(buffer => new Uint8Array(buffer, 0, NUM_CLASSES * NUM_POINTS))
)});
  main.variable(observer()).define(["md","NUM_POINTS"], function(md,NUM_POINTS){return(
md`To avoid setting your computer on fire 🔥, we’re only considering the first ${NUM_POINTS.toLocaleString()} points from the MNIST dataset: the extra arguments to the [Uint8Array constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) pull out just the labels we need.`
)});
  main.variable(observer("NUM_POINTS")).define("NUM_POINTS", function(){return(
10000
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Let’s test our understanding of the labels data by looking again at some sprites:`
)});
  main.variable(observer()).define(["sprite"], function(sprite){return(
sprite(0)
)});
  main.variable(observer()).define(["label"], function(label){return(
label(0)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`The first sprite is a seven!`
)});
  main.variable(observer("label")).define("label", ["datasetLabels","NUM_CLASSES"], function(datasetLabels,NUM_CLASSES){return(
i => datasetLabels.subarray(i * NUM_CLASSES, (i + 1) * NUM_CLASSES)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`We can translate the labels into the expected class like so:`
)});
  main.variable(observer("classify")).define("classify", ["label"], function(label){return(
i => label(i).findIndex(value => value === 1)
)});
  main.variable(observer()).define(["classify"], function(classify){return(
classify(0)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`And a few more examples, showing both the labels and the class:`
)});
  main.variable(observer()).define(["html","NUM_POINTS","sprite","label","classify"], function(html,NUM_POINTS,sprite,label,classify){return(
html`<table style="width:180px;">
  <tbody style="font:var(--mono_fonts);">${Array.from({length: 10}, () => {
    const i = Math.random() * NUM_POINTS | 0;
    return html`<tr>
      <td>${sprite(i)}</td>
      <td>${label(i).join("")} = ${classify(i)}</td>
    </tr>`;
  })}</tbody>
</table>`
)});
  main.variable(observer()).define(["md","NUM_POINTS"], function(md,NUM_POINTS){return(
md`The code above to extract the labels is written in JavaScript and runs on the CPU. This is totally fine—we’re only dealing with ${NUM_POINTS.toLocaleString()} points, and only computing the labels once. But since we have TensorFlow.js, we can shift this work to the GPU using [*tensor*.argMax](https://js.tensorflow.org/api/0.14.1/#argMax).`
)});
  main.variable(observer()).define(["html","sprite"], function(html,sprite){return(
html`${Array.from({length: 10}, (_, i) => sprite(i))}`
)});
  main.variable(observer("labels")).define("labels", ["tidy","tf","datasetLabels","NUM_POINTS","NUM_CLASSES"], function(tidy,tf,datasetLabels,NUM_POINTS,NUM_CLASSES){return(
tidy(() => tf
  .tensor2d(datasetLabels, [NUM_POINTS, NUM_CLASSES])
  .argMax(1)
  .dataSync())
)});
  main.variable(observer()).define(["md","labels","inlineSprite"], function(md,labels,inlineSprite){return(
md`Notice that the numbers in *labels* array (${labels.subarray(0, 10).join(", ")}, …) match the sprites (${Array.from({length: 10}, (_, i) => inlineSprite(i))}). Our code is working! 👍`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Tidy tensors

What’s up with the *tidy* function above? A note about good tensor hygiene: unlike normal values in JavaScript, tensors in TensorFlow.js *leak by default* because they are backed by resources that live on the GPU. We can’t rely on the normal garbage collector to avoid leaks—we have to dispose of tensors explicitly!

Fortunately, we have two useful tools at our disposal:

TensorFlow.js’ [tf.tidy](https://js.tensorflow.org/api/0.14.1/#tidy) will call the given function and automatically dispose of any allocated tensors when the function returns. Returned tensors, however, are not disposed. (That’s good, because if we’re returning a tensor from tf.tidy, that means we want to continue using that tensor.)

Observable’s [Generators.disposable](https://github.com/observablehq/stdlib/blob/master/README.md#Generators_disposable) will invoke a function when a cell is [invalidated](https://beta.observablehq.com/@mbostock/disposing-content) (re-run), such as when a referenced value changes or when the cell’s code is edited. Invalidation is a good time to dispose of a tensor that’s no longer needed.

Putting the two together, we have a *tidy* helper function.`
)});
  main.variable(observer("tidy")).define("tidy", ["Generators","tf"], function(Generators,tf){return(
f => Generators.disposable(tf.tidy(f), x => x && x.dispose && x.dispose())
)});
  main.variable(observer()).define(["md","IMAGE_WIDTH","NUM_DATASET_ELEMENTS","CHUNK_SIZE","NUM_POINTS"], function(md,IMAGE_WIDTH,NUM_DATASET_ELEMENTS,CHUNK_SIZE,NUM_POINTS){return(
md`## Color space conversion

The t-SNE algorithm operates on [floating-point (real) numbers](https://en.wikipedia.org/wiki/Floating-point_arithmetic) in [0, 1], but our sprites are currently integers in [0, 255] in RGBA color space. To prepare the sprites for t-SNE, we must convert the sprite image to an array of floats using [*context*.getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData). Each float corresponds to the grayscale value of a pixel.

Two optimizations are strongly recommended. First, rather than trying to convert the entire ${IMAGE_WIDTH.toLocaleString()}×${NUM_DATASET_ELEMENTS.toLocaleString()}px image all at once to a ${(IMAGE_WIDTH * NUM_DATASET_ELEMENTS).toLocaleString()}-element array (${(IMAGE_WIDTH * NUM_DATASET_ELEMENTS * 4 / (1024 * 1024)).toFixed()}MB!), we’ll read in the sprites in chunks of ${CHUNK_SIZE.toLocaleString()} to avoid exhausting available memory. Second, we don’t need to convert *all* of the sprites; we’re only using ${NUM_POINTS.toLocaleString()} sprites when we run t-SNE, so we can ignore the rest.`
)});
  main.variable(observer("CHUNK_SIZE")).define("CHUNK_SIZE", function(){return(
1000
)});
  main.variable(observer("datasetImages")).define("datasetImages", ["NUM_POINTS","IMAGE_WIDTH","DOM","CHUNK_SIZE","sprites"], function(NUM_POINTS,IMAGE_WIDTH,DOM,CHUNK_SIZE,sprites)
{
  const array = new Float32Array(NUM_POINTS * IMAGE_WIDTH);
  const context = DOM.context2d(IMAGE_WIDTH, CHUNK_SIZE, 1);
  for (let i = 0; i < NUM_POINTS; i += CHUNK_SIZE) {
    context.drawImage(
      sprites,
      0, i, IMAGE_WIDTH, CHUNK_SIZE,
      0, 0, IMAGE_WIDTH, CHUNK_SIZE
    );
    const {data} = context.getImageData(0, 0, IMAGE_WIDTH, CHUNK_SIZE);
    const offset = i * IMAGE_WIDTH;
    for (let j = 0; j < data.length; j += 4) {
      array[offset + (j >> 2)] = data[j] / 255; // Grayscale, so just read the red channel.
    }
  }
  return array;
}
);
  main.variable(observer()).define(["md","SPRITE_SIZE","NEW_SIZE","tex"], function(md,SPRITE_SIZE,NEW_SIZE,tex){return(
md`## Image resizing

The last preparation step—*we’re almost there, folks!*—is to resize the ${SPRITE_SIZE}×${SPRITE_SIZE}px sprites to ${NEW_SIZE}×${NEW_SIZE}px. This dimensionality reduction of the input data from ${tex`${SPRITE_SIZE}\times${SPRITE_SIZE}=${SPRITE_SIZE * SPRITE_SIZE}`} to ${tex`${NEW_SIZE}\times${NEW_SIZE}=${NEW_SIZE * NEW_SIZE}`} makes an interactive t-SNE much more feasible, and we can quickly resize the images on the GPU using [*image*.resizeBilinear](https://js.tensorflow.org/api/0.14.1/#image.resizeBilinear). The t-SNE implementation expects a 2D tensor as input, rather than 4D, so we also [tf.reshape](https://js.tensorflow.org/api/0.14.1/#reshape) it.`
)});
  main.variable(observer("NEW_SIZE")).define("NEW_SIZE", function(){return(
10
)});
  main.variable(observer("data")).define("data", ["tidy","tf","datasetImages","NUM_POINTS","SPRITE_SIZE","NEW_SIZE"], function(tidy,tf,datasetImages,NUM_POINTS,SPRITE_SIZE,NEW_SIZE){return(
tidy(() => tf
  .tensor4d(datasetImages, [NUM_POINTS, SPRITE_SIZE, SPRITE_SIZE, 1])
  .resizeBilinear([NEW_SIZE, NEW_SIZE])
  .reshape([NUM_POINTS, NEW_SIZE * NEW_SIZE]))
)});
  main.variable(observer()).define(["md","NUM_KNN_ITERATIONS","NUM_ITERATIONS"], function(md,NUM_KNN_ITERATIONS,NUM_ITERATIONS){return(
md`## Embedding!

Finally, we’re ready to run t-SNE. The [tfjs-tsne](https://github.com/tensorflow/tfjs-tsne) implementation supports both interactive (incremental) and non-interactive computation. Since we want to display the visualization as it progresses above, we’ll use the interactive mode, which means repeatedly calling [*tsne*.iterate](https://github.com/tensorflow/tfjs-tsne/blob/master/README.md#iterateiterations-number-promise) and yielding to give the browser a chance to breathe 😅 and visualize the embedding.

One weird thing about t-SNE (at least this implementation) is that it has no heuristic for when it’s done. Instead, you guess a reasonable number of iterations and hope you get a good result. We’ll use ${NUM_KNN_ITERATIONS.toLocaleString()} for the [*k*-nearest neighbors (*k*-NN)](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm) preprocessing step and ${NUM_ITERATIONS.toLocaleString()} for t-SNE itself.`
)});
  main.variable(observer("NUM_KNN_ITERATIONS")).define("NUM_KNN_ITERATIONS", function(){return(
500
)});
  main.variable(observer("NUM_ITERATIONS")).define("NUM_ITERATIONS", function(){return(
1000
)});
  main.variable(observer()).define(["md"], function(md){return(
md`You can configure the t-SNE optimizer with various parameters, such as *perplexity* and *exaggeration*. We’ll use the defaults here, but you can pass an *options* object as the second argument to [tsne.tsne](https://github.com/tensorflow/tfjs-tsne/blob/master/README.md#tsnetsnedata-tftensor2d-config-tsneconfiguration) if you want to change them.`
)});
  main.variable(observer("tsne")).define("tsne", ["tf","NUM_KNN_ITERATIONS","NUM_ITERATIONS"], function(tf,NUM_KNN_ITERATIONS,NUM_ITERATIONS){return(
async function* tsne(data) {
  const tsne = tf.tsne.tsne(data);
  await tsne.iterateKnn(NUM_KNN_ITERATIONS);
  for (let i = 0; i < NUM_ITERATIONS; ++i) {
    await tsne.iterate();
    yield await tsne.coordinates().data();
  }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`The “run loop” is implemented as an [async generator](/@mbostock/introduction-to-asynchronous-iteration) so that we can visualize the output coordinates from another cell. If you scroll all the way up to [the chart](#chart) above, you can click the cell menu in the left margin to see how the visualization is implemented.

Thanks for reading!`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---

## Appendix`
)});
  main.variable(observer("colors")).define("colors", function(){return(
["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]
)});
  return main;
}
