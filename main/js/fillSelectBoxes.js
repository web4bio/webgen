/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Fill Cancer Type Select Box (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** Fills the cancer type selectBox.
 * 
 * This function populates the cancer type selection box HTML element
 * with the cancer types retrieved from the cohort data.
 * 
 * @returns {undefined}
 */
const fillCancerTypeSelectBox = async function () {
  const cancerTypesQuery = await firebrowse.fetchCohorts();
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
    $(".cancerTypeMultipleSelection").val(cancerTypeSelectedOptions);
    $(".cancerTypeMultipleSelection").trigger('change');
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
  fetchedCountData = fetchedCountData.Counts;
  fetchedCountData = fetchedCountData.map(x => {
    const container = {};
    container.cohort = x.cohort.substring(0, fetchedCountData[0].cohort.indexOf('-'));
    container.mrnaseq = x.mrnaseq;
    return container;
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
  // remove numSamplesText para element if it already exists:
  if (document.getElementById("numSamplesText")) {
    document.getElementById("numSamplesText").remove();
  }
  // retrieve selected tumor types:
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  if (myCohort.length != 0) {
    // get counts of samples for selected tumor types:
    var countQuery = await fetchNumberSamples();
    // order counts array based on order in which tumor types were selected:
    function orderThings (array, order, key) {
      array.sort(function (a, b) {
        var A = a[key], B = b[key];
        if (order.indexOf(A) > order.indexOf(B)) {
          return 1;
        } else {
          return -1;
        }
      });
      return array;
    };
    orderedCountQuery = orderThings(countQuery, myCohort, 'cohort')
    // build label:
    let string = "";
    let para;
    for (let i = 0; i < orderedCountQuery.length; i++) {
      if (string == "") {
        string += orderedCountQuery[i].cohort + ": " + orderedCountQuery[i].mrnaseq;
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
        string += ", " + orderedCountQuery[i].cohort +
                 ": " + orderedCountQuery[i].mrnaseq;
        para.setAttribute(
          "style",
          'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
        );
        para.setAttribute("id", "numSamplesText");
        para.innerText = "Number of samples: " + string;
        cancerQuerySelectBox.appendChild(para);
      }
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
/////////////////////////////////////////////////// Get Pathways List (below) ///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** Fetches list of valid pathways and returns an array of them.
 * 
 * NOTE: The URL in the fetch command needs to be updated to use the github.io link instead of the current method
 * 
 * @returns {Promise<Array.<String>>} The array of valid pathways
 */
let getValidPathwaysList = async function () {
  //Note the specification of the 'preselectedGenes' branch name.
  //genePathwaysList.json needs to be uploaded to the branch running on the github.io link
  let validPathwaysList = await fetch(
    "https://raw.githubusercontent.com/web4bio/webgen/development/main/genePathwaysList.json"
  ).then((response) => response.json());
  validPathwaysList = Object.keys(validPathwaysList);
  localStorage.setItem("genePathways", validPathwaysList);
  return await validPathwaysList;
};

/** Gets and returns the genes from pathways selected.
 * 
 * @typedef {Object} GenesByPathway
 * @property {Array<string>} genes
 * @property {number} id
 * @property {string} pathway
 * 
 * @returns {Promise<Array.<GenesByPathway>>} Array of JSONs, the genes associated with pathways.
 */
let getGenesByPathway = async function () {
  var pathwaySelectBoxLength = $(".pathwayMultipleSelection").select2("data").length;
  var allGenesByPathways = {};

  //would only run if an option from pathway select box is selected
  if (pathwaySelectBoxLength > 0) {
    let validPathwaysList = await fetch(
      "https://raw.githubusercontent.com/web4bio/webgen/development/main/genePathwaysList.json"
    ).then((response) => response.json());

    //Get the pathway(s) selected
    let myPathway = $(".pathwayMultipleSelection")
      .select2("data")
      .map((curPathway) => curPathway.id);

    //Map all the genes from pathway(s) into an array
    allGenesByPathways = _.map(
      _.range(0, myPathway.length),
      function (i) {
        return {
          id: i,
          pathway: String(myPathway[i]),
          genes: validPathwaysList[String(myPathway[i])],
        };
      }
    );

    // TODO  Somehow query the genes of the specific pathways the user has selected, maybe save them in localStorage for future use?
    // TODO  Combine the pathways genes with the specific genes the user selected in the first select box, remove duplicates.
    // TODO  Query Firebrowse using the list

  }
  return await allGenesByPathways;
};

/** Populates the pathway select box.
 * 
 * @returns {undefined}
 */
let fillPathwaySelectBox = async function () {
  validPathwaysList = await getValidPathwaysList();
  let selectBox = document.getElementById("pathwayMultipleSelection");

  $("#geneOneMultipleSelection").val(null).trigger("change");

  for (let i = 0; i < validPathwaysList.length; i++) {
    let currentOption = document.createElement("option");
    currentOption.value = validPathwaysList[i];
    currentOption.text = validPathwaysList[i];
    currentOption.id = validPathwaysList[i];
    selectBox.appendChild(currentOption);
  }
};

// Gets all genes according to selected pathway

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Fill Pathways Select Box (above) ///////////////////////////////////////////////////////////
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
  let results = [];
  let barcodesArr = [];
  let pageCount = 0;
  do {
    results = await firebrowse.fetchClinicalFH({cohorts: myCohort, /*genes: "bcl2",*/ 
      pageNum: pageCount.toString()});
    results.forEach((element) => barcodesArr.push(element.tcga_participant_barcode));
    //Increment page count for fetchClinicalFH function call (retrieves next page of data)
    pageCount++;
  } while(results.length >= 250)
  //Remove duplicate barcodes if necessary
  let barcodesSet = new Set(barcodesArr);
  const tpBarcodes = Array.from(barcodesSet);
  return tpBarcodes;
};

/** Fetches CLINICAL data for those barcodes for which expression data exists 
 * for those cancer types that were selected.
 * 
 * @typedef {Object} CohortClinicalData
 * @property {string} cohort
 * @property {string} date
 * @property {string} date_to_initial_pathologic_diagnosis
 * @property {string} days_to_death
 * @property {string} days_to_last_followup
 * @property {string} days_to_last_known_alive
 * @property {string} ethnicity
 * @property {string} gender
 * @property {string} histological_type
 * @property {string} number_of_lymph_nodes
 * @property {string} pathologic_stage
 * @property {string} pathology_M_stage
 * @property {string} pathology_N_stage
 * @property {string} pathology_T_stage
 * @property {string} race
 * @property {string} radiation_therapy
 * @property {string} tcga_participant_barcode
 * @property {string} tool
 * @property {string} tumor_tissue_site
 * @property {string} vital_status
 * @property {string} years_to_birth
 * 
 * @returns {Promise<Array.<CohortClinicalData>>} Returns a promise for an array of JSONS
 * which contain clinical data for the cohort.
 */
let fetchClinicalData = async function () {
  let myCohort = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  const barcodes = await getBarcodesFromCohortForClinical();
  let clinicalData = await firebrowse.fetchClinicalFH({barcodes: barcodes});
  clinicalData = clinicalData.filter(barcode => myCohort.includes(barcode.cohort));
  return clinicalData;
};

let allClinicalData;
let clinicalType = [];

/** Creates and fills the box to select clinical features.
 * Uses local storage if possible.
 * 
 * @returns {undefined}
 */
let fillClinicalSelectBox = async function () {

  document.getElementById('dataexploration').innerHTML = "" // clear previous pie charts

  let myCohort = $(".cancerTypeMultipleSelection").select2("data").map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);

  if (myCohort.length != 0) {

    let dataFetched = await fetchClinicalData();
    allClinicalData = dataFetched;

    // ------------------------------------------------------------------------------------------------------------------------

    // if more than one cancer type is selected, the intersection of available clinical features between the two cancer types
    // is populated as options in the dropdown for clinical features

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
    // create data structure to determine if clinical features are continuous or categorical
    clinicalType = [];
    for(let i = 0; i < intersectedFeatures.length; i++){
      let currentFeature = intersectedFeatures[i];
      let temp = {name: currentFeature, type: "", isSelected: false};

      let checkIfClinicalFeatureArrayIsNumeric = async function() {
        var numbers = /^[0-9/.]+$/;
        var continuousMap = allClinicalData.map(x => x[currentFeature].match(numbers));
        var nullCount = continuousMap.filter(x => x == null).length;
        var totalCount = continuousMap.length;
        var percentContinuous = nullCount / totalCount;
        if((percentContinuous < 0.75 && (currentFeature != 'vital_status')) || currentFeature === "days_to_death" || currentFeature === "cervix_suv_results")
          temp.type = "continuous";
        else
          temp.type = "categorical";
      }
      await checkIfClinicalFeatureArrayIsNumeric();
      clinicalType.push(temp);
    }

    // ------------------------------------------------------------------------------------------------------------------------

    let clinicalSelectedOptions = localStorage
      .getItem("clinicalSelectedOptions")
      .split(",");
    if (clinicalSelectedOptions) {
      $(".clinicalMultipleSelection").val(clinicalSelectedOptions);
    }

    let mySelectedClinicalFeatures = $(".geneOneMultipleSelection")
      .select2("data")
      .map((clinicalInfo) => clinicalInfo.text);
    let mySelectedClinicalFeatures2 = $(".clinicalMultipleSelection")
      .select2("data")
      .map((clinicalInfo) => clinicalInfo.text);

    if (
      mySelectedClinicalFeatures.length >= 1 ||
      mySelectedClinicalFeatures2 >= 1
    ) {
      buildDataExplorePlots(allClinicalData);
    }
  }
};

/** Creates and populates the Violin Partion Box HTML element.
 * 
 * @param {string} id - the ID of the div box to be filled
 * @returns {Array} choices - An array of the values checked by the user in the checkboxes.
 */
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
 * @typedef {Object} MutationMAF
 * @property {string} Hugo_Symbol
 * @property {string} Protein_Change
 * @property {string} SwissProt_entry_Id
 * @property {string} Tumor_Sample_Barcode
 * @property {string} Variant_Classification
 * @property {string} Variant_Type
 * @property {string} cohort
 * @property {string} tool
 * 
 * @param {Array.<String>} geneQuery The selected genes the function gets the mutations for
 * @returns {Promise<Array.<MutationMAF>>} An array of JSON objects specifying the mutations
 */
let getAllVariantClassifications = async function (geneQuery) {
  const myCohortQuery = $(".cancerTypeMultipleSelection").select2("data").map(
    (cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  return await firebrowse.fetchMutationMAF({cohorts: myCohortQuery, genes: geneQuery});
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