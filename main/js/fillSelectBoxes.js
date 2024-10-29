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
  const cancerTypesQueryNoFPPP = cancerTypesQuery.reduce((acc, item) => item.cohort !== 'FPPP' ? [...acc, item] : acc, []);
  cancerTypesQueryNoFPPP.sort();
  let selectBox = document.getElementById("cancerTypeMultipleSelection");
  for (let i = 0; i < cancerTypesQueryNoFPPP.length; i++) {
    let currentOption = document.createElement("option");
    currentOption.value = cancerTypesQueryNoFPPP[i]["cohort"];
    currentOption.text =
      "(" +
      cancerTypesQueryNoFPPP[i]["cohort"] +
      ") " +
      cancerTypesQueryNoFPPP[i]["description"];
    currentOption.id = cancerTypesQueryNoFPPP[i]["cohort"];
    selectBox.appendChild(currentOption);
  }
  let cancerTypeSelectedOptions = localStorage
    .getItem("cancerTypeSelectedOptions") || null
  if (cancerTypeSelectedOptions) {
    cancerTypeSelectedOptions = cancerTypeSelectedOptions.split(",");
    $(".cancerTypeMultipleSelection").val(cancerTypeSelectedOptions);
    $(".cancerTypeMultipleSelection").trigger('change');
  }

  return true;

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

