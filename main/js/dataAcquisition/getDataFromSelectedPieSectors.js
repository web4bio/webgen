
// ***** Get intersection of barcodes from selected pie sectors (below) *****

getBarcodesFromSelectedPieSectors = async function(selectedTumorTypes) {
  // a "field" is either a gene name or a clinical feature
  let selectedCategoricalFields = Object.keys(selectedCategoricalFeatures);
  let concatFilteredBarcodes = [];
  let cacheMu = await getCacheMU(); // Instantiate caching interface for mutation data
  let cacheBar = await getCacheBAR(); // Instantiate caching interface for barcode data
  let cacheClin = await getCacheCLIN(); // Instantiate caching interface for clinical data
  let barcodesByCohort = await cacheBar.fetchWrapperBAR(selectedTumorTypes); // Get all barcodes for the selected cohorts
  let clinicalData = await cacheClin.fetchWrapperCLIN(selectedTumorTypes, barcodesByCohort); // Fetch clinical data for cohorts of interest
  clinicalData = clinicalData.map(obj => obj.clinical_data); // Extract mutation_data property for each cohort
  clinicalData = clinicalData.flat(); // Use flat() to make patients' clinical data a 1-D array
  // LOOP THRU ALL CLICKED FIELDS
  for(let i = 0; i < selectedCategoricalFields.length; i++) {
    let currentField = selectedCategoricalFields[i];
    // if current selected sector belongs to a gene...
    if(currentField[i].toUpperCase() == currentField[i]) {
      let currentGene = currentField;
      let mutationDataForThisGene = await cacheMu.fetchWrapperMU(selectedTumorTypes, [currentGene]); // Fetch mutation data for currentGene
      concatFilteredBarcodes['' + currentGene] = []; // Initialize to empty array to use push()
      let clickedMutations = selectedCategoricalFeatures[currentGene]; // Get array of selected mutations
      // Iterate over mutation data for a specific gene to get patients with mutation types of interest
      for(let index = 0; index < mutationDataForThisGene.length; index++) {
        // If mutation_label property for current patient is in array of selected mutation types, then append to barcodes array
        if(clickedMutations.includes(mutationDataForThisGene[index].mutation_label))
          concatFilteredBarcodes['' + currentGene].push(mutationDataForThisGene[index]["tcga_participant_barcode"]); // Append patient barcode to concatFilteredBarcodes
      // Perform AND logic with prior barcodes in concatFilteredBarcodes to get desired cohort of patients
      }

    } else {

      let currentClinicalFeature = currentField;
      let filteredClinicalData = [];
      let uniqueBarcodes;

      let clickedClinicalValues = selectedCategoricalFeatures[currentClinicalFeature];

      for(let j = 0; j < clickedClinicalValues.length; j++) {

        let currentClinicalValue = clickedClinicalValues[j];

        filteredClinicalData = clinicalData.filter(person => (person[currentClinicalFeature] == currentClinicalValue))

        let onlyBarcodes = filteredClinicalData.map(x => x.tcga_participant_barcode);

        function onlyUnique(value, index, self) {
          return self.indexOf(value) === index;
        }
        uniqueBarcodes = onlyBarcodes.filter(onlyUnique);

        if(concatFilteredBarcodes['' + currentClinicalFeature] == undefined)
          concatFilteredBarcodes['' + currentClinicalFeature] = uniqueBarcodes;
        else
          concatFilteredBarcodes['' + currentClinicalFeature] = concatFilteredBarcodes['' + currentClinicalFeature].concat(uniqueBarcodes);
      }
    }
  }
  // loop through all range data
  for(let i = 0; i < selectedContinuousFeatures.length; i++) {
    let continuousFeature = selectedContinuousFeatures[i];
    let rangeValue = selectedRange;

    filteredRangeData = clinicalData.filter(person => (person[continuousFeature] >= rangeValue[0] && person[continuousFeature] <= rangeValue[1]))

    let onlyBarcodes = filteredRangeData.map(x => x.tcga_participant_barcode);

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
    uniqueBarcodes = onlyBarcodes.filter(onlyUnique);

    if(concatFilteredBarcodes['' + continuousFeature] == undefined)
      concatFilteredBarcodes['' + continuousFeature] = uniqueBarcodes;
    else
      concatFilteredBarcodes['' + continuousFeature] = concatFilteredBarcodes['' + continuousFeature].concat(uniqueBarcodes);
  }


  // Get intersection of barcodes from selected pie sectors
  // console.log(concatFilteredBarcodes)
  let clicked_gene_mutation = Object.keys(concatFilteredBarcodes);
  let intersectedBarcodes;

  // If user clicked 0 or 1 gene/mutation combos, simply use these barcodes
  if(clicked_gene_mutation.length <= 1) {
    let currentGene = clicked_gene_mutation[0];
    intersectedBarcodes = concatFilteredBarcodes[currentGene]; // barcode(s) for selected gene mutation combo in given cancer type

  // If user clicked >1 gene/mutation combos, compute intersection
  } else {
    for(let i = 0; i < clicked_gene_mutation.length - 1; i++) {
      let currentGene = clicked_gene_mutation[i];
      let nextGene = clicked_gene_mutation[i + 1];
      let barcodesForCurrentGene = concatFilteredBarcodes[currentGene]; // barcode(s) for selected gene mutation combo in given cancer type
      let barcodesForNextGene = concatFilteredBarcodes[nextGene];
      intersectedBarcodes = barcodesForCurrentGene.filter(x => barcodesForNextGene.includes(x));
    }
  }

  //DEBUG
  //console.log("Final Cohort Size: ");
  //console.log(intersectedBarcodes.length)
  //DEBUG
  return intersectedBarcodes
}


