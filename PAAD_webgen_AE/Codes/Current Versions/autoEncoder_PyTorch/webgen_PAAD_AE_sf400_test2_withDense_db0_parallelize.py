import numpy as np
from PIL import Image, ImageOps
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import matplotlib.pyplot as plt
from torch.utils.data.sampler import SubsetRandomSampler
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.transforms.functional import pad
import numbers
import matplotlib.pyplot as plt
#%matplotlib inline
import torch.nn as nn
import torch.nn.functional as F
from utils_AE_sf400 import *
import glob
import os

def padding(img,expected_size = (280,520)):
    desired_size_w = expected_size[0]
    desired_size_h = expected_size[1]
    #delta_width = desired_size_w - img.size[0]
    #delta_height = desired_size_h - img.size[1]
    #pad_width = delta_width //2
    #pad_height = delta_height //2
    #padding = (pad_width,pad_height,delta_width-pad_width,delta_height-pad_height)
    #return ImageOps.expand(img, padding)
    return ImageOps.pad(img,expected_size)

def get_data_transforms(mean=0.5, std=0.1, APS=175):
    data_transforms = {
        'transf': transforms.Compose([
            transforms.ToTensor()])
            #transforms.Normalize(mean, std)])
    }
    
    return data_transforms

class ConvAutoencoder(nn.Module):
    def __init__(self):
        super(ConvAutoencoder, self).__init__()
       
        #Encoder
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)

        self.flatten = nn.Flatten()
        self.dense = nn.Linear(65*35*128,65*35)
        self.dense2 = nn.Linear(65*35,65*35*128)

       
        #Decoder
        self.t_conv1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.t_conv2 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.t_conv3 = nn.ConvTranspose2d(32, 3, 2, stride=2)


    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = self.pool(x)
        x = F.relu(self.conv2(x))
        x = self.pool(x)
        x = F.relu(self.conv3(x))
        x = self.pool(x)
        x = self.flatten(x)
        #x = self.dense(x)
        #x = x.reshape(-1)
        x = F.relu(self.dense(x))
        x = F.relu(self.dense2(x))
        x = x.view(-1, 128, 35, 65)
        x = F.relu(self.t_conv1(x))
        x = F.relu(self.t_conv2(x))
        x = torch.sigmoid(self.t_conv3(x))
              
        return x

