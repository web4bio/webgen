// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// Useful for when you have a variable amount of plots to display on the page:
addElement = function(newDivID, oldDivID) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:25px"); 
  
  // add the newly created element and its content into the DOM 
  document.getElementById(oldDivID).after(newDiv); 
}


// Function to remove the current div elements if they exist:
removeDIVelements = function() {
  var i = 1;
  var continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div" + i);
    if(divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      var continueBool = false;
    };
  };
};

// Function to remove the current svg elements if they exist:
removeSVGelements = function() {
  svgElementsArray = ["svgHeatMap", "svgViolinPlot"];

  for (var i=0; i < svgElementsArray.length; i++) {
    svgToRemove = document.getElementById(svgElementsArray[i]);
    $(svgToRemove).remove();
  };
};


// Function to display the error message:
// NOTE: errors are no longer needed since we have introduced select2 boxes. Saving this code incase needed later:
showError = function(errorType) {
  // Create div1 and set it to be alert class:
  addElement('div1','div0');
  var divElement = document.getElementById('div1');
  divElement.className = 'alert';

  // Creates span clone from span0 to add to div1:
  var span = document.getElementById('span0');
  var spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Adds the error message to the div:
  if (errorType == 'geneError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Gene Fields for Query";
  } else if (errorType == 'cohortError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Cohort Fields for Query";
  };
};


// Function to display a warning for genes that don't have mRNA-Seq data:
// NOTE: warnings are no longer needed since we have introduced select2 boxes. Saving this code incase needed later:
showWarning = function(emptyGeneArray_arg) {
  // Create div1 and set it to be warning class:
  var divElement = document.getElementById('div0');
  divElement.className = 'warning';

  // Create span clone from span0 to add to div1:
  var span = document.getElementById('span0');
  var spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Add the warning message to the div:
  if (emptyGeneArray_arg.length == 1) {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " is an Invalid Gene for Query";
  } else {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " are Invalid Genes for Query";
  };
}


// Function to check that the user input cohort list is valid:
checkCohortList = function(cohortQuery) {
  // List of valid cohorts:
  var validCohortList = ['ACC','BLCA','BRCA','CESC','CHOL','COAD','COADREAD','DLBC','ESCA','FPPP','GBM','GBMLGG','HNSC',
                         'KICH','KIPAN','KIRC','KIRP','LAML','LGG','LIHC','LUAD','LUSC','MESO','OV','PAAD','PCPG','PRAD',
                         'READ','SARC','SKCM','STAD','STES','TGCT','THCA','THYM','UCEC','UCS','UVM'];

  // Check the cohort list:
  numCohorts = cohortQuery.length;
  for (var i = 0; i < numCohorts; i++) {
    var statusTemp = validCohortList.includes(cohortQuery[i]);
    if (statusTemp == false) {
      return false;
    };
  };

  return true;
};

// Function to count the amount of genes
amount = function(cohortQuery) {
  var total = 0;
  numCohorts = cohortQuery.length;
  for (var i = 0; i < numCohorts; i++) {
      total++;
  };
  return total;
};

// Setting the cohort and gene list examples if the user clicks the use example button:
function setExampleVars() {
  // Select example values:
  $('.cancerTypeMultipleSelection').val(['BRCA', 'SARC']);
  $('.geneMultipleSelection').val(['BRCA1', 'EGFR', 'KRAS', 'TP53']);

  // Trigger the change:
  $('.cancerTypeMultipleSelection').trigger('change');
  $('.geneMultipleSelection').trigger('change');
};


// The JS code for building the plots to display:
// Wait for user input to build plots:
function setVars() {
  // Reset page formatting:
  document.getElementById('div0').innerHTML="";
  document.getElementById('svgViolinDiv0').innerHTML="";
  
  // Removes existing div and svg elements if they're there:
  removeDIVelements();
  removeSVGelements();

  // Display loader:
  document.getElementById('div0').className = 'loader';                              // Create the loader.
  document.getElementById('svgViolinDiv0').className = 'loader';                     // Create the loader.

  // Gene gene and cohort query values from select2 box:
  var geneQuery = $('.geneMultipleSelection').select2('data').map(
                    geneInfo => geneInfo.text);
  var cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
                    cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  

  // Fetch RNA sequence data and display requested plots:
  var dataToPlotInfo = getExpressionDataJSONarray(cohortQuery, geneQuery);

  // Once data is returned, build the plots:
  dataToPlotInfo.then(function(data) {
    // Check that the fetch worked:
    if (data == 'Error: Invalid Input Fields for Query.') {
      document.getElementById('div0').classList.remove('loader');                      // Remove the loader.
      document.getElementById('svgViolinDiv0').classList.remove('loader');             // Remove the loader.
      showError('geneError');
      return;
    }
    
    // If the fetched worked, build the plots:

    // Display Warning for any invalid genes:
    var myGenesReturned = d3.map(data, function(d){return d.gene;}).keys();
    var emptyGeneArray = geneQuery.filter(function(gene) { if (!myGenesReturned.includes(gene)) { return gene} });
    if (emptyGeneArray.length > 0) {
      showWarning(emptyGeneArray)
    };

    // Set up the figure dimensions:
    var margin = {top: 80, right: 30, bottom: 30, left: 60},
        width = 1250 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    document.getElementById('div0').classList.remove('loader');                        // Remove the loader.
    document.getElementById('svgViolinDiv0').classList.remove('loader');               // Remove the loader.

    // Build the heatmap:
    // Append an svg object:
    var svgHeatMap = d3.select("#heatmapRef").append("svg")
        .attr("viewBox", `0 0 1250 500`)                                           // This line makes the svg responsive
        .attr("id", 'svgHeatMap')
        .append("g")
        .attr("transform",
            "translate(" + (margin.left) + "," + margin.top + ")");

    // Create the heatmap:
    createHeatmap('cohort', cohortQuery, data, svgHeatMap);

    // Build the violin plot:
    // Append an svg object:
    var svgViolinPlot = d3.select("#violinPlotRef").append("svg")
        .attr("viewBox", `0 0 1250 500`)                                           // This line makes the svg responsive
        .attr("id", 'svgViolinPlot')
        .append("g")
        .attr("transform",
            "translate(" + (margin.left-20) + "," + margin.top + ")");

    // Create the heatmap:
    createViolinPlot('cohort', cohortQuery, data, svgViolinPlot);

    // Box and Whisker Plot to be added below:

    /////////////////////////////////////////////////////////////////////////////////////
    // Below is dummy data to display an example box and whisker plot for the time being:
    /*
    var y0 = []
    var y1 = [];
    for (var i = 0; i < 50; i ++) {
      y0[i] = Math.random();
      y1[i] = Math.random() + 1;
    }
    var trace1 = {
      y: y0,
      type: 'box'
    };
    var trace2 = {
      y: y1,
      type: 'box'
    };
    var dataBoxPlot = [trace1, trace2];
    var layout = {
    title: 'd3 Gene Expression Box and Whisker Plot to Added Here'
    };
    Plotly.newPlot(divBoxWhisk0, dataBoxPlot, layout);
    // Above is dummy data to display an example box and whisker plot for the time being:
    */
    /////////////////////////////////////////////////////////////////////////////////////
  });
};