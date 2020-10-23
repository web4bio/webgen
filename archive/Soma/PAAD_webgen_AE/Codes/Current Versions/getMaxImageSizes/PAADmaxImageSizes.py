import os
from PIL import Image

src_dir = '/Users/soma/Desktop/training_downsampled_tif_scalefactor_600'

imgs = [i for i in os.listdir(src_dir) if i.endswith('.tif')]

def main():
    widthList = []
    heightList = []
    for img in imgs:
        path = os.path.join(src_dir,img)
        im = Image.open(path)
        widthList.append(im.size[0])
        heightList.append(im.size[1])
    
    maxWidth = max(widthList)
    maxHeight = max(heightList)
    
    print('maxWidth is: ' + str(maxWidth))
    print('maxHeight is: ' + str(maxHeight))

if __name__=='__main__':
    main()
        
