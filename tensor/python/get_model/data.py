import os
import numpy as np
from keras.preprocessing import image
from keras.applications.imagenet_utils import preprocess_input
from PIL import Image


def data_preparation(train_dir, test_dir):
    """
    generate train_set and test_set
    :param train_dir: the directory of training dataset
    :param test_dir: the directory of testing dataset
    :return: train_data, test_data
    """
    train_set = []
    test_set = []

    # generate train
    for img in os.listdir(train_dir):
        try:
            i = np.array(Image.open(train_dir+img).convert('RGB'))
            train_set.append(i)
        except Exception as e:
           print("some errors but pass!")
           pass

    # generate test
    for img in os.listdir(test_dir):
        try:
            i = np.array(Image.open(test_dir+img).convert('RGB'))
            test_set.append(i)
        except Exception as e:
           print(img + "has some errors but pass!")
           pass
    train_data = np.array(train_set)
    test_data = np.array(test_set)
    return train_data, test_data
