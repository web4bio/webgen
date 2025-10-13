
// ***** Get intersection of barcodes from selections in data explore charts (below) *****

getBarcodesFromSelectedFeatures = async function(selectedTumorTypes) {

  // retrieve selection data from global variables
  let selectedCategoricalFields = Object.keys(selectedCategoricalFeatures);
  let selectedContinuousFields = Object.keys(selectedContinuousFeatures);

  let barcodesReppingAllSelectionsForEachFeature = [];
  let cacheMu = await getCacheMU(); // Instantiate caching interface for mutation data
  let cacheBar = await getCacheBAR(); // Instantiate caching interface for barcode data
  let cacheClin = await getCacheCLIN(); // Instantiate caching interface for clinical data
  
  let allBarcodesForSelectedTumorType = await cacheBar.fetchWrapperBAR(selectedTumorTypes); // Get all barcodes for the selected tumor type(s)
  
  let allClinicalDataForSelectedTumorTypes = await cacheClin.fetchWrapperCLIN(selectedTumorTypes, allBarcodesForSelectedTumorType); // Fetch clinical data for all patients with selected tumor type(s)
  allClinicalDataForSelectedTumorTypes = allClinicalDataForSelectedTumorTypes.map(obj => obj.clinical_data); // Extract mutation_data property for each cohort
  allClinicalDataForSelectedTumorTypes = allClinicalDataForSelectedTumorTypes.flat(); // Use flat() to make patients' clinical data a 1-D array

  // LOOP THRU ALL CLICKED ~CATEGORICAL~ FIELDS (whether from gene mutation plot or metadata)
  // (e.g., one gene at a time, or one metadata field at a time)
  for(let i = 0; i < selectedCategoricalFields.length; i++) {

    let currentField = selectedCategoricalFields[i];

    // if current selected sector belongs to a gene...
    if(currentField[i].toUpperCase() == currentField[i]) {

      let currentGene = currentField;

      let allMutationDataForThisGene = await cacheMu.fetchWrapperMU(selectedTumorTypes, [currentGene]); // Fetch all mutation data for currentGene
      
      let clickedMutations = selectedCategoricalFeatures[currentGene]; // Get array of selected mutations
      
      barcodesReppingAllSelectionsForEachFeature[currentGene+'mutationFilt'] = []; // Initialize to empty array to use push()

      if(clickedMutations.length > 0) {
        barcodesReppingAllSelectionsForEachFeature[currentGene+'mutationFilt'] = allMutationDataForThisGene
          .filter(record => clickedMutations.includes(record.mutation_label))
          .map(record => record.tcga_participant_barcode);

      }
      // We are basically getting lists of barcodes, repping ppl who have particular mutations in particular genes

      // If no mutations have been selected, then we will append all the barcodes to the array
      // else {
      //   barcodesReppingAllSelectionsForEachFeature[currentGene] = allMutationDataForThisGene.map(record => record.tcga_participant_barcode);
      // }

    // ELSE, CURRENT CATEGORICAL FIELD IS A "CLINICAL" ONE
    } else {

      let currentClinicalFeature = currentField;
      let clickedClinicalValues = selectedCategoricalFeatures[currentClinicalFeature];

      let filteredClinicalData = [];
      let uniqueBarcodes;

      function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
      }
      // for each value of the 
      for(let j = 0; j < clickedClinicalValues.length; j++) {

        let currentClinicalValue = clickedClinicalValues[j];

        // filter the clinical data object to only include entries (i.e., barcodes) that have the selected values for the clinical data field
        filteredClinicalData = allClinicalDataForSelectedTumorTypes.filter(person => (person[currentClinicalFeature] == currentClinicalValue))
        // now just get the barcodes from those entries
        let onlyBarcodes = filteredClinicalData.map(x => x.tcga_participant_barcode);
        uniqueBarcodes = onlyBarcodes.filter(onlyUnique);

        if (barcodesReppingAllSelectionsForEachFeature[currentClinicalFeature] === undefined)
          barcodesReppingAllSelectionsForEachFeature[currentClinicalFeature] = uniqueBarcodes;
        else
          barcodesReppingAllSelectionsForEachFeature[currentClinicalFeature] = barcodesReppingAllSelectionsForEachFeature[currentClinicalFeature].concat(uniqueBarcodes);
      }
    }
  }

  // LOOP THRU ALL CLICKED ~CONTINUOUS~ FIELDS (whether from gene mutation plot or metadata)
  // (e.g., one gene at a time, or one metadata field at a time)
  for(let i = 0; i < selectedContinuousFields.length; i++) {

    let currentField = selectedContinuousFields[i];

    let rangeValue = selectedContinuousFeatures[currentField]; // Get range of data to filter allClinicalDataForSelectedTumorTypes by
    let onlyBarcodes = [];

    // if current continuous field is a GENE
    if (currentField[0] === currentField[0].toUpperCase()) {

      // Fetch gene expression cache
      let cacheGe = await getCacheGE();
            
      let genesWithExpressionFilters = Object.keys(selectedContinuousFeatures).filter(key => {
        // Check if this key represents a gene (starts with uppercase) and has a range
        return key[0] === key[0].toUpperCase() && 
            selectedContinuousFeatures[key] && 
            Array.isArray(selectedContinuousFeatures[key]) &&
            selectedContinuousFeatures[key].length >= 2;
      });
      // Process each gene with expression filters
      for (let gene of genesWithExpressionFilters) {
          let rangeValue = selectedContinuousFeatures[gene];
          let minExpression = rangeValue[0];
          let maxExpression = rangeValue[1];
          
          // console.log(`Processing expression filter for ${gene}: ${minExpression} to ${maxExpression}`);
          
          // Fetch gene expression data for this gene
          let geneExpressionData = await cacheGe.fetchWrapperGE(selectedTumorTypes, [gene]);

          // Filter by expression range and tumor samples only
          let filteredExpressionData = geneExpressionData.filter(record => {
              return record.sample_type === "TP" && 
                  record.expression_log2 !== null &&
                  record.expression_log2 !== undefined &&
                  !isNaN(record.expression_log2) &&
                  record.expression_log2 >= minExpression && 
                  record.expression_log2 <= maxExpression;
          });
          

          // Extract unique barcodes for this gene
          onlyBarcodes = filteredExpressionData.map(record => record.tcga_participant_barcode);

          barcodesReppingAllSelectionsForEachFeature[gene+'expressionFilt'] = onlyBarcodes

      }

    } else {

        filteredRangeData = allClinicalDataForSelectedTumorTypes.filter(person => (person[currentField] >= rangeValue[0] && person[currentField] <= rangeValue[1]))
        onlyBarcodes = filteredRangeData.map(x => x.tcga_participant_barcode);  
        barcodesReppingAllSelectionsForEachFeature[currentField] = onlyBarcodes

      }
  }

  // console.log(barcodesReppingAllSelectionsForEachFeature)

  function intersectValues(kv) {
    let arrays;
  
    if (kv instanceof Map) {
      arrays = Array.from(kv.values());
    } else if (Array.isArray(kv)) {
      // Handle arrays with named properties (Object.values grabs them)
      const vals = Object.values(kv);
      // If entries-like [[key, arr], ...], pick the arr
      if (vals.every(v => Array.isArray(v) && v.length === 2 && Array.isArray(v[1]))) {
        arrays = vals.map(v => v[1]);
      } else {
        arrays = vals.filter(Array.isArray); // named props or array-of-arrays
        if (arrays.length === 0) arrays = kv.filter?.(Array.isArray) ?? [];
      }
    } else if (kv && typeof kv === 'object') {
      arrays = Object.values(kv).filter(Array.isArray);
    } else {
      return [];
    }
  
    if (!arrays.length || arrays.some(a => a.length === 0)) return [];
  
    // Dedupe each, start with smallest, intersect via Sets
    const deduped = arrays.map(a => {
      const s = new Set(); const out = [];
      for (const x of a) if (!s.has(x)) { s.add(x); out.push(x); }
      return out;
    }).sort((a,b) => a.length - b.length);
  
    const [first, ...rest] = deduped;
    const restSets = rest.map(a => new Set(a));
  
    const out = [];
    const seen = new Set();
    for (const x of first) {
      if (!seen.has(x) && restSets.every(s => s.has(x))) {
        seen.add(x);
        out.push(x);
      }
    }
    return out;
  }
  
  const common = intersectValues(barcodesReppingAllSelectionsForEachFeature);
  // console.log(common);

  return common
}