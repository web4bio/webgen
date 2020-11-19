/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Returns an array of JSON objects, where each object has a key:value pair for 
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")
let fetchCohortData = async function() {
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Metadata/Cohorts';
    const endpointurl_presets = {format: 'json'};
    const endpointurl_fieldsWithValues = 'format=' + endpointurl_presets.format;
    let fetchedCohortData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    if (fetchedCohortData == '')              
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedCohortData["Cohorts"];
    }
}

let fillCancerTypeSelectBox = async function() {
    let cancerTypesQuery = await fetchCohortData();
    cancerTypesQuery.sort();
    let selectBox = document.getElementById("cancerTypeMultipleSelection");
    for (let i = 0; i < cancerTypesQuery.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = cancerTypesQuery[i]["cohort"];
        currentOption.text = "(" + cancerTypesQuery[i]["cohort"] + ") " + cancerTypesQuery[i]["description"];
        currentOption.id = cancerTypesQuery[i]["cohort"];
        selectBox.appendChild(currentOption);
    }
    let cancerTypeSelectedOptions = localStorage.getItem("cancerTypeSelectedOptions").split(',');
    if(cancerTypeSelectedOptions){
        $('.cancerTypeMultipleSelection').val(cancerTypeSelectedOptions);
        fillClinicalTypeSelectBox();
    }
};

let fetchNumberSamples = async function() {
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    console.log(myCohort)
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Metadata/Counts'; //sample remainder of URL is: ?format=json&cohort=PRAD&fh_cde_name=psa_value&page=1&page_size=250&sort_by=cohort
    const endpointurl_presets = {
        cohort: myCohort,
        sample_type: 'TP',
        data_type: 'mrnaseq',
        totals: 'true'
    };
    const endpointurl_fieldsWithValues = 
        '&cohort=' + endpointurl_presets.cohort.toString() +
        '&sample_type=' + endpointurl_presets.sample_type + 
        '&data_type=' + endpointurl_presets.data_type + 
        '&totals=' + endpointurl_presets.totals;
    var fetchedCountData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    if (fetchedCountData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedCountData;
    }
}

let displayNumberSamples = async function() {
    if(document.getElementById('erikaPara')) {
        document.getElementById('erikaPara').remove();
    }
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    var dataFetched = await fetchNumberSamples();
    var countQuery = dataFetched.Counts;
    let string = "";
    let para;
    for(let i = 0; i < countQuery.length; i++) {
        if(string == "") {
            string += myCohort[i] + ": " + countQuery[i].mrnaseq;  
            para = document.createElement("P");
            para.setAttribute('style', 'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif');
            para.setAttribute('id', 'erikaPara');        
            para.innerText = "Number of samples: " + string;  
            cancerQuerySelectBox.appendChild(para);
        } else {
            document.getElementById('erikaPara').remove();
            string += ", " + myCohort[i] + ": " + countQuery[i].mrnaseq;
            para.setAttribute('style', 'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif');
            para.setAttribute('id', 'erikaPara');        
            para.innerText = "Number of samples: " + string;         
            cancerQuerySelectBox.appendChild(para);
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (above) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Gene ID Select Box (below) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let getValidGeneList = async function() {
    let validGeneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/validGeneList.json").then(response => response.json());
    validGeneList = validGeneList.map(geneInfo => geneInfo.hugoSymbol);
    return await validGeneList
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Gene ID Select Box (above) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (below) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let getBarcodesFromCohortForClinical = async function () {
    let myCohort = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    var dataFetched = await fetchExpressionData_cg(myCohort, 'bcl2');
    var results = dataFetched.mRNASeq;
    let tpBarcodes = [];
    results.forEach(element => tpBarcodes.push(element.tcga_participant_barcode));
    console.log(tpBarcodes)
    return tpBarcodes;
}

let fetchClinicalData = async function() {
    let barcodes = await getBarcodesFromCohortForClinical();
    let clinicalData = await firebrowse.getClinical_FH(barcodes);
    if (clinicalData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return clinicalData;
    }
}

let allClinicalData;
let fillClinicalTypeSelectBox = async function() {

    let dataFetched = await fetchClinicalData();
    allClinicalData = dataFetched.Clinical_FH;
    let selectBox = document.getElementById("clinicalMultipleSelection");
    let clinicalKeys = Object.keys(allClinicalData[0]);
    for (let i = 0; i < clinicalKeys.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = clinicalKeys[i];
        currentOption.text = clinicalKeys[i];
        currentOption.id = clinicalKeys[i];
        selectBox.appendChild(currentOption);
    }

    let geneList = await fetch("https://raw.githubusercontent.com/web4bio/webgen/master/main/geneList.json").then(response => response.json())
    for(let i = 0; i < geneList.length; i++) {
        let currentOption = document.createElement("option");
        currentOption.value = geneList[i].hugoSymbol;
        currentOption.text = geneList[i].hugoSymbol;
        currentOption.id = geneList[i].hugoSymbol;
        selectBox.appendChild(currentOption);
    }

    let clinicalFeatureOptions = localStorage.getItem("clinicalFeatureOptions").split(',');
    if(clinicalFeatureOptions){
        $('.clinicalMultipleSelection').val(clinicalFeatureOptions)
    }

    
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (above) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Mutation Select Box (below) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let getAllVariantClassifications = async function(geneQuery) {
    let myCohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Analyses/Mutation/MAF';
    const endpointurl_presets = {
        format: 'json',
        cohort: myCohortQuery,  
        tool: 'MutSig2CV', 
        gene: geneQuery,  
        page: '1',
        page_size: 250,
        sort_by: 'cohort' 
    };
    const endpointurl_fieldsWithValues = 
        'format=' + endpointurl_presets.format + 
        '&cohort=' + endpointurl_presets.cohort.toString() + 
        '&tool=' + endpointurl_presets.tool + 
        '&gene=' + endpointurl_presets.gene +
        '&page=' + endpointurl_presets.page + 
        '&page_size=' + endpointurl_presets.page_size.toString() + 
        '&sort_by=' + endpointurl_presets.sort_by;
    let fetchedMutationData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues).then(function(response) { return response.json(); });
    let theMutationQuery = fetchedMutationData.MAF;
    if (theMutationQuery == '')              
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return theMutationQuery;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Mutation Select Box (above) ///////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let saveInLocalStorage = async function() {

    let cancerTypeSelectedOptions = $('.cancerTypeMultipleSelection').select2('data').map(cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
    localStorage.setItem("cancerTypeSelectedOptions", cancerTypeSelectedOptions);

    let clinicalFeatureOptions = $('.clinicalMultipleSelection').select2('data').map(clinicalFeature => clinicalFeature.text);
    localStorage.setItem("clinicalFeatureOptions", clinicalFeatureOptions);

}