def main():
    source = '/data/scratch/soma/webgen_AE/scaled_400/'
    
    train_fol = source + 'training'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*tif'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*tif'))]
    
    #mean = [0.5,0.5,0.5]
    #std = [0.1,0.1,0.1]
    
    mean, std = get_mean_and_std(data_loader(img_trains,transform=None))
    print("mean is: " + str(mean))
    print("std is: " + str(std))
    
    data_transforms = get_data_transforms(mean, std)
    #data_transforms = get_data_transforms(mean, std, APS)
    #data_transforms = get_data_transforms()
    
    train_set = data_loader(img_trains, transform=data_transforms['transf'])
    test_set = data_loader(img_test, transform=data_transforms['transf'])
    
    train_loader = DataLoader(train_set, batch_size=1, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=1, shuffle=True, num_workers=0)
    
    #Instantiate the model
    model = ConvAutoencoder()
    print(model)

    #Loss function
    criterion = nn.BCELoss()

    #Optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    #optimizer = torch.optim.Adadelta(model.parameters())

    def get_device():
        if torch.cuda.is_available():
            device = 'cuda:2'
        else:
            device = 'cpu'
        return device

    device = get_device()
    print(device)
    model.to(device)
    
    #model = torch.nn.DataParallel(model, device_ids=[3, 4])
    ##cudnn.benchmark = True
    #print('using multiple GPUs')
    
    if torch.cuda.device_count() >= 2:  # use multiple GPUs
        model = torch.nn.DataParallel(model, device_ids=[2, 1])
        cudnn.benchmark = True
        print('using multiple GPUs')
    
    #Epochs
    n_epochs = 50
    
    for epoch in range(1, n_epochs+1):
        # monitor training loss
        train_loss = 0.0

        #Training
        for data in train_loader:
            images, _, fn = data
            images = images.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, images)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()*images.size(0)
              
        train_loss = train_loss/len(train_loader)
        print('Epoch: {} \tTraining Loss: {:.6f}'.format(epoch, train_loss))
    
    #Batch of test images
    dataiter = iter(test_loader)
    images, labels, fn = dataiter.next()
    images = images.to(device)
    labels = labels.to(device)

    #Sample outputs
    output = model(images).cpu()
    images = images.cpu()
    
    for i in range(len(output)):
        print(output[i])
        im = transforms.ToPILImage()(output[i]).convert("RGB")
        saveName=str(fn[i])[:-4] + '_reConstructed_50Epoch_noNorm_withDense.png'
        savePath = os.path.join(source,saveName)
        im.save(savePath)
        
        print(images[i])
        orig =transforms.ToPILImage()(images[i]).convert("RGB")
        orig_saveName=str(fn[i])[:-4] + '_orig_50Epoch_noNorm_withDense.png'
        orig_savePath = os.path.join(source,orig_saveName)
        orig.save(orig_savePath)
    
    #print(output.shape)
    
    #for a in range(32):
        #print(output[a].shape)
    #    im = transforms.ToPILImage()(output[a]).convert("RGB")

    #output = output.view(32, 520, 280, 3)
    
 #   print(output.shape)

    
    #for i in range(len(img_test)): # INITIAL DIM IS 3X280X520
        #img=Image.open(img_test[i]).convert('RGB')
        #array = np.asarray(img)
        #fn = str(i)+'_test.png'
        #im = Image.fromarray(array)
        #im.save(fn)
        #print(img_test[i][0].numpy().shape)
        #print(np.moveaxis(test_set[i][0].numpy(),0,-1).shape)
        #im = Image.fromarray(np.moveaxis(test_set[i][0].numpy(),0,-1),'RGB')
        #im =Image.fromarray(test_set[i][0].numpy(),'RGB')
        #fn = str(i)+'_test.png'
        #im.save(fn)
        #print(orig.shape)

   # for i in range(num_test):
   ##     orig = images[i]
    #    im = Image.fromarray(orig,'RGB')
    #    fn = str(i)+'_test.png'
    #    im.save(fn)
    #    print(orig.shape)
    
    #for i in range(len(train_set)):
    #    print(train_set[i][0].numpy().shape)
    
    #train_loader = DataLoader(train_set, batch_size=32, shuffle=True, num_workers=0)
    #test_loader = DataLoader(test_set, batch_size=32, shuffle=True, num_workers=0)
    
    #i=0 WORKED
    #for test_images, lb, fn in test_loader:# Reshape them according to your needs.
    #    for u in range(len(fn)):
    #        im = transforms.ToPILImage()(test_images[u]).convert("RGB")
    #        #fn = str(fn[u])[:-4]+'_test.png'
    #        saveName=str(fn[u])[:-4] + '_test.png'
    #        im.save(saveName)
            
        #for u in range(32):
        #    print(test_images[u].shape)
        #    im = transforms.ToPILImage()(test_images[u]).convert("RGB")
        #    fn = str(fn[u])[:-4]+'_test.png'
        #    i += 1
        #    im.save(fn)
        #im = transforms.ToPILImage()(test_images[0]).convert("RGB")
        #fn = str(i)+'_test.png'
        #i += 1
        #im.save(fn)
    
    #for img in img_trains:
    ##    imag=padding(Image.open(img).convert('RGB'))
     #   image = np.asarray(imag)
     #   print(image.shape)
        
if __name__=='__main__':
    main()

import numpy as np
from PIL import Image, ImageOps
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.layers import Input, Dense, Conv2D, Activation, MaxPool2D
from tensorflow.keras.layers import BatchNormalization, Flatten, Reshape, Conv2DTranspose, LeakyReLU
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam, SGD
import numbers
import matplotlib.pyplot as plt
#%matplotlib inline
import torch.nn as nn
import torch.nn.functional as F
#from utils_AE_sf400 import *
import glob
import os

def get_padding(X,expected_size=(520,280)):
  print(X.shape[1])
  print(X.shape[2])
  widthCorrect = int((expected_size[1] - int(X.shape[2]))/2)
  heightCorrect = int((expected_size[0]-int(X.shape[1]))/2)
  return widthCorrect, heightCorrect

