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
#https://medium.com/ai%C2%B3-theory-practice-business/image-dataset-with-tfrecord-files-7188b565bfc
#tf.compat.v1.enable_eager_execution()

def return_fn_inlist(pathString):
    fn = str(pathString).split('/')[-1]
    fn = (fn).encode()
    return fn

def _bytes_feature(value):
  """Returns a bytes_list from a string / byte."""
  #if isinstance(value, type(tf.constant(0))):
  #  value = value.numpy() # BytesList won't unpack a string from an EagerTensor.
  return tf.train.Feature(bytes_list=tf.train.BytesList(value=[value]))


def _float_feature(value):
  """Returns a float_list from a float / double."""
  return tf.train.Feature(float_list=tf.train.FloatList(value=[value]))


def serialize_example(fn, imgArray):
  #https://www.tensorflow.org/tutorials/load_data/tfrecord
  """
  Creates a tf.train.Example message ready to be written to a file.
  """
  # Create a dictionary mapping the feature name to the tf.train.Example-compatible
  # data type.
  print('hi')
  feature = {
      #'fn': _bytes_feature(fn.encode('utf-8')),
      'fn': _bytes_feature(fn),
      #'img': _bytes_feature(imgArray),
      'img':_float_feature(img),
  }

  # Create a Features message using tf.train.Example.
  example_proto = tf.train.Example(features=tf.train.Features(feature=feature))
  return example_proto.SerializeToString()


def convert_to_tfRecords(img_list,split):
    global train_fol
    global test_fol
    global tfrecord_filename
    global source
    global tfrecordSavePath

    #### WORKS!!
    print('Working on: ' + str(split) + ' dataset...')

    tfRecordDest = source + 'tfRecordFiles'
    if not os.path.exists(tfRecordDest):
        os.mkdir(tfRecordDest)

    tfrecord_filename = 'testtFrecord_' + str(split) + '.tfrecords'
    tfrecordSavePath = os.path.join(tfRecordDest,tfrecord_filename)

    num_total = len(img_list)
   
    with tf.compat.v1.python_io.TFRecordWriter(tfrecordSavePath) as writer:
        counter = 0
        for p in img_list:
            counter += 1
            # currently following: https://stackoverflow.com/questions/33849617/how-do-i-convert-a-directory-of-jpeg-images-to-tfrecords-file-in-tensorflow
            
            print('on image: ' + str(p) + ', which is #' + str(counter) + '/' + str(num_total))
            fn = return_fn_inlist(p)

            with open(p,'rb') as f:
                png_bytes = f.read()

            feature = {
                'fn': _bytes_feature(fn),
                'img': _bytes_feature(png_bytes)
            }

            example = tf.train.Example(features=tf.train.Features(feature=feature))
            example_str = example.SerializeToString()

            writer.write(example_str)

def check_tf_records_oneExample():
    global tfrecord_filename
    global tfrecordSavePath

    reader = tf.compat.v1.python_io.tf_record_iterator(tfrecordSavePath)
    those_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader]

    some_example = those_examples[0]

    fn_png_bytes = some_example.features.feature['fn'].bytes_list.value[0]
    fn_decode = tf.compat.as_str_any(fn_png_bytes)
    print(fn_decode)

    
    img_png_bytes = some_example.features.feature['img'].bytes_list.value[0]
    tf.compat.v1.disable_eager_execution()
    bytes = tf.compat.v1.placeholder(tf.string)
    session = tf.compat.v1.Session()
    decode_png = tf.image.decode_png(bytes, channels=3)
    image = session.run(decode_png,feed_dict={bytes:img_png_bytes})
    print(image.shape)

def check_tf_records_iterate():
    global tfrecord_filename
    global tfrecordSavePath

    reader = tf.compat.v1.python_io.tf_record_iterator(tfrecordSavePath)
    those_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader]

    for some_example in those_examples:
        fn_png_bytes = some_example.features.feature['fn'].bytes_list.value[0]
        fn_decode = tf.compat.as_str_any(fn_png_bytes)
        print(fn_decode)

        
        img_png_bytes = some_example.features.feature['img'].bytes_list.value[0]
        tf.compat.v1.disable_eager_execution()
        bytes = tf.compat.v1.placeholder(tf.string)
        session = tf.compat.v1.Session()
        decode_png = tf.image.decode_png(bytes, channels=3)
        image = session.run(decode_png,feed_dict={bytes:img_png_bytes})
        print(image)

def main():
    global train_fol
    global test_fol
    global source
    

    os.environ['CUDA_VISIBLE_DEVICES'] = '1'

    #source = '/Users/soma/Desktop/tmp/'
    #source = '/Users/soma/Desktop/'
    source = '/data/scratch/soma/webgen_AE/Split/'
    #source = '/data/scratch/soma/webgen_AE/initial_sim/'
    
    train_fol = source + 'training'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*png'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*png'))]

    print(img_trains)
    print(img_test)

    convert_to_tfRecords(img_trains,split='train')
    convert_to_tfRecords(img_test,split='test')

if __name__=='__main__':
    main()