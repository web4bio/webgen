import torch

from webgen_PAAD_AE_sf400_db0_onPatches_noDense_WORKING import ConvAutoencoder

def main():
    pytorch_model = ConvAutoencoder()
    pytorch_model.load_state_dict(torch.load('CAE_20201005-142500_bestLoss_0.4840_epoch_49_fromStateDict.pt'))
    pytorch_model.eval()
    dummy_input = torch.zeros(1,3,400,400)
    torch.onnx.export(pytorch_model,dummy_input,'onnx_CAEmodel.onnx',verbose=True)

if __name__=='__main__':
    main()