getExpressionDataFromIntersectedBarcodes = async function(intersectedBarcodes, cohortQuery, expressionQuery){
  //let allData = allClinicalData;
  let cacheBar = await getCacheBAR(); // Instantiate barcode caching interface
  let barcodesByCohort = await cacheBar.fetchWrapperBAR(cohortQuery); // Get barcodes grouped by cohort to fetch clinical data
  let cacheClin = await getCacheCLIN(); // Instantiate clinical data caching interface
  let allData = await cacheClin.fetchWrapperCLIN(cohortQuery, barcodesByCohort); // allData is used when no pie slices are chosen

  // if no pie sectors were selected, return allData
  if(intersectedBarcodes === undefined) {

    // Validation of user inputs should prevent allData from being undefined, but we
    // should not depend on state outside of the function to check our values here.
    if (allData === undefined) {
      console.log("allData is undefined, returning early.")
      return
    }
    let allBarcodes = allData.map(x => x.tcga_participant_barcode);
    const smartCache = await getCacheGE();
    let res = await smartCache.fetchWrapperGE(cohortQuery, expressionQuery, allBarcodes);
    return res;

  // if there are NO barcodes at the intersection, we cannot build gene expression visualizations
  } else if(intersectedBarcodes.length == 0) {
    // Remove the loader
    document.getElementById('heatmapLoaderDiv').classList.remove('loader');
    document.getElementById('violinLoaderDiv').classList.remove('loader');

    let sorryDiv = document.getElementById("sorryDiv");
    sorryDiv.innerHTML = "";
    para = document.createElement("P");
    para.setAttribute('style', 'text-align: center; color: black; font-family: Georgia, "Times New Roman", Times, serif');
    para.setAttribute('id', 'noIntersectPara');
    para.innerText = "No patient barcodes exist for the combination of pie sectors selected.";
    sorryDiv.appendChild(para);

  // if there IS/ARE barcode(s) at the intersection, build heatmap and violin plots
  } else {
    sorryDiv.innerHTML = "";

    // Filter expression data based on intersection of barcodes
    // The final data array may include a fewer number of barcodes than that contained in
    // the intersectedBarcodes array if RNAseq data is not available for all patient barcodes
    // contained in intersectedBarcodes
    const smartCache = await getCacheGE();
    return await smartCache.fetchWrapperGE(cohortQuery, expressionQuery, intersectedBarcodes);
  }
}
