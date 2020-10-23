//classifier.js
const tf = require('@tensorflow/tfjs-node');
var model;
var predResult = document.getElementById("result");
async function initialize() {
    console.log('start initialize.')
    model = await tf.loadGraphModel('./model.json');
    console.log('model loaded.')
    predict();
}async function predict() {
  // action for the submit buttonlet image = document.getElementById("img")
    tf.env().set('WEBGL_CPU_FORWARD', false);
    let image = document.getElementById("img")  
    let tensorImg = tf.browser.fromPixels(image).expandDims(axis=0);
    let tensorImg_c = tf.cast(tensorImg,"float32").div(255);
    const verbose = true;       
    console.log(tensorImg_c)
    prediction = await model.predict(tensorImg_c).mul(255).squeeze(0)
    console.log(prediction)
    console.log(prediction.print(verbose))
    console.log('___________')
    let check = prediction.arraySync()
    console.log(check)
    console.log(check.shape)
  }
initialize();

