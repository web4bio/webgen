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
from utils_AE import *
import glob
import os
import copy
import time

def extract_model_path():
    global save_point
    
    saved_models = [m for m in os.listdir(save_point) if m.endswith('Dict.pt')]
    print(saved_models)
    
    topEpoch = 0
    bestPath = None
    topModel = None

    bestPath2 = None

    for savedModel in saved_models:
        epochNum = int(str(savedModel).split('_')[5])
        print(epochNum)
        if topEpoch ==0:
            print('1')
            topEpoch = epochNum
            topModel = savedModel
        elif epochNum > topEpoch:
            print('2')
            topEpoch = epochNum
            bestPath = os.path.join(save_point,savedModel)
            topModel = savedModel
        elif epochNum < topEpoch:
            print('')
            topEpoch = topEpoch
    if bestPath == None:
        raise Exception ('ERROR: path is None')

    else:
        otherSave = str(topModel)[:-17] + '.pt'
        bestPath2 = os.path.join(save_point,otherSave)
    
    return bestPath, bestPath2
        

def get_args(forVariableLR=1e-3,forVariableWD=0,forVariableEpoch=4,forVariableBS=1):
    parser = argparse.ArgumentParser(description='Yang Mice Colitis Training')
    parser.add_argument('--lr', default=forVariableLR, type=float, help='learning rate')
    parser.add_argument('--weight_decay', default=forVariableWD, type=float, help='weight decay')
    parser.add_argument('--batch_size', default=forVariableBS, type=int)
    parser.add_argument('--num_workers', default=8, type=int)
    parser.add_argument('--num_epochs', default=forVariableEpoch, type=int, help='Number of epochs in training')
    parser.add_argument('--check_after', default=2, type=int, help='check the network after check_after epoch')

    args = parser.parse_args()
    return args

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
        x = F.relu(self.t_conv1(x))
        x = F.relu(self.t_conv2(x))
        x = torch.sigmoid(self.t_conv3(x))
              
        return x

