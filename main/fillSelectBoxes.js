
// Richard's fetch function for cancer types
betterFetch = async function(url,body) {
    let fetchData = { 
        method: 'POST', 
        body: JSON.stringify(body),
        headers:{'Content-Type':'application/json'}
    };
    let tmpData=(await fetch(url, fetchData)).json();
    return(tmpData);
};

fillCancerTypeSelectBox = async function() {
    let url = 'https://api.gdc.cancer.gov/projects';
    let body = ({
        'fields': "disease_type,name,program.name,project_id,summary.case_count",
        'from': 0,
        'size': 1000
    });
    let cancerTypesQuery = await betterFetch(url, body)

    let cancerTypesArray = []
    for(i = 0; i < cancerTypesQuery.data.hits.length; i++) {
        cancerTypesArray[i] = cancerTypesQuery.data.hits[i]
    }
    cancerTypesArray.sort(function(a, b) {
        return b.summary.case_count - a.summary.case_count;
    });

    var selectBox = document.getElementById("cancerTypeMultipleSelection");
    
    for (i = 0; i < cancerTypesArray.length; i++) {
        var currentOption = document.createElement("option");
        currentOption.value = cancerTypesArray[i].name;
        currentOption.text = "(" + cancerTypesArray[i].id + ") " + cancerTypesArray[i].name ;
        currentOption.id = cancerTypesArray[i].id;
        selectBox.appendChild(currentOption);
    }

    return;
};

fillGeneSelectBox = async function() {
    let geneList = await fetch("geneList.json").then(response => response.json())
    var selectBox = document.getElementById("geneMultipleSelection");
    console.log(geneList[geneList.length - 1])
    for(i = 0; i < geneList.length; i++) {
        var currentOption = document.createElement("option");
        currentOption.value = geneList[i].hugoSymbol;
        currentOption.text = geneList[i].hugoSymbol;
        currentOption.id = geneList[i].hugoSymbol;
        selectBox.appendChild(currentOption);
    }
}



