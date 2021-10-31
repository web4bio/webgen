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
    #print('ON: ' + X)
    print(X.shape)
    #tf.print(X)
    X = self.encoder(X)
    X = self.decoder(X)
    return X

  def encode(self,X):
    return self.encoder(X)
    
  def decode(self,X):
    return self.decoder(X)

  def train_step(self,data):
    with tf.GradientTape() as tape:
        pred = self.call(data)
        loss = self.compiled_loss(data,pred,regularization_losses=self.losses)

    trainable_vars = self.trainable_variables
    gradients = tape.gradient(loss, trainable_vars)

    self.optimizer.apply_gradients(zip(gradients, trainable_vars))
    self.compiled_metrics.update_state(data, pred)
    return {m.name: m.result() for m in self.metrics}

  #@property
  #def metrics(self):
    # We list our `Metric` objects here so that `reset_states()` can be
    # called automatically at the start of each epoch
    # or at the start of `evaluate()`.
    # If you don't implement this property, you have to call
    # `reset_states()` yourself at the time of your choosing.
    #return [loss_tracker, mae_metric]




def prepare_imgs(img_list):
  arrayimgs = None
  counter = 0
  for p in img_list:
      print('on image: ' + str(p))
      if counter ==0:
          img = Image.open(p).convert('RGB')
          arrayimg = np.array(img).astype(np.float32)/255
          arrayimgs = np.expand_dims(arrayimg,axis=0)
          counter += 1
      else:
          img = Image.open(p).convert('RGB')
          newarrayimg = np.array(img).astype(np.float32)/255
          newShape2 = np.expand_dims(newarrayimg,axis=0)
          arrayimgs=np.concatenate((arrayimgs,newShape2))
  
  return arrayimgs

def prepare_test_imgs(test_img_list):
  testDict = {}
  for fp in test_img_list:
      fn = str(fp).split('/')[-1]
      img = Image.open(fp).convert('RGB')
      arrayimg = np.array(img).astype(np.float32)/255
      arrayimgs = np.expand_dims(arrayimg,axis=0)
      
      testDict[fn]=arrayimgs
  
  return testDict


def main():
    os.environ['CUDA_VISIBLE_DEVICES'] = '1'

    #Directories:
    saved_models = os.path.join(os.getcwd(),'saved_models_moreSamples')
    if not os.path.exists(saved_models):
        os.mkdir(saved_models)
    
    outputs_dir = os.path.join(os.getcwd(),'outputs_moreSamples')
    if not os.path.exists(outputs_dir):
        os.mkdir(outputs_dir)

    #params
    batch_size = 1
    ##

    #source = '/Users/soma/Desktop/tmp/'
    #source = '/Users/soma/Desktop/'
    source = '/data/scratch/soma/webgen_AE/Split/'
    
    train_fol = source + 'training'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*png'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*png'))]

    print(img_trains)
    print(img_test)
    num_train = len(img_trains)
    num_test = len(img_test)

    train_imgs = prepare_imgs(img_trains)
    test_imgs_dict = prepare_test_imgs(img_test)

    print(train_imgs.shape)

    #train_dataset = tf.data.Dataset.from_tensor_slices(train_imgs)
    #train_dataset = tf.data.Dataset.from_tensor_slices(test_imgs)

    #training_dataset = (tf.data.Dataset.from_tensor_slices(train_imgs)
    #             .shuffle(num_train).batch(batch_size))

    #test_dataset = (tf.data.Dataset.from_tensor_slices(test_imgs)
    #                .shuffle(num_test).batch(batch_size))

    #for train in train_dataset:
    #    print(train)

    optimizer = tf.keras.optimizers.Adam(1e-3)

    autoencoder = CVAE()

    autoencoder.compile(optimizer=optimizer, loss='binary_crossentropy')

    # checkpoint
    filepath="./saved_models_moreSamples/weights_best.h5"
    checkpoint = ModelCheckpoint(filepath, monitor='loss', save_weights_only=True, verbose=1, save_best_only=True, mode='min')

    history=autoencoder.fit(
        train_imgs,
        y=None,
        epochs=50,
        batch_size=1,
        shuffle=False,
        callbacks=[checkpoint]
    )

    #history=autoencoder.fit(
    #    train_imgs,
    #    y=None,
    #    epochs=50,
    #    batch_size=1,
    #    shuffle=False
    #)

    pred_autoencoder = CVAE()

    input_shape = (1,400,400,3)
    pred_autoencoder.build(input_shape)
    pred_autoencoder.load_weights(filepath)

    #testing_image = test_imgs[0,:,:,:]

    #testing_image_orig = np.squeeze(testing_image,axis=0) * 255

    #origPIL_image = Image.fromarray(np.uint8(testing_image_orig)).convert('RGB')

    #testing_image = np.expand_dims(testing_image,axis=0)

    #prediction = pred_autoencoder.call(testing_image)

    #prediction = np.squeeze(prediction,axis=0) * 255

    #reconsPIL_image = Image.fromarray(np.uint8(prediction)).convert('RGB')

    #origPIL_image.save('original.png')
    #reconsPIL_image.save('reconstructed.png')

    for fn, testImg in test_imgs_dict.items():   
        #get original
        testing_image_orig = np.squeeze(testImg,axis=0) * 255
        origPIL_image = Image.fromarray(np.uint8(testing_image_orig)).convert('RGB')

        #get prediction
        prediction = pred_autoencoder.call(testImg)

        #reshape to 3-D and multiply by 255
        prediction = np.squeeze(prediction,axis=0) * 255

        #get reconstructed
        reconsPIL_image = Image.fromarray(np.uint8(prediction)).convert('RGB')

        #save names
        origSaveName = str(fn) + '_original.png'
        reConstructSaveName = str(fn) + '_reconstructed.png'

        #save paths
        origSavePath = os.path.join(outputs_dir,origSaveName)
        reConstructSavePath = os.path.join(outputs_dir,reConstructSaveName)

        #save images
        origPIL_image.save(origSavePath)
        reconsPIL_image.save(reConstructSavePath)

if __name__=='__main__':
    main()