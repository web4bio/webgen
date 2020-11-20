#from IPython import display
import tensorflow.keras as keras
from tensorflow.keras.callbacks import ModelCheckpoint
import glob
import imageio
import matplotlib.pyplot as plt
import numpy as np
import PIL
from PIL import Image
import tensorflow as tf
#import tensorflow_probability as tfp
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
            tf.keras.layers.Conv1D(filters=10,kernel_size=1,activation='relu')
        ]
    )

    self.decoder = tf.keras.Sequential(
        [
            tf.keras.layers.InputLayer(input_shape=(50,50,10)),
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
        print('IN TRAIN STEP!!!!')
        print(data)
        print(data.shape)
        pred = self.call(data)
        loss = self.compiled_loss(data,pred,regularization_losses=self.losses)

    trainable_vars = self.trainable_variables
    gradients = tape.gradient(loss, trainable_vars)

    self.optimizer.apply_gradients(zip(gradients, trainable_vars))
    self.compiled_metrics.update_state(data, pred)
    return {m.name: m.result() for m in self.metrics}

def test_inference(testExamples, infer, labeling):
    global outputs_dir
    for test_example in those_examples:
        # extract file names
        fn_png_bytes = test_example.features.feature['fn'].bytes_list.value[0]
        fn_decode = tf.compat.as_str_any(fn_png_bytes)

        orig_saveName = str(fn_decode)[:-4] + '_original.png'
        reConstructSaveName = str(fn_decode)[:-4] + '_reconstructed.png'
 
        # extract image data
        img_png_bytes = test_example.features.feature['img'].bytes_list.value[0]
        tf.compat.v1.disable_eager_execution()
        bytes = tf.compat.v1.placeholder(tf.string)
        session = tf.compat.v1.Session()
        decode_png = tf.image.decode_png(bytes, channels=3)
        image = session.run(decode_png,feed_dict={bytes:img_png_bytes})

        imgTensor = tf.convert_to_tensor(image)
        imgTensor = tf.cast(imgTensor,"int32")
        imgTensor= tf.expand_dims(imgTensor,axis=0)

        #prediction
        prediction = infer(tf.constant(imgTensor,dtype=float))['output_1']

        #reshape to 3-D and multiply by 255
        prediction = np.squeeze(prediction,axis=0) * 255

        #get reconstructed
        reconsPIL_image = Image.fromarray(np.uint8(prediction)).convert('RGB')

        #get original
        origTens = tf.squeeze(imgTensor,axis=0)
        newArray = newTens.eval(session=tf.compait.v1.Session())
        origPIL_image = Image.fromarray(np.uint8(newArray)).convert('RGB')

        #save paths
        origSavePath = os.path.join(outputs_dir,orig_saveName)
        reConstructSavePath = os.path.join(outputs_dir,reConstructSaveName)

        #save images
        origPIL_image.save(origSavePath)
        reconsPIL_image.save(reConstructSavePath)

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
        imgTensor = tf.cast(imgTensor,"float")
        imgTensor= tf.expand_dims(imgTensor,axis=0)

        if counter == 0:
            finalTensor = imgTensor
            counter += 1
        elif counter > 0:
            finalTensor = tf.concat([finalTensor,imgTensor],axis=0)
    
    return finalTensor


def main():
    global outputs_dir
    os.environ['CUDA_VISIBLE_DEVICES'] = '0'

    #Directories:
    saved_models = os.path.join(os.getcwd(),'saved_models_tfRecords')
    if not os.path.exists(saved_models):
        os.mkdir(saved_models)
    
    outputs_dir = os.path.join(os.getcwd(),'outputs_savedModelTest_tfRecords')
    if not os.path.exists(outputs_dir):
        os.mkdir(outputs_dir)

    train_filepath = '/data/scratch/soma/webgen_AE/Split/tfRecordFiles/testtFrecord_train.tfrecords'
    test_filepath = '/data/scratch/soma/webgen_AE/Split/tfRecordFiles/testtFrecord_test.tfrecords'
    
    reader_train = tf.compat.v1.io.tf_record_iterator(train_filepath)
    reader_test = tf.compat.v1.io.tf_record_iterator(test_filepath)

    train_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader_train]

    test_examples = [tf.train.Example().FromString(example_str)
                  for example_str in reader_test]

    finalTensor_train = decode_totensors(train_examples)
    #finalTensor_test = decode_totensors(test_examples)

    optimizer = tf.keras.optimizers.Adam(1e-3)

    autoencoder = CVAE()

    autoencoder.compile(optimizer=optimizer, loss='binary_crossentropy')

    # checkpoint
    filepath="./saved_models_tfRecords/weights_best.h5"
    checkpoint = ModelCheckpoint(filepath, monitor='loss', save_weights_only=True, verbose=1, save_best_only=True, mode='min')
    
    num_examples = len(train_examples)
    
    history=autoencoder.fit(
        finalTensor_train,
        y=None,
        epochs=3,
        batch_size=1,
        shuffle=False,
        callbacks=[checkpoint]
    )

    #history=autoencoder.fit(
    #    train_imgs,
    #    y=None,
    #    epochs=4,
    #    batch_size=1,
    #    shuffle=False
    #)
    save_autoencoder = CVAE()
    input_shape = (1,400,400,3)
    save_autoencoder.build(input_shape)
    save_autoencoder.load_weights(filepath)

    modelSavePath = './tfSavedModels_tfRecords/'
    if not os.path.exists(modelSavePath):
        os.mkdir(modelSavePath)

    dummyImage = train_imgs[0,:,:,:]
    dummyImage = np.expand_dims(dummyImage,axis=0)

    save_autoencoder.predict(dummyImage)

    #save_autoencoder.save(modelSavePath,save_format='tf')
    tf.saved_model.save(save_autoencoder,modelSavePath)

    pred_autoencoder = tf.saved_model.load(modelSavePath) 

    infer = pred_autoencoder.signatures["serving_default"]
    print(infer.structured_outputs)
    print(infer)

    labeling = infer(tf.constant(dummyImage,dtype=float))['output_1']
    print(labeling)
    print(labeling.shape)

    test_examples = test_examples[:5]

    test_inference(test_examples,infer,labeling)

if __name__=='__main__':
    main()
