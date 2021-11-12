/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** Fetches and returns the cohort data as an array.
 * 
 * @returns {Promise<Array.<JSON>>} An array of JSON objects, where each object has a 
 * key:value pair for "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")
 */
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

/** Fills the cancer type selectBox.
 * 
 * This function populates the cancer type selection box HTML element
 * with the cancer types retrieved from the cohort data.
 * 
 * @returns {undefined}
 */
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
    .getItem("cancerTypeSelectedOptions")
    .split(",");
  if (cancerTypeSelectedOptions) {
    $(".cancerTypeMultipleSelection").val(cancerTypeSelectedOptions);
    if (cancerTypeSelectedOptions != "") {
      fillFirstGeneSelectBox();
      fillClinicalSelectBox();
      fillSecondGeneSelectBox();
    }
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

/** Fetches the number of samples for the cohorts selected
 * 
 * @returns {Promise<JSON.<Array>>} a JSON object containing a single array
 * which contains JSON objects with key:value pair for "cohort" and "mrnaseq", the number of samples.
 */
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

/** Creates and displays the "Number of samples" element that appears when a cohort is selected.
 * 
 * @returns {undefined}
 */
let displayNumberSamples = async function () {
  if (document.getElementById("erikaPara")) {
    document.getElementById("erikaPara").remove();
  }
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let dataFetched = await fetchNumberSamples();
  let countQuery = dataFetched.Counts;
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
      para.setAttribute("id", "erikaPara");
      para.innerText = "Number of samples: " + string;
      cancerQuerySelectBox.appendChild(para);
    } else {
      document.getElementById("erikaPara").remove();
      string += ", " + myCohort[i] + ": " + countQuery[i].mrnaseq;
      para.setAttribute(
        "style",
        'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
      );
      para.setAttribute("id", "erikaPara");
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

/** Fetches an array of the valid genes and returns them
 * 
 * @returns {Promise<Array>} validGeneList - the array of genes
 */
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

/** Gets barcodes for which expression data exists for the cancer types that were selected.
 * 
 * @returns {Promise<Array.<string>>} An array of strings, the barcodes from the selected cohorts.
 */
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

/** Fetches CLINICAL data for those barcodes for which expression data exists 
 * for those cancer types that were selected.
 * 
 * @returns {Promise<JSON.<Array>>} Returns a promise for a JSON containing an array of JSONS
 * which contain clinical data for the cohort.
 */
let fetchClinicalData = async function () {
  let barcodes = await getBarcodesFromCohortForClinical();
  let clinicalData = await firebrowse.getClinical_FH_b(barcodes);
  if (clinicalData == "") return ["Error: Invalid Input Fields for Query.", 0];
  else {
    return clinicalData;
  }
};

/** Fetches genes from list and 
 * creates and populates the gene selection box.
 * Uses local storage if possible.
 * 
 * @returns {undefined}
 */
let fillFirstGeneSelectBox = async function () {
  console.log('1')
  let selectBox = document.getElementById("geneOneMultipleSelection");

  $("#geneOneMultipleSelection").val(null).trigger("change");

  // only populate dropdown options if they have not already been populated
  if (
    !$("#geneOneMultipleSelection").find("option[value='" + "TP53" + "']")
      .length
  ) {
    let geneList = await fetch(
      "https://raw.githubusercontent.com/web4bio/webgen/master/main/geneList.json"
    ).then((response) => response.json());
    console.log(geneList);
    for (let i = 0; i < geneList.length; i++) {
      let currentOption = document.createElement("option");
      currentOption.value = geneList[i].hugoSymbol;
      currentOption.text = geneList[i].hugoSymbol;
      currentOption.id = geneList[i].hugoSymbol;
      selectBox.appendChild(currentOption);
    }
  }

  let geneOneSelectedOptions = localStorage
    .getItem("geneOneSelectedOptions")
    .split(",");
  if (geneOneSelectedOptions) {
    $(".geneOneMultipleSelection").val(geneOneSelectedOptions);
  }
};

/** Fetches genes from list and 
 * creates and populates the second gene selection box.
 * Uses local storage if possible.
 * 
 * @returns {undefined}
 */
let fillSecondGeneSelectBox = async function () {
  let selectBox2 = document.getElementById("geneTwoMultipleSelection");

  $("#geneTwoMultipleSelection").val(null).trigger("change");

  // only populate dropdown options if they have not already been populated
  if (
    !$("#geneTwoMultipleSelection").find("option[value='" + "TP53" + "']")
      .length
  ) {
    let geneList2 = await fetch(
      "https://raw.githubusercontent.com/web4bio/webgen/master/main/geneList.json"
    ).then((response) => response.json());
    console.log(geneList2);
    for (let i = 0; i < geneList2.length; i++) {
      let currentOption2 = document.createElement("option");
      currentOption2.value = geneList2[i].hugoSymbol;
      currentOption2.text = geneList2[i].hugoSymbol;
      currentOption2.id = geneList2[i].hugoSymbol + "_";
      selectBox2.appendChild(currentOption2);
    }
  }

  $("#clinicalMultipleSelection").val(null).trigger("change");

  let geneTwoSelectedOptions = localStorage
    .getItem("geneTwoSelectedOptions")
    .split(",");
  if (geneTwoSelectedOptions) {
    $(".geneTwoMultipleSelection").val(geneTwoSelectedOptions);
  }
};

let allClinicalData;
/** Creates and fills the box to select clinical features.
 * Uses local storage if possible.
 * 
 * @returns {undefined}
 */
let fillClinicalSelectBox = async function () {
  let dataFetched = await fetchClinicalData();
  allClinicalData = dataFetched.Clinical_FH;

  let selectBox = document.getElementById("clinicalMultipleSelection");

  // only populate dropdown options if they have not already been populated
  if (
    !$("#clinicalMultipleSelection").find("option[value='" + "cohort" + "']")
      .length
  ) {
    let clinicalKeys = Object.keys(allClinicalData[0]);
    for (let i = 0; i < clinicalKeys.length; i++) {
      let currentOption = document.createElement("option");
      currentOption.value = clinicalKeys[i];
      currentOption.text = clinicalKeys[i];
      currentOption.id = clinicalKeys[i];
      selectBox.appendChild(currentOption);
    }
  }

  let clinicalSelectedOptions = localStorage
    .getItem("clinicalSelectedOptions")
    .split(",");
  if (clinicalSelectedOptions) {
    $(".clinicalMultipleSelection").val(clinicalSelectedOptions);
  }
};

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

/** Gets all variant classifications based on the cohort and provided genes
 * 
 * @param {Array.<String>} geneQuery The selected genes the function gets the mutations for
 * @returns {Promise<Array.<JSON>>} An array of JSON objects specifying the mutations
 */
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

/** Saves the cohort, genes, and clinical features in local storage
 * 
 * @returns {undefined}
 */
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
