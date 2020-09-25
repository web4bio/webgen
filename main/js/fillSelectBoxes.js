
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
    let cancerTypesQuery = await fetchCohortData()
    cancerTypesQuery.sort()
    var selectBox = document.getElementById("cancerTypeMultipleSelection");
    
    for (i = 0; i < cancerTypesQuery.length; i++) {
        var currentOption = document.createElement("option");
        currentOption.value = cancerTypesQuery[i]["cohort"];
        currentOption.text = "(" + cancerTypesQuery[i]["cohort"] + ") " + cancerTypesQuery[i]["description"] ;
        currentOption.id = cancerTypesQuery[i]["cohort"];
        selectBox.appendChild(currentOption);
    }
    return;
};

fillGeneSelectBox = async function() {
    let geneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/geneList.json").then(response => response.json())
    var selectBox = document.getElementById("geneMultipleSelection");
    
    for(i = 0; i < geneList.length; i++) {
        var currentOption = document.createElement("option");
        currentOption.value = geneList[i].hugoSymbol;
        currentOption.text = geneList[i].hugoSymbol;
        currentOption.id = geneList[i].hugoSymbol;
        selectBox.appendChild(currentOption);
    }
}

// Returns an array of JSON objects, where each object has a key:value pair for 
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")

fetchCohortData = async function() {
  
    // Set up host and endpoint urls
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Metadata/Cohorts';
    
    // Set up endpoint url fields (except cohort and gene) with preset values
    const endpointurl_presets = {format: 'json'};
  
    // Assemble a string by concatenating all fields and field values for endpoint url
    const endpointurl_fieldsWithValues = 'format=' + endpointurl_presets.format;
  
    // Fetch data from stitched api:
    var fetchedCohortData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    // Check if the fetch worked properly:
    if (fetchedCohortData == '')              
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedCohortData["Cohorts"];
    }
  
  }

getValidGeneList = async function() {
    var validGeneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/validGeneList.json").then(response => response.json());
    validGeneList = validGeneList.map(geneInfo => geneInfo.hugoSymbol);

    return await validGeneList
}  
// END OF PROGRAM