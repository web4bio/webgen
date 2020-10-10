from utils import *
import data

CHANNEL_OUTPUT = 3

EPOCHS = 10

train_dir = '/data03/shared/yuwei/samples/train/'
test_dir = '/data03/shared/yuwei/samples/test/'

plt_result = '/data03/shared/yuwei/plt_results/'


def train(x_train):
    """
    build autoencoder
    :param x_train: the training dataset
    :return: encoder and decoder
    """

    # input placeholder
    input_img = Input(shape=(400,400,3))

    # encoding layer
#     x = Conv2D(8, (3,3), activation='relu',padding='same')(input_img)
    x = Conv2D(16, (3,3),  activation='relu',padding='same')(input_img)
    x = MaxPool2D((2,2), padding='same')(x)
    x = Conv2D(32, (3,3), activation='relu', padding='same')(x)
    encoded = MaxPool2D((2,2), padding='same')(x)

    # decoding layer
    x = UpSampling2D((2,2))(encoded)
#     x = Conv2D(32, (3,3), activation='relu',padding='same')(x)
    x = Conv2D(32, (3,3), activation='relu',padding='same')(x)
    x = UpSampling2D((2,2))(x)
    x = Conv2D(16, (3,3),  activation='relu',padding='same')(x)
    decoded = Conv2D(CHANNEL_OUTPUT, (3,3), activation='sigmoid', padding='same')(x)
    # build autoencoder, encoder, and decoder
    autoencoder = Model(inputs=input_img, outputs=decoded)
    encoder = Model(inputs=input_img, outputs=encoded)

    # compile autoencoder
    autoencoder.compile(optimizer='adam', loss=losses.MeanAbsoluteError())
    autoencoder.summary()

    # history
    history_re = autoencoder.fit(x_train, x_train, shuffle=True, epochs=EPOCHS)

    return encoder, autoencoder, history_re


def plot_accuracy(history_re):
    """
    plot the accuracy and loss line
    :param history_re:
    :return:
    """

    accuracy = history_re.history['acc']
    loss = history_re.history['loss']
    epochs = range(len(accuracy))
    plt.plot(epochs, accuracy, 'bo', label='Training accurarcy')
    plt.title('Training Accuracy')
    plt.legend()
    plt.figure()
    plt.plot(epochs, loss, 'bo', label='Training loss')
    plt.title('Training loss')
    plt.legend()
    plt.show()
    plt.savefig(plt_result+'history.png')

def show_images(decode_img, x_test):
    """
    plot the images and save encoding results
    :param decode_img: the images after decoding
    :param x_test: testing data
    :return:
    """
    n = 10
    plt.figure(figsize=(20,4))
    for i in range(n):
        ax = plt.subplot(2, n, i+1)
        ax.imshow(x_test[i])
        ax.get_xaxis().set_visible(False)
        ax.get_yaxis().set_visible(False)
        
        ax = plt.subplot(2, n, i+1+n)
        ax.get_xaxis().set_visible(False)
        ax.get_yaxis().set_visible(False)
        plt.savefig(plt_result+'compare.png')
  



if __name__ == '__main__':

    # data preparation
    train_data, test_data = data.data_preparation(train_dir, test_dir)
    train_data = train_data.astype('float32') / 255
    test_data = test_data.astype('float32') / 255

    # reshape data
    train_data = train_data.reshape((train_data.shape[0],400,400,3))
    test_data = test_data.reshape((test_data.shape[0],400,400,3))

    # train
    encoder, autoencoder, history_re = train(train_data)

    # save model
    autoencoder.save('./model')
    conModel = keras.models.load_model('./model')

    # test
    decode_name = os.listdir(test_dir)
    decode_images = conModel.predict(test_data)
    for i in range(len(decode_images)):
        plt.savefig('./decode_results/'+decode_name[i], decode_images[i])

