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

def main():
    filepath = '/data/scratch/soma/webgen_AE/Split/tfRecordFiles/testtFrecord_train.tfrecords'

    reader = tf.compat.v1.io.tf_record_iterator(filepath)

    those_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader]

    counter = 0
    finalTensor = None

    tot_num = len(those_examples)
    
    for some_example in those_examples:
        img_png_bytes = some_example.features.feature['img'].bytes_list.value[0]
        tf.compat.v1.disable_eager_execution()
        bytes = tf.compat.v1.placeholder(tf.string)
        session = tf.compat.v1.Session()
        decode_png = tf.image.decode_png(bytes, channels=3)
        image = session.run(decode_png,feed_dict={bytes:img_png_bytes})

        imgTensor = tf.convert_to_tensor(image)
        imgTensor= tf.expand_dims(imgTensor,axis=0)

        imgArray = imgTensor.eval(session=tf.compat.v1.Session())
        imgArray = imgArray.astype(np.float32)/255

        if counter ==0:
            finalArray = imgArray
            counter += 1
            print(finalArray.shape)
        elif counter > 0:
            finalArray = np.concatenate((finalArray,imgArray),axis=0)
            print(finalArray.shape)

if __name__ == '__main__':
    main()