//classifier.js

var model;

async function initialize() {
  console.log('start initialize.')
  model = await tf.loadGraphModel('../js/imaging/model.json');
  console.log('model loaded.')
  predict();
}

async function predict() {
  // action for the submit buttonlet image = document.getElementById("img")
  tf.env().set('WEBGL_CPU_FORWARD', false);
  let image = document.getElementById("canvas")
  let tensorImg = tf.browser.fromPixels(image).expandDims(axis = 0);
  let tensorImg_c = tf.cast(tensorImg, "float32").div(255);
  const verbose = true;
  console.log(tensorImg_c)
  let prediction = await model.predict(tensorImg_c).mul(255).squeeze(0)
  console.log(prediction)
  console.log(prediction.print(verbose))
  console.log('___________')
  let check = prediction.arraySync()
  console.log(check)
  console.log(check.shape)
  let canvas = document.getElementById("myCanvas")
  toImage(prediction, canvas);
}

function toImage(tensor, canvas) {
  const ctx = canvas.getContext('2d');
  //get the tensor shape
  const [height, width] = tensor.shape;
  //create a buffer array
  const buffer = new Uint8ClampedArray(width * height * 4)
  //create Image data var
  const imageData = new ImageData(width, height);
  // get the tensor values as data
  const data = tensor.dataSync();
  // map the values to the buffer
  var i = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var pos = (y * width + x) * 4;
      buffer[pos] = data[i]
      buffer[pos + 1] = data[i + 1]
      buffer[pos + 2] = data[i + 2]
      buffer[pos + 3] = 255;
      i += 3
    }
  }
  //set the buffer to the image data
  imageData.data.set(buffer)
  //show the image on canvas
  ctx.putImageData(imageData, 0, 0)
}

