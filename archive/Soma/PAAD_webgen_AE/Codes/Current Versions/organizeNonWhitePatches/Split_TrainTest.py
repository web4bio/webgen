import os
import shutil

TEST_PTS= ['76e9e1d8-ce04-44f4-8d76-c65e0f44d489','4dff9fed-6186-4452-aa1e-7975922dd339','48e35ea7-c3e3-405b-ac99-6686b9a1f172',
            '3f5318cf-8fb9-4721-8036-7c466934ef09','5f40e726-c9c5-4baa-9bd1-1968dd3215f9','2d37da49-5c9e-4e29-8433-653f50dcf660',
            '01ed7022-b84c-48f5-9f39-d7cf6e734777','b1f23c43-d1bf-42d2-8961-8d557e2ae783','dee0f004-fd8b-4cd6-85c0-3fa3e0ae32b4',
            'a4fc2ecc-1cf4-4a47-a9a8-17c697ac4f7a','f815c47f-d06d-4128-a933-1e324f7d4c5e','730e11d0-39a5-4443-aba6-eedca47ebdcd',
            '52fced5c-fb1c-4390-a942-8eb504f809e4','683b4137-1f0d-4e51-a2c8-01212d58cbaf','a9b04cc4-b0ed-419d-9646-83a1fb087e0f',
            '37e9c31f-ea56-482e-a1eb-d1a09bdae491','bb6298cc-fbaf-481a-80e3-19de55768fc7','5a262b69-b855-415b-bbc5-883371d6a3a0',
            'ce41c1fb-7680-4333-b872-fc52237c7ebb','b7adab86-ea9c-411f-86c5-19e597b8eb07','5da45324-98ac-4187-bdae-fe3cffd47ff7',
            'ac6e8dc7-552e-448b-b508-146316f6a7b7','207ee5be-9568-45ba-9bb1-7aa87323deff','4b82cf00-6a82-4b1b-9f78-da43554aee1a',
            '7d061275-b0e2-4b24-907a-5f7733e0e9f8']

byPatient_dir = '/data01/shared/skobayashi/PAAD_patches_400X400_whiteFiltered/byPatient'

main_dir = '/data01/shared/skobayashi/PAAD_patches_400X400_whiteFiltered/'

dest_dir = main_dir + 'Split'

train_dir = os.path.join(dest_dir,'training')
test_dir = os.path.join(dest_dir,'test')

if not os.path.exists(dest_dir):
    os.mkdir(dest_dir)

if not os.path.exists(train_dir):
    os.mkdir(train_dir)

if not os.path.exists(test_dir):
    os.mkdir(test_dir)

def main():
    
    patients = [p for p in os.listdir(byPatient_dir) if len(p)==36]

    for patient in patients:
        #counter += 1
        #print('On Patient: ' + str(patient) + '   ||  ' + 'patient ' + str(counter) + '/' + str(numPatients))
        #appendMe = []
        patientPath = os.path.join(byPatient_dir,patient)
        patientTissuePath = os.path.join(patientPath,"tissuePatches")
        patches = [patch for patch in os.listdir(patientTissuePath) if patch.endswith('.png')]
        print(len(patches))
        if patient in TEST_PTS:
            for patch in patches:
                srcPath = os.path.join(patientTissuePath,patch)
                destPath = os.path.join(test_dir,patch)
                shutil.copy(srcPath,destPath)
        else:
            for patch in patches:
                srcPath = os.path.join(patientTissuePath,patch)
                destPath = os.path.join(train_dir,patch)
                shutil.copy(srcPath,destPath)

        

if __name__=='__main__':
    main()