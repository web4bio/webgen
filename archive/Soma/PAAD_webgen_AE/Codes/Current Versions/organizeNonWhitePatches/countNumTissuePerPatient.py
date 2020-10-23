import os
import csv

def main():
    byPatient_dir = '/data01/shared/skobayashi/PAAD_patches_400X400_whiteFiltered/byPatient'

    patients = [p for p in os.listdir(byPatient_dir) if len(p)==36]
    appendDict = {}
    appendList = []
    counter = 0

    numPatients = len(patients)
    for patient in patients:
        counter += 1
        print('On Patient: ' + str(patient) + '   ||  ' + 'patient ' + str(counter) + '/' + str(numPatients))
        appendMe = []
        patientPath = os.path.join(byPatient_dir,patient)
        patientTissuePath = os.path.join(patientPath,"tissuePatches")
        patches = [patch for patch in os.listdir(patientTissuePath) if patch.endswith('.png')]
        numGoodPatches = len(patches)
        appendMe.append(str(patient))
        appendMe.append(numGoodPatches)
        appendList.append(appendMe)
    
    with open('/data01/shared/skobayashi/PAAD_patches_400X400_whiteFiltered/byPatient/goodPatchCounts.csv','w') as csvfile:
        fieldnames = ['patientID','numGoodPatches']
        testwriter = csv.DictWriter(csvfile, fieldnames=fieldnames)
        testwriter.writeheader()
        for i in range(len(appendList)):
            toAppend = appendList[i]
            appendDict['patientID']=toAppend[0]
            appendDict['numGoodPatches']=toAppend[1]
            testwriter.writerow(appendDict)

if __name__=='__main__':
    main()
