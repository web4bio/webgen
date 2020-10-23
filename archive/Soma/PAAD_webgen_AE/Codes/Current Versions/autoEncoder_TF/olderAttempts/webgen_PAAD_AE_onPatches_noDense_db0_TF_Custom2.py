from IPython import display

import glob
import imageio
import matplotlib.pyplot as plt
import numpy as np
import PIL
import tensorflow as tf
import tensorflow_probability as tfp
import time
import os

class CVAE(tf.keras.Model):
  """Convolutional variational autoencoder."""

  def __init__(self):
    super(CVAE, self).__init__()
    self.encoder = tf.keras.Sequential(
        [
            tf.keras.layers.InputLayer(input_shape=(400, 400, 3)),
            tf.keras.layers.Conv2D(
                filters=32, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
            tf.keras.layers.Conv2D(
                filters=64, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
            tf.keras.layers.Conv2D(
                filters=128, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
        ]
    )

    self.decoder = tf.keras.Sequential(
        [
            tf.keras.layers.InputLayer(input_shape=(50,50,128)),
            tf.keras.layers.Conv2DTranspose(
                filters=64, kernel_size=2, strides=2,
                activation='relu'),
            tf.keras.layers.Conv2DTranspose(
                filters=32, kernel_size=2, strides=2,
                activation='relu'),
            # No activation
            tf.keras.layers.Conv2DTranspose(
                filters=3, kernel_size=2, strides=2,activation='sigmoid'),
        ]
    )

  def call(self,X):
    print(X.shape)
    X = self.encoder(X)
    X = self.decoder(X)
    return X

def prepare_imgs(img_list):
  arrayimgs = None
  counter = 0
  for p in img_list:
      print('on image: ' + str(p))
      if counter ==0:
          img = Image.open(p).convert('RGB')
          arrayimg = np.array(img).astype(np.float32)
          arrayimgs = np.expand_dims(arrayimg,axis=0)
          counter += 1
      else:
          img = Image.open(p).convert('RGB')
          newarrayimg = np.array(img).astype(np.float32)
          newShape2 = np.expand_dims(newarrayimg,axis=0)
          arrayimgs=np.concatenate((arrayimgs,newShape2))
  
  return arrayimgs


def main():
    os.environ['CUDA_VISIBLE_DEVICES'] = '1'

    #params
    batch_size = 1
    ##

    source = '/data/scratch/soma/webgen_AE/initial/'
    
    train_fol = source + 'train'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*png'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*png'))]

    print(img_trains)
    print(img_test)
    num_train = len(img_trains)
    num_test = len(img_test)

    train_imgs = prepare_imgs(img_trains)
    test_imgs = prepare_imgs(img_test)

    print(train_imgs.shape)
    print(test_imgs.shape)

    #train_dataset = tf.data.Dataset.from_tensor_slices(train_imgs)
    #train_dataset = tf.data.Dataset.from_tensor_slices(test_imgs)

    #train_dataset = (tf.data.Dataset.from_tensor_slices(train_imgs)
    #             .shuffle(num_train).batch(batch_size))

    #test_dataset = (tf.data.Dataset.from_tensor_slices(test_imgs)
    #                .shuffle(num_test).batch(batch_size))

    #for train in train_dataset:
    #    print(train)

    optimizer = tf.keras.optimizers.Adam(1e-4)

    autoencoder = CVAE()

    autoencoder.compile(optimizer=optimizer, loss='binary_crossentropy')

    #input_shape=(1,400,400,3)

    #autoencoder.build(input_shape)
    autoencoder.fit(
        train_imgs,
        train_imgs,
        epochs=50,
        batch_size=1,
        shuffle=False
    )
    autoencoder.summary()

    #autoencoder.eval()

    predictions = autoencoder.predict(test_imgs[:3])
    print("predictions shape:", predictions.shape)

    print(predictions[0,:,:,:])





    


        
if __name__=='__main__':
    main()