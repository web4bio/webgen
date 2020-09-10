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
    };
  };
};

// Function to remove the current svg elements if they exist:
removeSVGelements = function() {
  svgElementsArray = ["svgHeatMap", "svgViolinPlot"];
  for(let i = 0; i < svgElementsArray.length; i++) {
    svgToRemove = document.getElementById(svgElementsArray[i]);
    $(svgToRemove).remove();
  };
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
function buildPlots() {
  // Reset page formatting:
  document.getElementById('heatmapDiv0').innerHTML="";
  document.getElementById('svgViolinDiv0').innerHTML="";
  
  // Removes existing div and svg elements if they're there:
  removeDiv();
  removeSVGelements();

  // Display loader:
  document.getElementById('heatmapDiv0').className = 'loader';                              // Create the loader.
  document.getElementById('svgViolinDiv0').className = 'loader';                     // Create the loader.

  // Gene gene and cohort query values from select2 box:
  let geneQuery = $('.geneMultipleSelection').select2('data').map(
                    geneInfo => geneInfo.text);
  let cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
                    cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  

  // Fetch RNA sequence data and display requested plots:
  let dataToPlotInfo = getExpressionDataJSONarray(cohortQuery, geneQuery);

  // Once data is returned, build the plots:
  dataToPlotInfo.then(function(data) {
    // Check that the fetch worked:
    if (data == 'Error: Invalid Input Fields for Query.') {
      document.getElementById('heatmapDiv0').classList.remove('loader');                      // Remove the loader.
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
    // Append an svg object:
    let svgViolinPlot = d3.select("#violinPlotRef").append("svg")
        .attr("viewBox", `0 0 1250 500`)                                           // This line makes the svg responsive
        .attr("id", 'svgViolinPlot')
        .append("g")
        .attr("transform",
            "translate(" + (margin.left-20) + "," + margin.top + ")");

    // Create the heatmap:
    createViolinPlot('cohort', cohortQuery, data, svgViolinPlot);

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