def main():
    global timestr 
    global save_point

    timestr = time.strftime("%Y%m%d-%H%M%S")
    args = get_args()

    source = '/data/scratch/soma/webgen_AE/initial/'
    dest = source + 'outputs_noDense_TEST'

    if not os.path.exists(dest):
        os.mkdir(dest)
    
    train_fol = source + 'train'
    test_fol = source + 'test'
    
    img_trains = [f for f in glob.glob(os.path.join(train_fol, '*png'))]
    img_test = [f for f in glob.glob(os.path.join(test_fol, '*png'))]
    print(img_test)
    #mean, std = get_mean_and_std(data_loader(img_trains,transform=None))
    #print("mean is: " + str(mean))
    #print("std is: " + str(std))
    
    data_transforms = get_data_transforms()
    #data_transforms = get_data_transforms(mean, std, APS)
    #data_transforms = get_data_transforms()
    
    train_set = data_loader(img_trains, transform=data_transforms['transf'])
    test_set = data_loader(img_test, transform=data_transforms['transf'])
    
    train_loader = DataLoader(train_set, batch_size=args.batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_set, batch_size=args.batch_size, shuffle=True, num_workers=0)
    
    #Instantiate the model
    model = ConvAutoencoder()
    print(model)

    #Loss function
    criterion = nn.BCELoss()

    #Optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    #optimizer = torch.optim.Adadelta(model.parameters())

    def get_device():
        if torch.cuda.is_available():
            device = 'cuda:1'
        else:
            device = 'cpu'
        return device

    #if torch.cuda.device_count() >= 2:  # use multiple GPUs
    #    model = torch.nn.DataParallel(model, device_ids=[2, 1])
    #    cudnn.benchmark = True
    #    print('using multiple GPUs')

    device = get_device()
    print(device)
    model.to(device)
    
    #Epochs
    n_epochs = args.num_epochs
    best_loss = 0
    
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

        if epoch==1:
            best_loss = train_loss

        elif train_loss < best_loss:
            best_loss = train_loss
            best_model = copy.deepcopy(model)
            state = {
                'model': best_model,
                'loss': best_loss,
                'args': args,
                'lr': args.lr,
                'saved_epoch': epoch,
            }
            checkpoint_dir = os.path.join(dest,'checkpoint_CAE')
            if not os.path.exists(checkpoint_dir):
                    os.mkdir(checkpoint_dir)
            save_point = checkpoint_dir + '/run' + '_' + 'on' + '_' + timestr 
            if not os.path.exists(save_point):
                os.mkdir(save_point)

            saved_model_fn = 'CAE_{}_bestLoss_{:.4f}_epoch_{}.pt'.format(timestr,
                                                                        best_loss,
                                                                        epoch)
            saved_model_fn2 = 'CAE_{}_bestLoss_{:.4f}_epoch_{}_fromStateDict.pt'.format(timestr,
                                                                        best_loss,
                                                                        epoch)
            torch.save(state, os.path.join(save_point, saved_model_fn))
            torch.save(model.state_dict(), os.path.join(save_point, saved_model_fn2))
            print('=======================================================================')

    ### Apply best model to test set
    #checkpoint_dir = os.path.join(dest,'checkpoint_CAE')
    #save_point = checkpoint_dir + '/run' + '_' + 'on' + '_' + timestr 
    stateDictPath, otherPath = extract_model_path()

    model_stateDict = ConvAutoencoder()
    #model_Other = ConvAutoencoder()
    
    model_stateDict.load_state_dict(torch.load(stateDictPath))

    #checkpoint_other = torch.load(otherPath)
    #model_Other = checkpoint_other['model'].module

    model_stateDict.to(device)
    model_stateDict.eval()

    for i, (images, labels, fn) in enumerate(test_loader,0):
        print("on: " + str(images))
        images = images.to(device)
        labels = labels.to(device)

        output = model_stateDict(images)
        output = output.cpu()
        images = images.cpu()

        for i in range(len(output)):
            print(output[i])
            im = transforms.ToPILImage()(output[i]).convert("RGB")
            saveName=str(fn[i])[:-4] + '_reConstructed_50Epoch_noNorm_noDense.png'
            savePath = os.path.join(dest,saveName)
            im.save(savePath)
                
            print(images[i])
            orig =transforms.ToPILImage()(images[i]).convert("RGB")
            orig_saveName=str(fn[i])[:-4] + '_orig_50Epoch_noNorm_noDense.png'
            orig_savePath = os.path.join(dest,orig_saveName)
            orig.save(orig_savePath)

    #with torch.nograd():
    #    for i, (images, labels, fn) in enumerate(test_loader,0):
    #        print("on: " + str(images))
    #        images = images.to(device)
    #        labels = labels.to(device)
    #
    #        output = model_stateDict(images).cpu()
    #        images = images.cpu()
    #
    #        for i in range(len(output)):
    ##            print(output[i])
    #            im = transforms.ToPILImage()(output[i]).convert("RGB")
    #            saveName=str(fn[i])[:-4] + '_reConstructed_50Epoch_noNorm_noDense.png'
    #            savePath = os.path.join(dest,saveName)
    #            im.save(savePath)
    #            
    #            print(images[i])
    #            orig =transforms.ToPILImage()(images[i]).convert("RGB")
    #            orig_saveName=str(fn[i])[:-4] + '_orig_50Epoch_noNorm_noDense.png'
    #            orig_savePath = os.path.join(dest,orig_saveName)
    #            orig.save(orig_savePath)#


    #Batch of test images
    #dataiter = iter(test_loader)
    #images, labels, fn = dataiter.next()
    #images = images.to(device)
    #labels = labels.to(device)

    #Sample outputs
    #output = model(images).cpu()
    #images = images.cpu()
    
    #for i in range(len(output)):
    #    print(output[i])
    #    im = transforms.ToPILImage()(output[i]).convert("RGB")
    #    saveName=str(fn[i])[:-4] + '_reConstructed_50Epoch_noNorm_noDense.png'
    #    savePath = os.path.join(dest,saveName)
    #    im.save(savePath)
    #    
    #    print(images[i])
    #    orig =transforms.ToPILImage()(images[i]).convert("RGB")
    #    orig_saveName=str(fn[i])[:-4] + '_orig_50Epoch_noNorm_noDense.png'
    #    orig_savePath = os.path.join(dest,orig_saveName)
    #    orig.save(orig_savePath)

if __name__=='__main__':
    main()