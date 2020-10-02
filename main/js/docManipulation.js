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
  newDiv.setAttribute('id', newDivID);
  newDiv.setAttribute("style", "margin-top:25px"); 
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
    };
  };
};

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
  };
};

// Function to remove the tooltip div elements if they exist:
removeTooltipElements = function () {
  let collection = document.getElementsByClassName('tooltip');

  for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
    collection[0].remove();
  }
};

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
  $('.cancerTypeMultipleSelection').val(['BRCA', 'SARC']);
  $('.geneMultipleSelection').val(['BRCA1', 'EGFR', 'KRAS', 'TP53']);

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
  
  let dataToPlotInfo;

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

  // Get gene query and cohort query values from select2 box:
  let cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
                    cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let geneQuery = $('.geneMultipleSelection').select2('data').map(
                    geneInfo => geneInfo.text);
  // Get mutation value(s) from select2 box
  let selectedVariantClassifications = $('.mutationMultipleSelection').select2('data').map(
                                        mutationInfo => mutationInfo.text);

  if(selectedVariantClassifications == "") {

    // Fetch RNA sequence data and display requested plots:
    dataToPlotInfo = getExpressionDataJSONarray_cg(cohortQuery, geneQuery);

  } else {

    let iniMutationFetch = await fetchMutationData();
    let allVariantClassificationData = iniMutationFetch.MAF;

    let selectedVariantClassificationData = [];
    for(let i = 0; i < allVariantClassificationData.length; i++) 
      for(let j = 0; j < selectedVariantClassifications.length; j++) 
        if(allVariantClassificationData[i].Variant_Classification == selectedVariantClassifications[j]) 
          selectedVariantClassificationData.push(allVariantClassificationData[i])

    let selectedBarcodes = selectedVariantClassificationData.map(x => x.Tumor_Sample_Barcode);

    let trimmedBarcodes = selectedBarcodes.map(x => x.slice(0, 12))

    // get unique barcodes
    let barcodes = []
    for(let i = 0; i < trimmedBarcodes.length; i++) {
      if(i == 0) {
        barcodes.push(trimmedBarcodes[i])
      } else if(!barcodes.includes(trimmedBarcodes[i])) {
        barcodes.push(trimmedBarcodes[i])
      }
    }

    // Fetch RNA sequence data and display requested plots:
    dataToPlotInfo = getExpressionDataJSONarray_cgb(cohortQuery, geneQuery, barcodes);

  }
  
  // Once data is returned, build the plots:
  dataToPlotInfo.then(function(data) {
    // Check that the fetch worked:
    if (data == 'Error: Invalid Input Fields for Query.') {
      document.getElementById('heatmapDiv0').classList.remove('loader');               // Remove the loader.
      document.getElementById('svgViolinDiv0').classList.remove('loader');             // Remove the loader.
      showError('geneError');
      return;
    }
    
    // If the fetched worked, build the plots:

    // Display Warning for any invalid genes:
    let myGenesReturned = d3.map(data, function(d){return d.gene;}).keys();
    let emptyGeneArray = geneQuery.filter(function(gene) { if (!myGenesReturned.includes(gene)) { return gene} });
    if (emptyGeneArray.length > 0) {
      showWarning(emptyGeneArray)
    };

    // Set up the figure dimensions:
    let margin = {top: 80, right: 30, bottom: 30, left: 60},
        width = 1250 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    document.getElementById('heatmapDiv0').classList.remove('loader');                        // Remove the loader.
    document.getElementById('svgViolinDiv0').classList.remove('loader');               // Remove the loader.

    // Build the heatmap:
    // Append an svg object:
    let svgHeatMap = d3.select("#heatmapRef").append("svg")
        .attr("viewBox", `0 0 1250 500`)                                           // This line makes the svg responsive
        .attr("id", 'svgHeatMap')
        .append("g")
        .attr("transform",
            "translate(" + (margin.left) + "," + margin.top + ")");

    // Create the heatmap:
    createHeatmap('cohort', cohortQuery, data, svgHeatMap);

    // Build the violin plot:
    //Appending multiple g elements to svg object for violin plot
    let myCohorts = d3.map(data, function(d){return d.cohort;}).keys();
    //Define the number of cohorts to create a plot for
    let numCohorts = myCohorts.length;
    //Spacing between plots
    let ySpacing = margin.top;

    // Append an svg object for each cohort to create a violin plot for
    for(var index = 0; index < numCohorts; index++)
    {
      //Define the current cohort to create the violin plot for
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

  });
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
showError = function(errorType) {
  // Create div1 and set it to be alert class:
  addDiv('div1','heatmapDiv0');
  let divElement = document.getElementById('div1');
  divElement.className = 'alert';

  // Creates span clone from span0 to add to div1:
  let span = document.getElementById('span0');
  let spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Adds the error message to the div:
  if(errorType == 'geneError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Gene Fields for Query";
  } else if (errorType == 'cohortError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Cohort Fields for Query";
  };
};

// Function to display a warning for genes that don't have mRNA-Seq data:
// NOTE: warnings are no longer needed since we have introduced select2 boxes. Saving this code incase needed later:
showWarning = function(emptyGeneArray_arg) {
  // Create div1 and set it to be warning class:
  let divElement = document.getElementById('heatmapDiv0');
  divElement.className = 'warning';

  // Create span clone from span0 to add to div1:
  let span = document.getElementById('span0');
  let spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Add the warning message to the div:
  if (emptyGeneArray_arg.length == 1) {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " is an Invalid Gene for Query";
  } else {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " are Invalid Genes for Query";
  };
}

// // Function to check that the user input cohort list is valid:
// checkCohortList = function(cohortQuery) {
//   // List of valid cohorts:
//   let validCohortList = ['ACC','BLCA','BRCA','CESC','CHOL','COAD','COADREAD','DLBC','ESCA','FPPP','GBM','GBMLGG','HNSC',
//                          'KICH','KIPAN','KIRC','KIRP','LAML','LGG','LIHC','LUAD','LUSC','MESO','OV','PAAD','PCPG','PRAD',
//                          'READ','SARC','SKCM','STAD','STES','TGCT','THCA','THYM','UCEC','UCS','UVM'];

//   // Check the cohort list:
//   numCohorts = cohortQuery.length;
//   for (var i = 0; i < numCohorts; i++) {
//     let statusTemp = validCohortList.includes(cohortQuery[i]);
//     if (statusTemp == false) {
//       return false;
//     };
//   };
//   return true;
// };

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
