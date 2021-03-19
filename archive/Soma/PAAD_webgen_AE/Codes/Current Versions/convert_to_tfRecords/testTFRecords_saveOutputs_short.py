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
    print("num_examples: " + str(len(those_examples)))
    those_examples = those_examples[:10]

    counter = 0
    finalTensor = None

    for some_example in those_examples:
        # extract file names
        fn_png_bytes = some_example.features.feature['fn'].bytes_list.value[0]
        fn_decode = tf.compat.as_str_any(fn_png_bytes)

        # extract image data
        img_png_bytes = some_example.features.feature['img'].bytes_list.value[0]
        tf.compat.v1.disable_eager_execution()
        bytes = tf.compat.v1.placeholder(tf.string)
        session = tf.compat.v1.Session()
        decode_png = tf.image.decode_png(bytes, channels=3)
        image = session.run(decode_png,feed_dict={bytes:img_png_bytes})

        imgTensor = tf.convert_to_tensor(image)
        imgTensor = tf.cast(imgTensor,"int32")
        imgTensor= tf.expand_dims(imgTensor,axis=0)

        if counter ==0:
            finalTensor = imgTensor
            counter += 1
            print(finalTensor)
        elif counter > 0:
            print(finalTensor)
            print(imgTensor)
            finalTensor = tf.concat([finalTensor,imgTensor],axis=0)
            print(finalTensor)
        newTens = tf.squeeze(imgTensor,axis=0)
        newArray = newTens.eval(session=tf.compat.v1.Session())
        newImg = Image.fromarray(np.uint8(newArray)).convert('RGB')
        saveName = str(fn_decode)
        newImg.save(saveName)



    finalArray = finalTensor.eval(session=tf.compat.v1.Session())
    finalArray = finalArray.astype(np.float32)/255
    print(finalArray.shape)

if __name__ == '__main__':
    main()
