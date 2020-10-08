import os
import openslide
import random

wsi = '/data03/shared/yuwei/webgen/PAAD_wsi/'
w_cases = os.listdir(wsi)
size = 4000
location = '/data03/shared/yuwei/PAAD_patches_4000X/'

'''function for generating patches'''
def generate_patch(image_path, patch_size, case_name):
    try:
        ful_til = openslide.open_slide(image_path)
        width = ful_til.dimensions[0]
        height = ful_til.dimensions[1]
        for i in range(500):
            x = random.randint(0,width)
            y = random.randint(0,height)
            if not os.path.exists(location + case_name): 
                 os.makedirs(location + case_name)
            patch = ful_til.read_region((x,y),0,(patch_size,patch_size))
            patch_name = location + case_name + '/' + case_name + '_' + str(x) + '_' + str(y) + '.png'
            patch.save(patch_name)
            print(patch_name + ' Save!')
    except OSError:
        print('WSI can\'t be opened!')
        pass


'''go through different cases and get whole slide images'''
if __name__ == '__main__':
    for case in w_cases:
        w_path = wsi + case + '/'
        images = os.listdir(w_path)
        for i in images:
            i_path = w_path + i
            print(i_path)
            generate_patch(i_path, size, case)