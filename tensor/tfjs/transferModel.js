import * as tf from 'node_modules/tensorflow/tfjs';
const model = await tf.loadLayersModel('js_model/model.json')