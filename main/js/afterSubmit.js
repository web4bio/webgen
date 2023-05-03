/** Add a div element inside another div.
 *
 * @param {string} newDivID - ID for new div element.
 * @param {string} parentDivID - ID of the parent div element.
 * @returns {?HTMLDivElement} New inner div element or null if parent does not exist.
 */
const addDivInside = function (newDivID, parentDivID) {
  const newDiv = document.createElement("div");
  newDiv.setAttribute("id", newDivID);
  newDiv.setAttribute("style", "margin-top:25px");
  const parent = document.getElementById(parentDivID);
  if (parent == null) {
    console.error(`parent div ${parentDivID} does not exist`);
    return null;
  }
  parent.appendChild(newDiv);
  return newDiv;
};


/** Build and display plots.
 *
 * This function fetches the necessary data, builds the data download buttons, builds
 * the heatmaps, and builds the violin plots.
 *
 * @returns {Promise<null>} This function does not return anything.
 */
const buildPlots = async function() {

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  const allSelectedGenes = await getAllSelectedGenes();

  const isEmpty = (x) => {
    return x === undefined || x === null || x.length === 0;
  };

  if (isEmpty(selectedTumorTypes) || isEmpty(allSelectedGenes) ) {
    console.log("user did not provide enough information for query");
    window.alert("Please select at least one tumor type and gene.");
    return null;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // PAGE SETUP:

  // Reset page formatting:
  document.getElementById("heatmapLoaderDiv").innerHTML = "";
  document.getElementById("violinLoaderDiv").innerHTML = "";

  // Display loader:
  document.getElementById("heatmapLoaderDiv").className = "loader";
  document.getElementById("violinLoaderDiv").className = "loader";

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // GET EXPRESSION DATA:

  const selectedGene1 = $(".geneOneMultipleSelection").select2("data").map((gene) => gene.text);

  // Fetch expression data for selected cancer cohort(s) and gene(s) selected from first dropdown
  //Hardcode 'genes' param to query one gene's worth of information
  let expressionData_forMutationFetching = await firebrowse.fetchmRNASeq({cohorts: selectedTumorTypes, genes: selectedGene1});

  // Find intersecting barcodes based on Mutation/Clinical Pie Chart selections
  const intersectedBarcodes = await getBarcodesFromSelectedPieSectors(expressionData_forMutationFetching);

  // Extract expression data only at intersectedBarcodes
  const expressionData = await getExpressionDataFromIntersectedBarcodes(intersectedBarcodes, selectedTumorTypes, allSelectedGenes);
  cache.set('rnaSeq', 'expressionData', expressionData)

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // GET CLINICAL DATA:
  // Get clinical data for either intersected barcodes or entire cohort
  let clinicalData;
  if (intersectedBarcodes && intersectedBarcodes.length) {
    clinicalData = await firebrowse.fetchClinicalFH({barcodes: intersectedBarcodes});
  } else {
    //Pass in barcodes from expressionData
    let barcodesFromExpressionData = new Set();
    for(let index = 0; index < expressionData.length; index++)
      barcodesFromExpressionData.add(expressionData[index].tcga_participant_barcode);
    barcodesFromExpressionData = Array.from(barcodesFromExpressionData);
    clinicalData = await firebrowse.FH({/*cohorts: selectedTumorTypes, */
      barcodes: barcodesFromExpressionData});
  }

  cache.set('rnaSeq', 'clinicalData', clinicalData)
  localStorage.setItem("clinicalFeatureKeys", Object.keys(clinicalData[0]));

  let mutationData = await firebrowse.fetchMutationMAF({cohorts: selectedTumorTypes, genes: selectedGene1})
  let mutationAndClinicalData = mergeClinicalAndMutationData(selectedGene1, mutationData,
    clinicalData);
  localStorage.setItem("mutationAndClinicalData", JSON.stringify(mutationAndClinicalData));
  localStorage.setItem("mutationAndClinicalFeatureKeys", Object.keys((mutationAndClinicalData[0])).sort());
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  buildHeatmap(expressionData, mutationAndClinicalData);
  buildViolinPlot(allSelectedGenes, expressionData);
  buildDownloadButtons(allSelectedGenes, expressionData, clinicalData);
  return null;
};

/** Get the genes that the user has selected in the second gene selector and the genes
 * related to the pathway(s) the user has selected.
 *
 * @returns {Promise<string[]>} Promise that return array of gene names.
 */
const getAllSelectedGenes = async function() {

  let selectedGenes = $(".geneTwoMultipleSelection").select2("data").map((gene) => gene.text);
  
  const genesFromSelectedPathways = await getGenesByPathway();

  if(genesFromSelectedPathways.length > 0) {
    // Combine genes from multiple pathways
    for(let i = 0; i < genesFromSelectedPathways.length; i++) {
      selectedGenes = selectedGenes.concat(genesFromSelectedPathways[i].genes);
    }

    // Remove duplicates from the array
    const removedDuplicates = [];
    $.each(selectedGenes, function(i, element){
      if($.inArray(element, removedDuplicates) === -1) removedDuplicates.push(element);
    });
    selectedGenes = removedDuplicates;
  }

  return selectedGenes;
};

/** Build the heatmap given expression data and clinical data.
 *
 * @typedef {Object} ExpressionData
 * @property {string} cohort
 * @property {number} expression_log2
 * @property {string} gene
 * @property {number} geneID
 * @property {string} protocol
 * @property {string|string[]} sample_type
 * @property {string} tcga_participant_barcode
 * @property {number} z-score
 *
 * @typedef {Object} ClinicalData
 * @property {string} cohort
 * @property {string} date
 * @property {string} date_to_initial_pathologic_diagnosis
 * @property {string} days_to_death
 * @property {string} days_to_last_followup
 * @property {string} ethnicity
 * @property {string} gender
 * @property {string} histological_type
 * @property {string} karnofsky_performance_score
 * @property {string} number_of_lymph_nodes
 * @property {string} number_pack_years_smoked
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
 * @param {ExpressionData[]} expData - Array of expression data.
 * @param {ClinicalData[]} clinData - Array of clinical data.
 *
 * @returns {undefined}
 */
const buildHeatmap = function(expData, clinAndMutationData) {
  // Remove the loader
  document.getElementById("heatmapLoaderDiv").classList.remove("loader");

  // Create div object for heatmap and clear

  const divHeatMap = d3.select("#heatmapLoaderDiv").html("");

  // Create the heatmap
  createHeatmap(expData, clinAndMutationData, divHeatMap);
};


/** Build violin plots.
 *
 * @param {string[]} geneQuery - Array of gene names.
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 *
 * @returns {undefined}
 */
const buildViolinPlot = function(geneQuery, expressionData) {
  //Remove loader from violin plot container
  var violinLoaderDiv = document.getElementById("violinLoaderDiv");
  violinLoaderDiv.classList.remove("loader");

  //Setup Materialize Grid
  addDivInside("violinGridRow", violinLoaderDiv.id);
  var gridRow = document.getElementById("violinGridRow");
  gridRow.classList.add("row");

  // Create partition selector div and add it inside Materialize Grid
  const partitionDivId = "violinPartition";
  addDivInside(partitionDivId, gridRow.id);
  var partitionCol = document.getElementById(partitionDivId);
  partitionCol.classList.add("col", "s3");
  //Generate the partition selector
  createViolinPartitionBox(partitionDivId, geneQuery);

  // Create div for violin plots and add it inside Materialize Grid
  addDivInside("violinPlots", gridRow.id);
  var violinPlotsCol = document.getElementById("violinPlots");
  violinPlotsCol.classList.add("col")
  violinPlotsCol.classList.add("s8");

  // Define the number of cohorts to create a plot for
  const numOfIndependantVars = geneQuery.length;
  // Append an svg object for each cohort to create a violin plot for
  for (let index = 0; index < numOfIndependantVars; index++) {
    // Define the current cohort to create the violin plot for and create a new div for each cohort
    const curGene = geneQuery[index];
    addDivInside(`violinPlot${index}`, "violinPlots");
    addDivInside(`svgViolin${index}`, `violinPlot${index}`);
    const violinDiv = document.getElementById(`violinPlot${index}`);
    createViolinPlot(expressionData, violinDiv, curGene, []);

  }
};


/** Save an object to a file and prompt user to download the file.
 *
 * @param {any} x - Thing to save to a file.
 * @param {string} fileName - Name of the file.
 * @returns {HTMLAnchorElement} Anchor with URL to file for download.
 */
const saveFile = function(x, fileName) {
  // x is the content of the file
  const blob = new Blob([x]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click(); // then download it automatically
  return a;
};


let mergeClinicalAndMutationData = function(selectedGene1, mutationData, clinicalData) {
  let dataToReturn = clinicalData;  
  for(let index = 0; index < dataToReturn.length; index++) {
    let curParticipantBarcode = dataToReturn[index].tcga_participant_barcode;
    for(let geneIndex = 0; geneIndex < selectedGene1.length; geneIndex++) {
        let curGeneMutation = selectedGene1[geneIndex] + "_Mutation";
        let mutationValue = getVariantClassification(mutationData, curParticipantBarcode, 
          selectedGene1[geneIndex]);
        //Append feature to JSON object
        dataToReturn[index][curGeneMutation] = mutationValue;
    }  
  }
  return dataToReturn;
};

let getVariantClassification = function (mutationData, curTumorSampleBarcode, 
  curGene) {
    for(let index = 0; index < mutationData.length; index++) {
    if(mutationData[index]["Tumor_Sample_Barcode"].substring(0, 12) == curTumorSampleBarcode 
        && mutationData[index].Hugo_Symbol == curGene) {
          return(curGene + " " + mutationData[index].Variant_Classification);
    }
  }
  return curGene + " Wild_Type";
};

/** Renders downloads buttons and sets up onClick() functions.
 *
 * @param {string[]} cohortID - Names of the cohorts.
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 * @param {clinicalData[]} clinicalData - Array of clinical data objects.
 *
 * @returns {undefined}
 */
let buildDownloadButtons = async function(cohortID, expressionData, clinicalData) {
  let genes, barcodes_exp, barcodes_clin;
  if(expressionData) {
    //Extract genes from RNA-seq expression data
    genes = d3.map(expressionData, d => d.gene).keys();
    //Extract participant barcodes for RNA-seq expression data to speed up download functions
    barcodes_exp = d3.map(expressionData, (d) => {
      if (d) return d.tcga_participant_barcode;
      else return d;
    }).keys().sort();
  }
  if(clinicalData) {
    //Extract participant barcodes from clinical data to speed up download functions
    barcodes_clin = d3.map(clinicalData, (d) => {
      if (d) return d.tcga_participant_barcode;
      else return d;
    }).keys().sort();
  }
  // clear div and add new button for json, csv_exp, csv_clin
  $("#downloadAllButton").on("click", function () {
    downloadAllData(cohortID, expressionData, genes, clinicalData, barcodes_exp, barcodes_clin);
  });
  $("#downloadExpressionZscoreButton").on("click", async function () {
    downloadExpressionZScore(cohortID, expressionData, genes, barcodes_exp);
  });
  $("#downloadExpressionLog2Button").on("click", function () {
    downloadExpressionLog2(cohortID, expressionData, genes, barcodes_exp)
  });
  $("#downloadClinicalButton").on("click", function () {
    downloadClinicalData(cohortID, clinicalData, barcodes_clin)
  });
  $("#downloadDataButtons").show();
  $("ul.tabs").show();
  instance.updateTabIndicator();
}

/** Builds downloadable file of the expression and clinical data.
 *
 * @param {string[]} cohortID - Names of the cohorts.
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 * @param {clinicalData[]} clinicalData - Array of clinical data objects.
 * @returns {undefined}
 */
let downloadAllData = function(cohortID, expressionData, genes, clinicalData, barcodes_exp, barcodes_clin) {
  const timestamp = new Date().toUTCString().replace(",","");
  const clin_vars = Object.keys(clinicalData[0]);
  //Unique union of expression + clinical barcodes
  const barcodes_all = [...new Set([...barcodes_exp, ...barcodes_clin])];

  //Define the firebrowse query strings (to include in header)
  //Add barcodes else cohort ?
  const fb_str_exp = jQuery.param({
    format: "json",
    cohort: cohortID,
    tcga_participant_barcode: barcodes_all,
    gene: genes,
    page: 1,
    page_size: 2000,
    sort_by: "tcga_participant_barcode",
    sample_type: ["TP", "TB"],
  });
  const fb_str_clin = jQuery.param({
    format: "json",
    cohort: cohortID,
    tcga_participant_barcode: barcodes_all,
    //fh_cde_name: clin_vars,
    page: 1,
    page_size: 2000,
    sort_by: "tcga_participant_barcode",
  });

  // create header for json (describes dataset)
  const headerObject = {
    cohort: cohortID,
    barcodes: barcodes_all,
    //filter: "no filter", // put in what pie chart slices are selected
    clinical_features: clin_vars,
    genes_query: genes,
    firebrowse_expression_query_string: fb_str_exp,
    firebrowse_clinical_query_string: fb_str_clin,
    timestamp: timestamp,
  };

  //Create saveObject for JSON download
  const saveObject = {
    header: headerObject,
    expression_data: expressionData,
    clinical_data: clinicalData,
  };

  //Save file using saveFile() function
  saveFile(JSON.stringify(saveObject), "WebGen_data.json");
}

/** Builds downloadable file of the z-score expression data.
 *
 * @param {string[]} cohortID - Names of the cohorts.
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 * @param {string[]} genes - Names of the genes.
 * @param {string[]} barcodes_exp - TCGA participant barcodes
 * @returns {undefined}
 */
let downloadExpressionZScore = async function(cohortID, expressionData, genes, barcodes_exp) {
  if (typeof(expressionData) === "undefined" || expressionData.length == 0) {
    alert("Expression data is empty. Please select genes to save.");
  }
  else {
    ProgressBar.setPercentage(0, "Preparing Download");
    const timestamp = new Date().toUTCString().replace(",","");
    //Make Expression CSV string
    let csv_string_expZscore = `Z-scored Gene Expression,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,${timestamp},TCGA Cohort(s):,${  cohortID  }\n`; // header for zscore csv
    csv_string_expZscore += `Gene,${  barcodes_exp.join(",")}`; //Row is column names
    //For each gene, add a row to CSV, where each comma-separated element is the gene expression for that barcode
    let count = 0;
    genes.forEach((g) => {
      //Append newline and name of gene g in first column
      csv_string_expZscore += `\n${  g}`;
      barcodes_exp.forEach((b) => {
        csv_string_expZscore += ",";
        //Filter out one barcode/gene combination and identify z-score value to add to z-score CSV
        const valZ = expressionData
          .filter((el) => el.tcga_participant_barcode === b && el.gene === g)
          .map((el) => el["z-score"]);
        //Add value to z-score CSV
        if (!valZ.length) { csv_string_expZscore += "NA"; } else { csv_string_expZscore += valZ; }
      });
      count += 1;
      ProgressBar.setPercentage(count/genes.length*100, "Preparing Download");
      console.log("Preparing Download: " + ProgressBar.percent);
    });
    //Use saveFile() function
    saveFile(csv_string_expZscore, "WebGen_expression_Zscore.csv");
    ProgressBar.cleanUp();
  }
}

/** Builds downloadable file of the log2 expression data.
 *
 * @param {string[]} cohortID - Names of the cohorts.
 * @param {ExpressionData[]} expressionData - Array of expression data objects.
 * @param {string[]} genes - Names of the genes.
 * @param {string[]} barcodes_exp - TCGA participant barcodes
 * @returns {undefined}
 */
let downloadExpressionLog2 = function(cohortID, expressionData, genes, barcodes_exp) {
  if (typeof(expressionData) === "undefined" || expressionData.length == 0) {
    alert("Expression data is empty. Please select genes to save.");
  }
  else {
    const timestamp = new Date().toUTCString().replace(",","");
    //Make Expression CSV string
    let csv_string_expLog2 = `Log2 Gene Expression,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,${timestamp},TCGA Cohort(s):,${  cohortID  }\n`; // header for expression_log2 csv
    csv_string_expLog2 += `Gene,${  barcodes_exp.join(",")}`; //Row is column names  
    //For each gene, add a row to CSV, where each comma-separated element is the gene expression for that barcode
    genes.forEach((g) => {
      //Append newline and name of gene g in first column
      csv_string_expLog2 += `\n${  g}`;
      barcodes_exp.forEach((b) => {
        csv_string_expLog2 += ",";
        //Filter out one barcode/gene combination and identify log2 value to add to log2 CSV
        const valL = expressionData
          .filter((el) => el.tcga_participant_barcode === b && el.gene === g)
          .map((el) => el.expression_log2);
        //Add value to log2 CSV
        if (!valL.length) { csv_string_expLog2 += "NA"; } else { csv_string_expLog2 += valL; }
      });
    });
    //Use saveFile() function
    saveFile(csv_string_expLog2, "WebGen_expression_log2.csv"); // use saveFile function
  }
}

/** Builds downloadable file of the clinical data.
 *
 * @param {string[]} cohortID - Names of the cohorts.
 * @param {clinicalData[]} clinicalData - Array of clinical data objects.
 *
 * @returns {undefined}
 */
let downloadClinicalData = function(cohortID, clinicalData, barcodes_clin) {
  if (typeof(clinicalData) === "undefined" || clinicalData.length == 0) {
    alert("Clinical data is empty. Please select clinical features to save.");
  }
  else {
    //Extract clinical variables from clinical data and sort for formatting purposes
    const clin_vars = Object.keys(clinicalData[0]).sort();
    const timestamp = new Date().toUTCString().replace(",","");
    //Make Clinical CSV string
    let csv_string_clin = `Clinical Metadata,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,${timestamp},TCGA Cohort(s):,${  cohortID  }\n`; // header for clinical csv
    csv_string_clin += `Clinical Feature,${  barcodes_clin.join(",")}`; // first row is column names
    //for each clinical feature, add a row to csv, each comma-separated element is the feature value for that barcode
    clin_vars.forEach((f) => {
      // Add newline and name of feature f in first column
      csv_string_clin += `\r${  f}`;
      barcodes_clin.forEach((b) => {
        csv_string_clin += ",";
        // Obtain value at barcode b and field of feature f
        const val = clinicalData.filter((el) => el.tcga_participant_barcode === b).map((el) => el[f]);
        if (!val.length) { csv_string_clin += "NA"; } 
        else {
          //replace() catches any commas or newlines within the added value
          csv_string_clin += val.toString().replace(/\n|\r|,/g,"");
        }
      });
    });
    //Use saveFile() function
    saveFile(csv_string_clin, "WebGen_clinical.csv");
  }
}