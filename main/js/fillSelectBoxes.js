/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Returns an array of JSON objects, where each object has a key:value pair for
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")
let fetchCohortData = async function () {
  const hosturl = "https://firebrowse.herokuapp.com";
  const endpointurl = "http://firebrowse.org/api/v1/Metadata/Cohorts";
  const endpointurl_presets = { format: "json" };
  const endpointurl_fieldsWithValues = "format=" + endpointurl_presets.format;
  let fetchedCohortData = await fetch(
    hosturl + "?" + endpointurl + "?" + endpointurl_fieldsWithValues
  ).then(function (response) {
    return response.json();
  });
  if (fetchedCohortData == "")
    return ["Error: Invalid Input Fields for Query.", 0];
  else {
    return fetchedCohortData["Cohorts"];
  }
};

let fillCancerTypeSelectBox = async function () {
  let cancerTypesQuery = await fetchCohortData();
  cancerTypesQuery.sort();
  let selectBox = document.getElementById("cancerTypeMultipleSelection");
  for (let i = 0; i < cancerTypesQuery.length; i++) {
    let currentOption = document.createElement("option");
    currentOption.value = cancerTypesQuery[i]["cohort"];
    currentOption.text =
      "(" +
      cancerTypesQuery[i]["cohort"] +
      ") " +
      cancerTypesQuery[i]["description"];
    currentOption.id = cancerTypesQuery[i]["cohort"];
    selectBox.appendChild(currentOption);
  }
  let cancerTypeSelectedOptions = localStorage
    .getItem("cancerTypeSelectedOptions") || null
  if (cancerTypeSelectedOptions) {
    cancerTypeSelectedOptions = cancerTypeSelectedOptions.split(",");
  }

  if (cancerTypeSelectedOptions) {
    $(".cancerTypeMultipleSelection").val(cancerTypeSelectedOptions);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (above) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Display Number of Samples (below) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let fetchNumberSamples = async function () {
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  const hosturl = "https://firebrowse.herokuapp.com";
  //
  const endpointurl = "http://firebrowse.org/api/v1/Metadata/Counts";
  const endpointurl_presets = {
    cohort: myCohort,
    sample_type: "TP",
    data_type: "mrnaseq",
    totals: "true",
  };
  const endpointurl_fieldsWithValues =
    "&cohort=" +
    endpointurl_presets.cohort.toString() +
    "&sample_type=" +
    endpointurl_presets.sample_type +
    "&data_type=" +
    endpointurl_presets.data_type +
    "&totals=" +
    endpointurl_presets.totals;
  var fetchedCountData = await fetch(
    hosturl + "?" + endpointurl + "?" + endpointurl_fieldsWithValues
  ).then(function (response) {
    return response.json();
  });
  if (fetchedCountData == "")
    return ["Error: Invalid Input Fields for Query.", 0];
  else {
    return fetchedCountData;
  }
};

let displayNumberSamples = async function () {
  if (document.getElementById("numSamplesText")) {
    document.getElementById("numSamplesText").remove();
  }
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  var dataFetched = await fetchNumberSamples();
  var countQuery = dataFetched.Counts;
  let string = "";
  let para;
  for (let i = 0; i < countQuery.length; i++) {
    if (string == "") {
      string += myCohort[i] + ": " + countQuery[i].mrnaseq;
      para = document.createElement("P");
      para.setAttribute(
        "style",
        'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
      );
      para.setAttribute("id", "numSamplesText");
      para.innerText = "Number of samples: " + string;
      cancerQuerySelectBox.appendChild(para);
    } else {
      document.getElementById("numSamplesText").remove();
      string += ", " + myCohort[i] + ": " + countQuery[i].mrnaseq;
      para.setAttribute(
        "style",
        'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
      );
      para.setAttribute("id", "numSamplesText");
      para.innerText = "Number of samples: " + string;
      cancerQuerySelectBox.appendChild(para);
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Display Number of Samples (above) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////// Get Gene List (below) /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let getValidGeneList = async function () {
  let validGeneList = await fetch(
    "https://raw.githubusercontent.com/web4bio/webgen/master/main/validGeneList.json"
  ).then((response) => response.json());
  validGeneList = validGeneList.map((geneInfo) => geneInfo.hugoSymbol);
  return await validGeneList;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////// Get Gene List (above) /////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (below) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// get barcodes for which expression data exists for those cancer types that were selected
let getBarcodesFromCohortForClinical = async function () {
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  var dataFetched = await fetchExpressionData_cg(myCohort, "bcl2");
  var results = dataFetched.mRNASeq;
  let tpBarcodes = [];
  results.forEach((element) =>
    tpBarcodes.push(element.tcga_participant_barcode)
  );
  return tpBarcodes;
};

// fetch CLINICAL data for those barcodes for which expression data exists for those cancer types that were selected
let fetchClinicalData = async function () {
  let barcodes = await getBarcodesFromCohortForClinical();
  let clinicalData = await firebrowse.getClinical_FH_b(barcodes);
  if (clinicalData == "") return ["Error: Invalid Input Fields for Query.", 0];
  else {
    return clinicalData;
  }
};

let allClinicalData;

let fillClinicalSelectBox = async function () {

  document.getElementById('dataexploration').innerHTML = "" // clear previous pie charts

  let dataFetched = await fetchClinicalData();
  allClinicalData = dataFetched.Clinical_FH;

  // ------------------------------------------------------------------------------------------------------------------------

  // if more than one cancer type is selected, the intersection of available clinical features between the two cancer types
  // is populated as options in the dropdown for clinical features

  let myCohort = $(".cancerTypeMultipleSelection").select2("data").map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let clinicalKeys = [];
  for(i = 0; i < myCohort.length; i++)
    for(j = 0; j < allClinicalData.length; j++)
      if(allClinicalData[j].cohort == myCohort[i]) {
        clinicalKeys.push(Object.keys(allClinicalData[j]));
        break;
      }
  
  let intersectedFeatures;
  if(clinicalKeys.length > 1)
    for(let i = 0; i < clinicalKeys.length - 1; i++) {
      let currentFeatures = clinicalKeys[i];
      let nextFeatures = clinicalKeys[i + 1];
      intersectedFeatures = currentFeatures.filter(x => nextFeatures.includes(x));
    } 
  else
    intersectedFeatures = clinicalKeys[0];

  $('#clinicalMultipleSelection').val(null).trigger('change'); // clear any preexisting selections
  $('#clinicalMultipleSelection').empty(); // clear any preexisting options in dropdown
  let selectBox = document.getElementById("clinicalMultipleSelection");
  for (let i = 1; i < intersectedFeatures.length; i++) {
    let currentOption = document.createElement("option");
    currentOption.value = intersectedFeatures[i];
    currentOption.text = intersectedFeatures[i];
    currentOption.id = intersectedFeatures[i];
    selectBox.appendChild(currentOption);
  }

  // ------------------------------------------------------------------------------------------------------------------------

  let clinicalSelectedOptions = localStorage
    .getItem("clinicalSelectedOptions")
    .split(",");
  if (clinicalSelectedOptions) {
    $(".clinicalMultipleSelection").val(clinicalSelectedOptions);
  }

  let mySelectedClinicalFeatures = $('.geneOneMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
  let mySelectedClinicalFeatures2 = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);

  if(mySelectedClinicalFeatures.length >= 1 || mySelectedClinicalFeatures2 >= 1) {
    buildDataExplorePlots(allClinicalData);
  }

};

let fillViolinPartitionBox = async function(id)
{
    var div_box = d3.select('#'+id);
    div_box.html("");
    div_box.append('text')
        .style("font-size", "20px")
        .text('Select variables to partition violin curves by:');
    console.log(div_box);
    div_box.append('div')
        .attr('class','viewport')
        .style('overflow-y', 'scroll')
        .style('height', '90px')
        .style('width', '500px')
        .append('div')
        .attr('class','body');
        
    var selectedText = div_box.append('text');
    let div_body = div_box.select('.body');
    
    var choices;
    function update() 
    {
        choices = [];
        d3.selectAll(".myCheckbox").each(function(d)
        {
            let cb = d3.select(this);
            if(cb.property('checked')){ choices.push(cb.property('value')); };
        });
    
        if(choices.length > 0){ selectedText.text('Selected: ' + choices.join(', ')); }
        else { selectedText.text('None selected'); };
    }
  
  // function to create a pair of checkbox and text
    function renderCB(div_obj, data) 
    {
        /*
        const label = div_obj.append('div').attr('id', data.id);
        label.append('input')
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('value', data.id)
            .on('change',update)
            //.property('checked',true)
        label.append('text')
            .text(data.id);
            */

        const label = div_obj.append('div').attr('id', data);

        label.append("label")
           .attr("class", "switch")
           .append("input")
           .attr("class", "myCheckbox")
           .attr("value", data)
           .attr("type", "checkbox")
           .on('change',update)
           .attr("style", 'opacity: 1; position: relative; pointer-events: all')
           .append("span")
           .attr("class", "slider round")
           .attr('value', data);

        label.append('text')
           .text(data);
    }
    
    // data to input = clinical vars from query
    //let var_opts = clin_vars.split(/[\s,]+/).map(el => ({id: el}));
    let clinicalVars = JSON.parse(localStorage.getItem("clinicalFeatureKeys"));
    var_opts = clinicalVars;

    // make a checkbox for each option
    var_opts.forEach(el => renderCB(div_body,el))
    update();

    var choices = [];
    d3.select('#'+id).selectAll(".myCheckbox").each(function(d)
    {
        let cb = d3.select(this);
        if(cb.property('checked')){ choices.push(cb.property('value')); };
    });
    return choices;
    
    /*
    console.log("fillViolinPartitionBox() Called!");
    console.log(id + ", " + className);
    let selectBox = document.getElementById(id);
    let clinicalKeys = Object.keys(clinicalQuery[0]);
    for(let index = 0; index < clinicalKeys.length; index++)
    {
        let currentOption = document.createElement("option");
        currentOption.value = clinicalKeys[index];
        currentOption.text = clinicalKeys[index];
        currentOption.id = clinicalKeys[index];
        selectBox.appendChild(currentOption);
    }
    */

    //let clinicalFeatureOptions = localStorage.getItem("clinicalFeatureOptions").split(',');
    //if(clinicalFeatureOptions){
    //    $('.' + className).val(clinicalFeatureOptions)
    //}
};

/*
let fillClinicalPartitionBox = async function(className)
{
    $('.'+className).select2('data').map(clinicalFeature => clinicalFeature.text);
};
*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Fill Clinical Select Box (above) //////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// Get Mutation Data (below) //////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let getAllVariantClassifications = async function (geneQuery) {
  let myCohortQuery = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  const hosturl = "https://firebrowse.herokuapp.com";
  const endpointurl = "http://firebrowse.org/api/v1/Analyses/Mutation/MAF";
  const endpointurl_presets = {
    format: "json",
    cohort: myCohortQuery,
    tool: "MutSig2CV",
    gene: geneQuery,
    page: "1",
    page_size: 250,
    sort_by: "cohort",
  };
  const endpointurl_fieldsWithValues =
    "format=" +
    endpointurl_presets.format +
    "&cohort=" +
    endpointurl_presets.cohort.toString() +
    "&tool=" +
    endpointurl_presets.tool +
    "&gene=" +
    endpointurl_presets.gene +
    "&page=" +
    endpointurl_presets.page +
    "&page_size=" +
    endpointurl_presets.page_size.toString() +
    "&sort_by=" +
    endpointurl_presets.sort_by;
  let fetchedMutationData = await fetch(
    hosturl + "?" + endpointurl + "?" + endpointurl_fieldsWithValues
  ).then(function (response) {
    return response.json();
  });
  let theMutationQuery = fetchedMutationData.MAF;
  if (theMutationQuery == "")
    return ["Error: Invalid Input Fields for Query.", 0];
  else {
    return theMutationQuery;
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// Get Mutation Data (above) //////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let saveInLocalStorage = async function () {
  let cancerTypeSelectedOptions = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  localStorage.setItem("cancerTypeSelectedOptions", cancerTypeSelectedOptions);

  let geneOneSelectedOptions = $(".geneOneMultipleSelection")
    .select2("data")
    .map((gene) => gene.text);
  localStorage.setItem("geneOneSelectedOptions", geneOneSelectedOptions);

  let clinicalSelectedOptions = $(".clinicalMultipleSelection")
    .select2("data")
    .map((clinicalFeature) => clinicalFeature.text);
  localStorage.setItem("clinicalSelectedOptions", clinicalSelectedOptions);

  let geneTwoSelectedOptions = $(".geneTwoMultipleSelection")
    .select2("data")
    .map((gene) => gene.text);
  localStorage.setItem("geneTwoSelectedOptions", geneTwoSelectedOptions);
};