class CVAE(tf.keras.Model):
  """Convolutional variational autoencoder."""

  def __init__(self, latent_dim):
    super(CVAE, self).__init__()
    self.latent_dim = latent_dim
    self.encoder = tf.keras.Sequential(
        [
            tf.keras.layers.InputLayer(input_shape=(520, 280, 3)),
            tf.keras.layers.Conv2D(
                filters=32, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
            tf.keras.layers.Conv2D(
                filters=64, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
            tf.keras.layers.Conv2D(
                filters=128, kernel_size=3, padding='same', activation='relu'),
            tf.keras.layers.MaxPool2D(pool_size=(2,2),strides=(2,2)),
            tf.keras.layers.Flatten(),
            # No activation
            tf.keras.layers.Dense(65*35),
        ]
    )

    self.decoder = tf.keras.Sequential(
        [
            tf.keras.layers.InputLayer(input_shape=(65*35,)),
            tf.keras.layers.Dense(units=65*35*128, activation=tf.nn.relu),
            tf.keras.layers.Reshape(target_shape=(65, 35, 128)),
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
    widthCorrect, heightCorrect = get_padding(X=X)
    print(widthCorrect)
    print(heightCorrect)
    paddings = tf.constant([[0,0],[heightCorrect,heightCorrect],[widthCorrect,widthCorrect],[0,0]])
    print(paddings)
    X = tf.pad(X,paddings,"CONSTANT")
    X = self.encoder(X)
    X = self.decoder(X)
    return X
    
  @tf.function
  def sample(self, eps=None):
    if eps is None:
      eps = tf.random.normal(shape=(100, self.latent_dim))
    return self.decode(eps, apply_sigmoid=True)

  def encode(self, x):
    mean, logvar = tf.split(self.encoder(x), num_or_size_splits=2, axis=1)
    return mean, logvar

  def reparameterize(self, mean, logvar):
    eps = tf.random.normal(shape=mean.shape)
    return eps * tf.exp(logvar * .5) + mean

  def decode(self, z, apply_sigmoid=False):
    logits = self.decoder(z)
    if apply_sigmoid:
      probs = tf.sigmoid(logits)
      return probs
    return logits

optimizer = tf.keras.optimizers.Adam(1e-4)

autoencoder = CVAE(10)

autoencoder.compile(optimizer=optimizer, loss='binary_crossentropy')

input_shape=(1,520,280,3)

autoencoder.build(input_shape)

autoencoder.summary()


def log_normal_pdf(sample, mean, logvar, raxis=1):
  log2pi = tf.math.log(2. * np.pi)
  return tf.reduce_sum(
      -.5 * ((sample - mean) ** 2. * tf.exp(-logvar) + logvar + log2pi),
      axis=raxis)


def compute_loss(model, x):
  mean, logvar = model.encode(x)
  z = model.reparameterize(mean, logvar)
  x_logit = model.decode(z)
  cross_ent = tf.nn.sigmoid_cross_entropy_with_logits(logits=x_logit, labels=x)
  logpx_z = -tf.reduce_sum(cross_ent, axis=[1, 2, 3])
  logpz = log_normal_pdf(z, 0., 0.)
  logqz_x = log_normal_pdf(z, mean, logvar)
  return -tf.reduce_mean(logpx_z + logpz - logqz_x)


@tf.function
def train_step(model, x, optimizer):
  """Executes one training step and returns the loss.

  This function computes the loss and gradients, and uses the latter to
  update the model's parameters.
  """
  with tf.GradientTape() as tape:
    loss = compute_loss(model, x)
  gradients = tape.gradient(loss, model.trainable_variables)
  optimizer.apply_gradients(zip(gradients, model.trainable_variables))

def padding(img,expected_size = (280,520)):
    desired_size_w = expected_size[0]
    desired_size_h = expected_size[1]
    #delta_width = desired_size_w - img.size[0]
    #delta_height = desired_size_h - img.size[1]
    #pad_width = delta_width //2
    #pad_height = delta_height //2
    #padding = (pad_width,pad_height,delta_width-pad_width,delta_height-pad_height)
    #return ImageOps.expand(img, padding)
    return ImageOps.pad(img,expected_size)

def main():
    source = '/data/scratch/soma/webgen_AE/scaled_400/'
    
    train_fol = source + 'training'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*tif'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*tif'))]


        
if __name__=='__main__':
    main()
