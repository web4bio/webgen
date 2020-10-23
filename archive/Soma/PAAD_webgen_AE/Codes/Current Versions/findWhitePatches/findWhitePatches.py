import PIL
from PIL import Image
import os
import shutil
import csv
import numpy as np

patch_HW = 400
num_pixels = 400*400

patients_dir = '/data03/shared/yuwei/PAAD_patches_4000X'

destination_dir = '/data01/shared/skobayashi/PAAD_patches_4000X_whiteFiltered'
white_destination_dir = destination_dir + '/allwhitePatches'
tissue_destination_dir = destination_dir + '/alltissuePatches'

byPatients_dir = destination_dir + '/byPatient'
badPatch_dir = destination_dir + '/badPatches'

if not os.path.exists(destination_dir):
    os.mkdir(destination_dir)

if not os.path.exists(white_destination_dir):
    os.mkdir(white_destination_dir)

if not os.path.exists(tissue_destination_dir):
    os.mkdir(tissue_destination_dir)

if not os.path.exists(byPatients_dir):
    os.mkdir(byPatients_dir)

if not os.path.exists(badPatch_dir):
    os.mkdir(badPatch_dir)

def prepare_patient_dirs(patientID):
    global patient_whites
    global patient_tissues
    global patient_dest
    global patient_bad

    patient_dest = os.path.join(byPatients_dir,patientID)
    patient_whites = os.path.join(patient_dest,'whitePatches')
    patient_tissues = os.path.join(patient_dest,'tissuePatches')
    patient_bad = os.path.join(patient_dest,'badPatches')

    if not os.path.exists(patient_dest):
        os.mkdir(patient_dest)
    
    if not os.path.exists(patient_whites):
        os.mkdir(patient_whites)
    
    if not os.path.exists(patient_tissues):
        os.mkdir(patient_tissues)

    if not os.path.exists(patient_bad):
        os.mkdir(patient_bad)
        

def detect_white(imagePath):
    global whiteCount
    global tissueCount
    global badCount
    global totalCount
    global white_destination_dir
    global tissue_destination_dir
    global patient_whites
    global patient_tissues
    global patientDir
    global whiteCount
    global tissueCount
    global patient_bad

    infoList = []

    ## get general patch info
    patchName = str(imagePath).split('/')[-1][:-4]
    patchSaveName =str(imagePath).split('/')[-1]

    ptID = str(imagePath)[0:36]
    xCoord = str(imagePath).split('_')[1]
    yCoord = str(imagePath).split('_')[2]

    ## open patch, calculate white freq
    patch = Image.open(imagePath)
    patchArray = np.array(patch)

    if len(patchArray.shape) == 0:
        print('Patch ' + str(patchName) + ' is bad.')
        totalCount += 1
        badCount += 1
        src = os.path.join(patientDir,patchSaveName)
        ptDest = os.path.join(patient_bad,patchSaveName)
        aggDest = os.path.join(badPatch_dir,patchSaveName)

        shutil.copy(src,ptDest)
        shutil.copy(src,aggDest)

        next

    else:
        R = patchArray[:,:,0]
        G = patchArray[:,:,1]
        B = patchArray[:,:,2]

        redWhiteCount = (R>200).sum()
        greenWhiteCount = (G>200).sum()
        blueWhiteCount = (B>200).sum()

        redWhiteFreq = redWhiteCount/num_pixels
        greenWhiteFreq = greenWhiteCount/num_pixels
        blueWhiteFreq = blueWhiteCount/num_pixels

        # save info, copy patches depending on patch type
        if (redWhiteFreq>.65) and (greenWhiteFreq>.65) and (blueWhiteFreq>.65): # this is a white patch
            whiteCount +=1
            totalCount +=1

            src = os.path.join(patientDir,patchSaveName)
            ptDest = os.path.join(patient_whites,patchSaveName)
            aggDest = os.path.join(white_destination_dir,patchSaveName)

            shutil.copy(src,ptDest)
            shutil.copy(src,aggDest)

            infoList.append(patchName)
            infoList.append(ptID)
            infoList.append(xCoord)
            infoList.append(yCoord)
            infoList.append('White')
        
        else:
            tissueCount +=1
            totalCount +=1

            src = os.path.join(patientDir,patchSaveName)
            ptDest = os.path.join(patient_tissues,patchSaveName)
            aggDest = os.path.join(tissue_destination_dir,patchSaveName)

            shutil.copy(src,ptDest)
            shutil.copy(src,aggDest)
            infoList.append(patchName)
            infoList.append(ptID)
            infoList.append(xCoord)
            infoList.append(yCoord)
            infoList.append('Tissue')
    
    return infoList
        

def main():
    global patientDir
    global whiteCount
    global tissueCount
    global patient_dest
    global badCount
    global totalCount

    appendDict = {}
    totalInfoList=[]

    patients = [folder for folder in os.listdir(patients_dir) if len(str(folder))==36]
    for patient in patients:
        whiteCount = 0
        tissueCount = 0
        totalCount = 0
        badCount = 0

        patientDir = os.path.join(patients_dir,patient)

        #create patient specific destianation directories
        prepare_patient_dirs(patient)

        #gather patients patches into list
        patches = [p for p in os.listdir(patientDir) if p.endswith('.png')]

        #do search and save relevant patch info
        for patch in patches:
            print('Currently on patch: ' +str(patch))
            patchPath = os.path.join(patientDir,patch)
            patchInfoList = detect_white(patchPath)
            totalInfoList.append(patchInfoList)
        
        text_dest = patient_dest + '/WhiteorTissuePatchFilter_PAAD_Summary_' + str(patient) + '.txt'
        txtSumm = open(text_dest,"w+")
        txtSumm.write("total # samples is: %d\n" %(totalCount))
        txtSumm.write("total # white patches is: %d\n" % (whiteCount))
        txtSumm.write("total # tissue patches is: %d\n" % (tissueCount))
        txtSumm.write("total # bad/missed patches is: %d\n" % (badCount))
        txtSumm.close()
    
    csv_dest = destination_dir + '/WhiteorTissuePatchFilter_PAAD_Summary.csv'
    with open(csv_dest,'w') as csvfile:
        fieldnames = ['patchID','ptID',
                    'xCoord','yCoord',
                    'WhiteorTissue']
        testwriter = csv.DictWriter(csvfile, fieldnames=fieldnames)
        testwriter.writeheader()
        for i in range(len(totalInfoList)):
            toAppend = strSplitList[i]
            appendDict['patchID']=toAppend[8]
            appendDict['ptID']=toAppend[0]
            appendDict['xCoord']=toAppend[9]
            appendDict['yCoord']=toAppend[1]
            appendDict['WhiteorTissue']=toAppend[2]
            testwriter.writerow(appendDict)
    
if __name__=='__main__':
    main()