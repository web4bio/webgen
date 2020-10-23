import torch
from torch.utils.data import DataLoader, Dataset
import torch.nn.parallel
import torch.backends.cudnn as cudnn
from torch.autograd import Variable
import sys
import argparse
from PIL import Image, ImageOps
from PIL import ImageFile
from torchvision import transforms

def get_label_from_filename(fn):
    # *_{lb}.png --> extract the label
    lb=1 #don't care about label
    
    return lb

def padding(img,expected_size = (320,160)):
    desired_size_w = expected_size[0]
    desired_size_h = expected_size[1]
    #delta_width = desired_size_w - img.size[0]
    #delta_height = desired_size_h - img.size[1]
    #pad_width = delta_width //2
    #pad_height = delta_height //2
    #padding = (pad_width,pad_height,delta_width-pad_width,delta_height-pad_height)
    #return ImageOps.expand(img, padding)
    return ImageOps.pad(img,expected_size)


class data_loader(Dataset):
    """
    Dataset to read image and label for training
    """
    def __init__(self, imgs, transform=None):
        self.imgs = imgs
        self.transform = transform
    
    def __getitem__(self, index):
        path = self.imgs[index]
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        #img = Image.open(self.imgs[index]).convert('RGB')
        img = padding(img=Image.open(self.imgs[index]).convert('RGB'))
        if self.transform != None:
            img = self.transform(img)
        else:
            img = transforms.ToTensor()(img)
        lb = get_label_from_filename(self.imgs[index])
        fn = str(path).split('/')[-1]
        return img, lb, fn

    def __len__(self):
        return len(self.imgs)


def parallelize_model(model):
    if torch.cuda.is_available():
        model = model.cuda()
        # model = torch.nn.DataParallel(model, device_ids=range(torch.cuda.device_count()))
        model = torch.nn.DataParallel(model, device_ids=[0, 1])
        cudnn.benchmark = True
    return model


def unparallelize_model(model):
    try:
        while 1:
            # to avoid nested dataparallel problem
            model = model.module
    except AttributeError:
        pass
    return model


def cvt_to_gpu(X):
    return Variable(X.cuda()) if torch.cuda.is_available() \
    else Variable(X)


def get_mean_and_std(dataset):
    '''Compute the mean and std value of dataset.'''
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=1, shuffle=True, num_workers=8)
    mean = torch.zeros(3)
    std = torch.zeros(3)
    print('==> Computing mean and std..')
    cnt = 0
    for inputs, targets, _ in dataloader:
        cnt += 1
        if cnt % 1000 == 0:
            print(cnt)
            sys.stdout.flush()

        for i in range(3):
            mean[i] += inputs[:,i,:,:].mean()
            std[i] += inputs[:,i,:,:].std()
    mean.div_(len(dataset))
    std.div_(len(dataset))
    print('mean, std: ', mean, std)
    return mean, std


def str2bool(v):
    if isinstance(v, bool):
       return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')
