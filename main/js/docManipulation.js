/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Div/SVG Manipulation (below) ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// Useful for when you have a variable amount of plots to display on the page:
addDiv = function(newDivID, oldDivID) { 
  // create a new div element 
  let newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:25px"); 
  // add the newly created element and its content into the DOM 
  document.getElementById(oldDivID).after(newDiv); 
}

// Function to remove the current div elements if they exist:
removeDiv = function() {
  let i = 1;
  let continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div" + i);
    if(divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      continueBool = false;
    }
  }
}

// Function to remove the current svg elements if they exist:
removeSVGelements = function() {
  svgElementsArray = ["svgHeatMap", "svgViolinPlot"];
  for(let i = 0; i < svgElementsArray.length; i++) {
    svgToRemove = document.getElementById(svgElementsArray[i]);

    if (svgToRemove)
      $(svgToRemove).remove();
    else {
      let ctr = 0
      for (;;) {
        svgToRemove = document.getElementById(svgElementsArray[i] + ctr++)
        if (svgToRemove)
          $(svgToRemove).remove();
        else
          break;  
      }
    }  
  }
}

// Function to remove the tooltip div elements if they exist:
removeTooltipElements = function () {
  let collection = document.getElementsByClassName('tooltip');
  for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
    collection[0].remove();
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Div/SVG Manipulation (above) ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                               //                                                                        //

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Set Values for Example Button (below) ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Setting the cohort and gene list examples if the user clicks the use example button:
function setExampleVars() {
  // Select example values:
  $('.cancerTypeMultipleSelection').val(['PAAD']);
  $('.clinicalMultipleSelection').val(['ethnicity', 'KRAS', 'EGFR', 'TP53']);

  // Trigger the change:
  $('.cancerTypeMultipleSelection').trigger('change');
  $('.geneMultipleSelection').trigger('change');
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Set Values for Example Button (above) ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                               //                                                                        //

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Build Plots on Page (below) /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The JS code for building the plots to display:
// Wait for user input to build plots:

let buildPlots = async function() {
  
  // Reset page formatting:
  document.getElementById('heatmapDiv0').innerHTML = "";
  document.getElementById('svgViolinDiv0').innerHTML = "";
  
  // Remove existing div and svg elements if they're there:
  removeDiv();
  removeSVGelements();
  removeTooltipElements();

  // Display loader:
  document.getElementById('heatmapDiv0').className = 'loader';                       // Create the loader.
  document.getElementById('svgViolinDiv0').className = 'loader';                     // Create the loader.

  let cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
                    cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let geneQuery = $('.clinicalMultipleSelection').select2('data').map(
                    clinicalInfo => clinicalInfo.text);

  // Fetch RNA sequence data
  let expressionData = await getExpressionDataJSONarray_cg(cohortQuery, geneQuery);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // ***** Get ALL barcodes from selected pie sectors (below) *****

  // clinicalValues is an array of key value pairs for gene(s) selected and mutation(s) selected
  let clickedGenes = Object.keys(clinicalValues);
  let concatFilteredBarcodes = [];

  // LOOP THRU ALL CLICKED GENES
  for(let i = 0; i < clickedGenes.length; i++) {

    let currentGene = clickedGenes[i];

    await getAllVariantClassifications(currentGene).then(function(mutationData) { // get ALL mutation data for current gene of the selected genes

      // LOOP THRU ALL CLICKED "MUTATIONS"
      let clickedMutations = clinicalValues[currentGene];
      for(let j = 0; j < clickedMutations.length; j++) {
        let currentMutation = clickedMutations[j];

        // IF CURRENT **"MUTATION" IS NOT WILD TYPE**, then get the associated barcodes from mutation api's data
        if(currentMutation != "Wild_Type") {
          let allData = mutationData.filter(person => (person.Hugo_Symbol == currentGene) && (person.Variant_Classification == currentMutation));
          let onlyBarcodes = allData.map(x => x.Tumor_Sample_Barcode);
          let trimmedOnlyBarcodes = onlyBarcodes.map(x => x.slice(0,12));
          function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
          }
          let filteredTrimmedOnlyBarcodes = trimmedOnlyBarcodes.filter(onlyUnique);
          concatFilteredBarcodes['' + currentGene + '_' + currentMutation] = filteredTrimmedOnlyBarcodes;

        // IF CURRENT **"MUTATION IS WILD TYPE"**, then get the associated barcodes
        } else {

          // IF NO MUTATIONS EXIST AT ALL FOR THE CURRENT GENE, then get the associated barcodes from mRNAseq api's data
          if(mutationData == undefined) {
            let allData = expressionData.filter(person => person.gene == currentGene);
            let onlyBarcodes = allData.map(x => x.tcga_participant_barcode);
            concatFilteredBarcodes['' + currentGene + '_' + currentMutation] = onlyBarcodes;  

          // IF THE GENE HAS SOME MUTATIONS AND SOME WILD-TYPE, then get the associated barcodes by subtracting mutation data from expression data
          } else {
            
            let allData_1 = mutationData.filter(person => person.Hugo_Symbol == currentGene);
            let onlyBarcodes_1 = allData_1.map(x => x.Tumor_Sample_Barcode);
            let trimmedOnlyBarcodes_1 = onlyBarcodes_1.map(x => x.slice(0,12));

            allData_2 = expressionData.filter(person => person.gene == currentGene);
            onlyBarcodes_2 = allData_2.map(x => x.tcga_participant_barcode);

            let barcodesForWildType = [];
            for(let i = 0; i < onlyBarcodes_2.length; i++)
              if(!trimmedOnlyBarcodes_1.includes(onlyBarcodes_2[i]))
                barcodesForWildType.push(onlyBarcodes_2[i]);
            concatFilteredBarcodes['' + currentGene + '_' + currentMutation] = barcodesForWildType;  
          }
        }
      }
    })
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // Get intersection of barcodes from selected pie sectors

  let clicked_gene_mutation = Object.keys(concatFilteredBarcodes);
  let intersectedBarcodes;
  console.log(clicked_gene_mutation)

  // If user clicked 0 or 1 gene/mutation combos, simply use these barcodes
  if(clicked_gene_mutation.length <= 1) {
    let currentGene = clicked_gene_mutation[0];
    intersectedBarcodes = concatFilteredBarcodes[currentGene]; // barcode(s) for selected gene mutation combo in given cancer type

  // If user clicked >1 gene/mutation combos, compute intersection
  } else {
    for(let i = 0; i < clicked_gene_mutation.length - 1; i++) {
      let current_gene_mutation = clicked_gene_mutation[i];
      let next_gene_mutation = clicked_gene_mutation[i + 1];
      let barcodesForCurrentGene = concatFilteredBarcodes[current_gene_mutation]; // barcode(s) for selected gene mutation combo in given cancer type
      console.log(barcodesForCurrentGene)
      let barcodesForNextGene = concatFilteredBarcodes[next_gene_mutation];
      console.log(barcodesForNextGene)
      intersectedBarcodes = barcodesForCurrentGene.filter(x => barcodesForNextGene.includes(x));
    }  
  }

  console.log(intersectedBarcodes)

  // if there are NO barcodes at the intersection, we cannot build gene expression visualizations
  if(intersectedBarcodes.length == 0) {

    // Remove the loader
    document.getElementById('heatmapDiv0').classList.remove('loader');

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
    let data = [];
    for(let i = 0; i < intersectedBarcodes.length; i++) 
      for(let j = 0; j < expressionData.length; j++) 
        if(expressionData[j].tcga_participant_barcode == intersectedBarcodes[i])
          data.push(expressionData[j])

    console.log(data)

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Display Warning for any invalid genes:
    // let myGenesReturned = d3.map(data, function(d){return d.gene;}).keys();
    // let emptyGeneArray = geneQuery.filter(function(gene) { if (!myGenesReturned.includes(gene)) { return gene} });
    // if (emptyGeneArray.length > 0) {
    //   // showWarning(emptyGeneArray)
    // };

    // Build the heatmap
    buildHeatmap(cohortQuery, data);

    // Build the violin plots
    buildViolinPlot(cohortQuery, data);
    
  }

};

buildHeatmap = async function(cohortQuery, data){
  // Remove the loader
  document.getElementById('heatmapDiv0').classList.remove('loader');

  // Create div object for heatmap and clear
  let divHeatMap = d3.select('#heatmapDiv0').html("");

  // Create the heatmap
  createHeatmap(data, divHeatMap);
};

buildViolinPlot = async function(cohortQuery, data){
  // Remove the loader.
  document.getElementById('svgViolinDiv0').classList.remove('loader');               

  // Set up the figure dimensions:
  let margin = {top: 80, right: 30, bottom: 30, left: 60},
  width = 1250 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
  //Appending multiple g elements to svg object for violin plot
  let myCohorts = d3.map(data, function(d){return d.cohort;}).keys();
  //Define the number of cohorts to create a plot for
  let numCohorts = myCohorts.length;
  //Spacing between plots
  let ySpacing = margin.top;

  // Append an svg object for each cohort to create a violin plot for
  for(var index = 0; index < numCohorts; index++) {
    // Define the current cohort to create the violin plot for
    let curCohort = myCohorts[index];

    let svgViolinPlot = d3.select("#violinPlotRef").append("svg")
      .attr("viewBox", `0 0 1250 500`)  // This line makes the svg responsive
      .attr("id", `svgViolinPlot${index}`)
      .append("g")
      .attr("transform",
          "translate(" + (margin.left-20) + "," + 
                      (margin.top + ySpacing*index*0.25) + ")");

    // Create the violin plot:
    createViolinPlot('cohort', cohortQuery, data, svgViolinPlot, curCohort);
  }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Build Plots on Page (above) /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                               //                                                                        //

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Gene/Cohort Checkpoints (below) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to display the error message:
// NOTE: errors are no longer needed since we have introduced select2 boxes. Saving this code incase needed later:
// showError = function(errorType) {
//   // Create div1 and set it to be alert class:
//   addDiv('div1','heatmapDiv0');
//   let divElement = document.getElementById('div1');
//   divElement.className = 'alert';

//   // Creates span clone from span0 to add to div1:
//   let span = document.getElementById('span0');
//   let spanElement = span.cloneNode(true);
//   spanElement.setAttribute('id','span1');
//   divElement.appendChild(spanElement);

//   // Adds the error message to the div:
//   if(errorType == 'geneError') {
//     divElement.innerHTML += "Error: ".bold() + "Invalid Gene Fields for Query";
//   } else if (errorType == 'cohortError') {
//     divElement.innerHTML += "Error: ".bold() + "Invalid Cohort Fields for Query";
//   };
// };

// Function to display a warning for genes that don't have mRNA-Seq data:
// NOTE: warnings are no longer needed since we have introduced select2 boxes. Saving this code incase needed later:
// showWarning = function(emptyGeneArray_arg) {
//   // Create div1 and set it to be warning class:
//   let divElement = document.getElementById('heatmapDiv0');
//   divElement.className = 'warning';

//   // Create span clone from span0 to add to div1:
//   let span = document.getElementById('span0');
//   let spanElement = span.cloneNode(true);
//   spanElement.setAttribute('id','span1');
//   divElement.appendChild(spanElement);

//   // Add the warning message to the div:
//   if (emptyGeneArray_arg.length == 1) {
//     divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " is an Invalid Gene for Query";
//   } else {
//     divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " are Invalid Genes for Query";
//   };
// }

// Function to count the number of genes
// countNumberOfGenes = function(cohortQuery) {
//   let total = 0;
//   numCohorts = cohortQuery.length;
//   for (let i = 0; i < numCohorts; i++) {
//       total++;
//   };
//   return total;
// };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Gene/Cohort Checkpoints (above) /////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
