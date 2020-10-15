
loadButtom = document.getElementById('predictModel').addEventListener('click',fetchModel);

function fetchModel(){
    const model = tf.loadLayersModel('http://sbu-bmi.eastus2.cloudapp.azure.com/azureuser/tfjs/js_model/model.json');
    console.log(model)
}