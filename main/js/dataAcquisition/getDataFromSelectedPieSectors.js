
// ***** Get intersection of barcodes from selected pie sectors (below) *****

getBarcodesFromSelectedPieSectors = async function(expressionData) {

  // a "field" is either a gene name or a clinical feature
  let selectedCategoricalFields = Object.keys(selectedCategoricalFeatures);
  let concatFilteredBarcodes = [];

  // LOOP THRU ALL CLICKED FIELDS
  for(let i = 0; i < selectedCategoricalFields.length; i++) {

    let currentField = selectedCategoricalFields[i];

    // if current selected sector belongs to a gene...
    if(currentField[i].toUpperCase() == currentField[i]) {

      let currentGene = currentField;
      
      // get ALL mutation data for current gene of the selected genes
      let mutationDataForThisGene;
      for(let j = 0; j < mutationDataForAllGenes.length; j++)
        if(mutationDataForAllGenes[j][0].Hugo_Symbol == currentGene)
          mutationDataForThisGene = mutationDataForAllGenes[j];

      // LOOP THRU ALL CLICKED "MUTATIONS"
      let clickedMutations = selectedCategoricalFeatures[currentGene];
      for(let j = 0; j < clickedMutations.length; j++) {
        let currentMutation = clickedMutations[j];
        // IF CURRENT **"MUTATION" IS NOT WILD TYPE**, then get the associated barcodes from mutation api's data
        if(currentMutation != "Wild_Type") {
          let allDataForCurrentMutation = mutationDataForThisGene.filter(person => (person.Variant_Classification == currentMutation));
          let onlyBarcodes = allDataForCurrentMutation.map(x => x.Tumor_Sample_Barcode);
          let trimmedOnlyBarcodes = onlyBarcodes.map(x => x.slice(0,12));

          // we need to perform filtering to get only unique barcodes because some genes with a given
          // mutation type will result in more than one type of protein change... this will result in
          // a barcode appearing more than once in the data
          function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
          }
          let uniqueTrimmedOnlyBarcodes = trimmedOnlyBarcodes.filter(onlyUnique);

          if(concatFilteredBarcodes['' + currentGene] == undefined)
            concatFilteredBarcodes['' + currentGene] = uniqueTrimmedOnlyBarcodes;
          else
            concatFilteredBarcodes['' + currentGene] = concatFilteredBarcodes['' + currentGene].concat(uniqueTrimmedOnlyBarcodes);

        // IF CURRENT **"MUTATION IS WILD TYPE"**, then get the associated barcodes
        } else {

          // IF NO MUTATIONS EXIST AT ALL FOR THE CURRENT GENE, then get the associated barcodes from mRNAseq api's data
          if(mutationDataForThisGene == undefined) {
            let allData = expressionData.filter(person => person.gene == currentGene);
            let onlyBarcodes = allData.map(x => x.tcga_participant_barcode);
            if(concatFilteredBarcodes['' + currentGene] == undefined)
              concatFilteredBarcodes['' + currentGene] = onlyBarcodes;

          // IF THE GENE HAS SOME MUTATIONS AND SOME WILD-TYPE, then get the associated barcodes by subtracting mutation data from expression data
          } else {

            let allData_1 = mutationDataForThisGene.filter(person => person.Hugo_Symbol == currentGene);
            let onlyBarcodes_1 = allData_1.map(x => x.Tumor_Sample_Barcode);
            let trimmedOnlyBarcodes_1 = onlyBarcodes_1.map(x => x.slice(0,12));

            allData_2 = expressionData.filter(person => person.gene == currentGene);
            onlyBarcodes_2 = allData_2.map(x => x.tcga_participant_barcode);

            let barcodesForWildType = [];
            for(let k = 0; k < onlyBarcodes_2.length; k++)
              if(!trimmedOnlyBarcodes_1.includes(onlyBarcodes_2[k]))
                barcodesForWildType.push(onlyBarcodes_2[k]);
            if(concatFilteredBarcodes['' + currentGene] == undefined)
              concatFilteredBarcodes['' + currentGene] = barcodesForWildType;
            else
              concatFilteredBarcodes['' + currentGene] = concatFilteredBarcodes['' + currentGene].concat(barcodesForWildType);
          }
        }
      }

    } else {

      let currentClinicalFeature = currentField;
      let filteredClinicalData = [];
      let uniqueBarcodes;

      let clickedClinicalValues = selectedCategoricalFeatures[currentClinicalFeature];

      for(let j = 0; j < clickedClinicalValues.length; j++) {

        let currentClinicalValue = clickedClinicalValues[j];

        filteredClinicalData = allClinicalData.filter(person => (person[currentClinicalFeature] == currentClinicalValue))

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
  for(let i = 0; i < selectedRange.length; i++) {
    let continuousFeature = selectedRange[i];
    let div = document.getElementById(continuousFeature + 'Div');
    let rangeValue = div.layout.xaxis.range;
    // console.log(continuousFeature);
    // console.log(rangeValue[0]);
    // console.log(rangeValue[1]);

    filteredRangeData = allClinicalData.filter(person => (person[continuousFeature] >= rangeValue[0] && person[continuousFeature] <= rangeValue[1]))

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

  return intersectedBarcodes
}


getExpressionDataFromIntersectedBarcodes = async function(intersectedBarcodes, cohortQuery, expressionQuery){

  // allData is used when no pie slices are chosen
  let allData = allClinicalData;

  // if no pie sectors were selected, return allData
  if(intersectedBarcodes === undefined) {

    // Validation of user inputs should prevent allData from being undefined, but we
    // should not depend on state outside of the function to check our values here.
    if (allData === undefined) {
      console.log("allData is undefined, returning early.")
      return
    }
    let allBarcodes = allData.map(x => x.tcga_participant_barcode);
    return await firebrowse.fetchmRNASeq({cohorts: cohortQuery, genes: expressionQuery, barcodes: allBarcodes});

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
    return await firebrowse.fetchmRNASeq({cohorts: cohortQuery, genes: expressionQuery, barcodes: intersectedBarcodes});
  }
}