let numbersOfSamples;

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
    numbersOfSamples = await firebrowse.fetchCounts(myCohort);
    let formatted_numbersOfSamples = numbersOfSamples.map(x => {
      const container = {};
      container.cohort = x.cohort.substring(0, numbersOfSamples[0].cohort.indexOf('-'));
      container.mrnaseq = x.mrnaseq;
      return container;
    });
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
    orderedCountQuery = orderThings(formatted_numbersOfSamples, myCohort, 'cohort')
    // build label:
    let numSamplesLabel = "";
    let para;
    for (let i = 0; i < orderedCountQuery.length; i++) {
      if (numSamplesLabel == "") {
        numSamplesLabel += orderedCountQuery[i].cohort + ": " + orderedCountQuery[i].mrnaseq;
        para = document.createElement("P");
        para.setAttribute(
          "style",
          'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
        );
        para.setAttribute("id", "numSamplesText");
        para.innerText = "Number of samples: " + numSamplesLabel;
        cancerQuerySelectBox.appendChild(para);
      } else {
        document.getElementById("numSamplesText").remove();
        numSamplesLabel += ", " + orderedCountQuery[i].cohort +
                 ": " + orderedCountQuery[i].mrnaseq;
        para.setAttribute(
          "style",
          'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
        );
        para.setAttribute("id", "numSamplesText");
        para.innerText = "Number of samples: " + numSamplesLabel;
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
    "https://web4bio.github.io/webgen/main/validGeneList.json"
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
    "https://web4bio.github.io/webgen/main/genePathwaysList.json"
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

  let numberOfPathwaysSelected = $(".pathwayMultipleSelection").select2("data").length;

  let allGenesByPathways = {};

  if (numberOfPathwaysSelected > 0) {

    let validPathwaysList = await fetch("https://web4bio.github.io/webgen/main/genePathwaysList.json").then((response) => response.json());

    let selectedPathways = $(".pathwayMultipleSelection").select2("data").map((curPathway) => curPathway.id);

    // Map all the genes from pathway(s) into an array
    allGenesByPathways = _.map(
      _.range(0, selectedPathways.length),
      function (i) {
        return {
          id: i,
          pathway: String(selectedPathways[i]),
          genes: validPathwaysList[String(selectedPathways[i])],
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

/** Gets clinial data for which expression data exist for the cancer type(s) that was/were selected.
 * 
 * @returns {Promise<Array.<object>>} An array of objects.
 */
let getClinicalByCohortWithMrnaseq = async function () {
  let results = [];
  //Instantiate barcode caching interface
  let cacheBar = await getCacheBAR();
  //Obtain barcodes for cohorts of interest
  let barcodesByCohort = await cacheBar.fetchWrapperBAR(selectedTumorTypes);
  /*Since fetchWrapperBAR() returns an array of JSONs (one JSON containing an array for each cohort's barcodes),
  we need to merge each array of barcodes into a single array*/
  let allBarcodes = [];
  for(let index = 0; index < barcodesByCohort.length; index++)
    allBarcodes = allBarcodes.concat(barcodesByCohort[index].barcodes);

  let cacheClin = await getCacheCLIN();
  let clinicalByCohort = await cacheClin.fetchWrapperCLIN(selectedTumorTypes, barcodesByCohort);

  for (let k of clinicalByCohort) {
    let clinicalData = k.clinical_data
    for(let index = 0; index < clinicalData.length; index++) {
      results.push(clinicalData[index])
    }
  }
  return results;
};

let allClinicalData;
let clinicalType = [];

let selectedTumorTypes;

/** Creates and fills the box to select clinical features.
 * Uses local storage if possible.
 * 
 * @returns {undefined}
 */
let fillClinicalSelectBox = async function () {
  document.getElementById('dataexploration').innerHTML = "" // clear previous pie charts
  selectedTumorTypes = $(".cancerTypeMultipleSelection").select2("data").map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  if (selectedTumorTypes.length != 0) {
    allClinicalData = await getClinicalByCohortWithMrnaseq();

    // ------------------------------------------------------------------------------------------------------------------------

    // if more than one cancer type is selected, the intersection of available clinical features between the two cancer types
    // is populated as options in the dropdown for clinical features
    let clinicalKeys = [];
    for(i = 0; i < selectedTumorTypes.length; i++) {
      for(j = 0; j < allClinicalData.length; j++) {
        if(allClinicalData[j].cohort == selectedTumorTypes[i]) {
          clinicalKeys.push(Object.keys(allClinicalData[j]));
          break;
        }
      }
    }

    const unwantedKeys = new Set(['date', 'tcga_participant_barcode', 'tool']);
    clinicalKeys[0] = clinicalKeys[0].filter(item => !unwantedKeys.has(item));

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

    for (let i = 0; i < intersectedFeatures.length; i++) {
      let currentOption = document.createElement("option");
      currentOption.value = intersectedFeatures[i];
      currentOption.text = (intersectedFeatures[i]).replaceAll('_', ' ');
      currentOption.id = intersectedFeatures[i];
      if(intersectedFeatures[i] != 'cohort')
        selectBox.appendChild(currentOption);
    }

    // ------------------------------------------------------------------------------------------------------------------------
    // create data structure to determine if clinical features are continuous or categorical
    clinicalType = [];
    for(let i = 0; i < intersectedFeatures.length; i++){
      let currentFeature = intersectedFeatures[i];
      let temp = {name: currentFeature, type: "", isSelected: false};

      let checkIfClinicalFeatureArrayIsNumeric = async function() {
        const CONTINUOUS_FEATURES = [
          "age_began_smoking_in_years",
          "age_at_diagnosis",
          "cervix_suv_results",
          "date_of_initial_pathologic_diagnosis",
          "days_to_death",
          "days_to_last_followup", 
          "days_to_last_known_alive",
          "days_to_psa",
          "days_to_submitted_specimen_dx",
          "gleason_score",
          "height_cm_at_diagnosis",
          "initial_pathologic_dx_year",
          "karnofsky_performance_score",
          "lymph_nodes_examined",
          "lymph_nodes_examined_he_count",
          "number_of_lymph_nodes",
          "number_pack_years_smoked",
          "pregnancies_count_ectopic",
          "pregnancies_count_live_birth",
          "pregnancies_count_stillbirth",
          "pregnancies_count_total",
          "pregnancy_spontaneous_abortion_count",
          "pregnancy_therapeutic_abortion_count",
          "psa_value",
          "tobacco_smoking_history",
          "tobacco_smoking_pack_years_smoked",
          "tobacco_smoking_year_stopped",
          "weight_kg_at_diagnosis",
          "years_to_birth",
          "year_of_tobacco_smoking_onset"
        ]; // Array of features that should be considered continuous
        if(CONTINUOUS_FEATURES.includes(currentFeature))
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

    let selectedGene1 = $(".geneOneMultipleSelection").select2("data").map((clinicalInfo) => clinicalInfo.text);
    let selectedClinicalFeatures = $(".clinicalMultipleSelection").select2("data").map((clinicalInfo) => clinicalInfo.text);

    if (selectedGene1.length >= 1 || selectedClinicalFeatures >= 1) {
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