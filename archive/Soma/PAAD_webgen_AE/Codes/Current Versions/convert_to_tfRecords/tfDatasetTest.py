from IPython import display
import tensorflow.keras as keras
from tensorflow.keras.callbacks import ModelCheckpoint
import glob
import imageio
import matplotlib.pyplot as plt
import numpy as np
import PIL
from PIL import Image
import tensorflow as tf
import time
import os

def test_inference(testExamples):

def decode_totensors(allExamples):
    num_examples = len(allExamples)
    counter = 0
    finalTensor = None
    for example in allExamples:
        img_png_bytes = example.features.feature['img'].bytes_list.value[0]
        tf.compat.v1.disable_eager_execution()
        bytes = tf.compat.v1.placeholder(tf.string)
        session = tf.compat.v1.Session()
        decode_png = tf.image.decode_png(bytes, channels=3)
        image = session.run(decode_png,feed_dict={bytes:img_png_bytes})

        imgTensor = tf.convert_to_tensor(image)
        imgTensor = tf.cast(imgTensor,"int32")
        imgTensor= tf.expand_dims(imgTensor,axis=0)

        if counter == 0:
            finalTensor = imgTensor
            counter += 1
        elif counter > 0:
            finalTensor = tf.concat([finalTensor,imgTensor],axis=0)
    
    return finalTensor


def main():
    filepath = '/data/scratch/soma/webgen_AE/Split/tfRecordFiles/testtFrecord_train.tfrecords'

    dataset = tf.data.TFRecordDataset(filenames = [filepath])

    reader = tf.compat.v1.io.tf_record_iterator(filepath)

    those_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader]

    #those_examples = those_examples[:10]

    finalTensor = decode_totensors(those_examples)

    print(finalTensor)
    print(finalTensor.shape)

if __name__ == '__main__':
    main()