// set click buttom id
// correspond to 'Load Data' buttom and activate function fetchData()
loadButtom = document.getElementById('dataLoad').addEventListener('click',fetchData);

function fetchData(){
    fetch('https://api.gdc.cancer.gov/files?project_id=TCGA-PAAD?data_format?id')
    .then(response => response.json())
    .then(json => console.log(json))
}