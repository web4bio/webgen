import numpy as np
from  matplotlib import pyplot as plt
import os
import tensorflow as tf
import keras
from keras.models import Model
from keras.layers import Conv2D, MaxPool2D, Input, UpSampling2D
from keras import layers, losses
from keras.preprocessing import image
from keras.applications.imagenet_utils import preprocess_input