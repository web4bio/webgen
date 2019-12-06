// JS File for SBU WebGen

// NOTE: The fetch and the normalized heatmap function are the bottlenecks of the JS.
// NOTE: Ran the same fetch directly on Firebrowse and it took 50%-100% the time it took for this fetch call.
// NOTE: This likely means the site can't get too fast since Firebrowse will be a bottleneck.

// Master Function for Expression Frequency Distribution (EFD) Data to Plot:

ethan_getEFDdata = async function(cohort_list_arg, gene_list_arg) {
  // Getting mRNA-Seq data from GDC:
  var expressionArrayResults = await getExpressionArray(cohort_list_arg, gene_list_arg);
  var expressionArray = expressionArrayResults[0];
  var emptyGenesArray = expressionArrayResults[1];

  // Check that the fetch worked properly:
  if (expressionArray == 'Error: Invalid Input Fields for Query.') {
    return expressionArray;
  };

  // Remove any genes with no mRNA-Seq results:
  var gene_list_arg = gene_list_arg.filter(gene => emptyGenesArray.includes(gene) == false);

  // Get results to plot the heatmap:
  var heatmapVar = getDataToPlotForHeatmap(expressionArray, cohort_list_arg, gene_list_arg);
  var dataToReturn = heatmapVar[0];
  var layoutToReturn = heatmapVar[1];

  // Get results to plot the normalized heatmap:
  var normHeatmapVar = getDataToPlotForNormalizedAverageHeatmap(expressionArray, cohort_list_arg, gene_list_arg);
  dataToReturn.push(normHeatmapVar[0]);
  layoutToReturn.push(normHeatmapVar[1]);

  // Get results to plot the histograms:
  var histogramVar = getDataToPlotForHistogram(expressionArray, cohort_list_arg, gene_list_arg);
  var histogramVarLength = histogramVar[0].length;
  for (var i = 0; i < histogramVarLength; i++) {
    dataToReturn.push(histogramVar[0][i]);
    layoutToReturn.push(histogramVar[1][i]);
  };

  var resultsToReturn = [dataToReturn, layoutToReturn, emptyGenesArray];
  return resultsToReturn;  
};


// Helper Functions:

// Async function to fetch requested RNA seq data from GDC with Firebrowse for particular cohort and gene:

fetchData = async function(cohort_list_arg, gene_list_arg) {
  // Set up query:
  var queryJSON = {
      format: 'json',
      gene: gene_list_arg,
      cohort: cohort_list_arg,
      page: 1,
      page_size: 2000*cohort_list_arg.length*gene_list_arg.length,
      sort_by: 'tcga_participant_barcode'                           // Allows order of individuals while sorting for cohort/gene sets later
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  // The code below is specific for mRNA Seq data and allows for querying multiple cohorts & genes at once.
  var cohortQueryString = cohort_list_arg.join('%2C%20');
  var geneQueryString = gene_list_arg.join('%2C');
  var queryString = 'format=json&gene='+geneQueryString+'&cohort='+cohortQueryString+'&protocol=RSEM&page='+ 
  queryJSON.page.toString()+'&page_size='+queryJSON.page_size.toString()+'&sort_by='+queryJSON.sort_by;

  // The code below monitors the perfomance of the fetch:
  var fetchStart = performance.now();

  // Perform fetch:
  const result = await fetch(hosturl +'?'+endpointurl +'?' + queryString);

  // Return performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return result.json();
};


// Function to get the gene expression data into a more usable form:
getExpressionArray = async function(cohort_list_arg, gene_list_arg) {
  // Initialize result to return:
  var expressionArray = [];
  
  // Run the fetch:
  var TCGA_expression_JSON = await fetchData(cohort_list_arg,gene_list_arg);

  // Check the fetched worked properly:
  if (TCGA_expression_JSON == '') {
    return ['Error: Invalid Input Fields for Query.', 0];
  };

  // If the fetched worked properly, continue:
  var TCGA_expression_list = TCGA_expression_JSON.mRNASeq;

  // Build a list of all cohort and gene combinations:
  var cohortGeneComboList = [];
  var numCohorts = cohort_list_arg.length;
  var numGenes = gene_list_arg.length;
  for (var k = 0; k < numCohorts; k ++) {
    for (var h = 0; h < numGenes; h ++) {
      cohortGeneComboList.push([cohort_list_arg[k], gene_list_arg[h]]);
    };
  };

  // Filter the TCGA expression list to align with each cohort:gene combo in the comboList.
  var filteredArray = [];
  var emptyGenesArray = [];
  var comboListLength = cohortGeneComboList.length;
  for (var i = 0; i < comboListLength; i ++) {
    var filteredArrayTemp = TCGA_expression_list.filter(TCGA_expression => TCGA_expression.cohort === cohortGeneComboList[i][0]
      && TCGA_expression.gene === cohortGeneComboList[i][1]);
    
      // Check for any empy gene field results:
      if (filteredArrayTemp.length == 0) {
        emptyGenesArray.push(cohortGeneComboList[i][1]);
      } else {
        filteredArray.push(filteredArrayTemp);
      };
  };

  // Extract the mRNA Seq values from the data:
  var filteredArrayLength = filteredArray.length;
  for (var i = 0; i < filteredArrayLength; i ++) {
    var expressionArrayTemp = filteredArray[i].map(x => (Number.parseFloat(x.expression_log2)));
    expressionArray.push(expressionArrayTemp);
  };

  // Display warning for missing genes:
  var emptyGenesArrayDeduped = [...new Set(emptyGenesArray)];
  if (emptyGenesArrayDeduped.length != 0) {
    document.getElementById('div0').classList.remove('loader');                        // Remove the loader.
    showWarning(emptyGenesArrayDeduped);
  }

  return [expressionArray, emptyGenesArrayDeduped];
};


// Function to set up data to use for a Plotly Histagram for each cohort and gene combination:
getDataToPlotForHistogram = function(array, cohort_list_arg, gene_list_arg) {
  // Initialize results to return:
  var dataToPlotArray = [];
  var layoutArray = [];

  // Build a list of all cohort and gene combinations:
  var cohortGeneComboList = [];
  var numCohorts = cohort_list_arg.length;
  var numGenes = gene_list_arg.length;
  for (var k = 0; k < numCohorts; k ++) {
    for (var h = 0; h < numGenes; h ++) {
      cohortGeneComboList.push([cohort_list_arg[k], gene_list_arg[h]]);
    };
  };

  // Builid a histogram for each cohort:gene combination:
  var arrayLength = array.length
  for (var i = 0; i < arrayLength; i ++) {  
    
    // Set the temporary cohort, gene, and expressionLevels array values:
    var cohort = cohortGeneComboList[i][0];
    var gene = cohortGeneComboList[i][1];
    var expressionLevels = array[i];

    // Set histogram data to plot:
    var dataToPlot = [
      {
      x: expressionLevels,
      type: 'histogram'
      }
    ];
    dataToPlotArray.push(dataToPlot);
  
    // Set histogram layout:
    var layoutTemp = {  
      title: {
        text:'Distribution of Expression Levels in '+cohort,
        font: {
          family: 'Courier New, monospace',
          size: 24
        },
        xref: 'paper',
        x: 2,
      },
      xaxis: {
        title: {
          text: gene+' Expression Level',
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f'
          }
        },
      },
      yaxis: {
        title: {
          text: 'Frequency',
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f'
          }
        }
      }
    };
    layoutArray.push(layoutTemp);
  };
  return [dataToPlotArray, layoutArray];
};


// Function to set up data to plot a heat map for RNA Seq expression for the cohort and gene lists:
getDataToPlotForHeatmap = function(array, cohort_list_arg, gene_list_arg) {
  // Create a heatmap for each cohort:  

  // Get number of cohorts and number of genes:
  var numCohorts = cohort_list_arg.length;
  var numGenes = gene_list_arg.length;

  // Initialize results to return:
  var dataToPlotArray = [];
  var layoutArray = [];

  // Set colorscaleValue to be used later if you want to change the colorsccale.
  var colorscaleValue = [
    [0, '#3D9970'],
    [1, '#001f3f']
  ];

  // Iterate over the number of cohorts:
  for (var i = 0; i < numCohorts; i++) {

    // Build an expression array for each cohort, containing the expression values of all genes given:
    var expressionValuesTemp = [];
    for (var j = 0; j < numGenes; j++){
      expressionValuesTemp.push(array[j + i*numGenes]);                                   // z must have dimension: numPatients-by-numGenes
    };

    // Buiild heatmap of gene expression values for all patients in the cohort:
    var dataToPlotTemp = [{
      y: gene_list_arg,
      z: expressionValuesTemp,
      type: 'heatmap',
      colorscale: 'RdBu',
      showscale: true
    }];
    
    // Set heatmap layout:
    var layoutTemp = {
      title: {
        text:'Gene Expression Heatmap for '+cohort_list_arg[i],
        font: {
          family: 'Courier New, monospace',
          size: 24
        },
        xref: 'paper',
        x: 2,
      },
    };

    dataToPlotArray.push(dataToPlotTemp);
    layoutArray.push(layoutTemp);
  };

  return [dataToPlotArray, layoutArray];
};


// Function to set up data to plot a normalized heat map for RNA Seq expression for the cohort and gene lists:
getDataToPlotForNormalizedAverageHeatmap = function(array, cohort_list_arg, gene_list_arg) {
  // Averaging function:
  let Average = arr => arr.reduce((a,b) => a+b,0)/arr.length;
  
  // Initialize Variables:
  var expressionValues = array;
  var xValues = cohort_list_arg;
  var yValues = gene_list_arg;
  
  // Normalize all expression values after averaging:
  var expressionValuesNorm = [];
  var numValues = expressionValues.length;
  var arrayAve = [];
  for (var i = 0; i < numValues; i++) {
    var arrayCleaned = array[i].filter(Boolean);                                           // Filter out NaN values
    var tempAve = Average(arrayCleaned);                                                   // Averaging Step
    arrayAve.push(tempAve);
  };
  var expressionValuesNorm = arrayAve.map(x => x/Math.max(...arrayAve));                   // Normalization Step

  // Set up expression values to fit the format of the heatmap:
  var expressionValuesToPlot = [];
  var numCohorts = cohort_list_arg.length;
  var numGenes = gene_list_arg.length;
  for (var j = 0; j < numGenes; j++) {
    var tempRow = [];
    for (var k = 0; k < numCohorts; k++) {
      tempRow.push(expressionValuesNorm[j + numGenes*k]);                                  // z must have dimension: numCohorts-by-numGenes
    };
    expressionValuesToPlot.push(tempRow);
  };

  // Builid heatmap from data:
  var colorscaleValue = 'Greens';                                                          // Can change colorscale value here
  var dataToPlot = [{
    x: xValues,
    y: yValues,
    z: expressionValuesToPlot,
    type: 'heatmap',
    colorscale: colorscaleValue,
    reversescale: true,
    showscale: true
  }];

  // Set up heatmap layout:
  var layout = {
    title: {
      text:'Normalized Average Gene Expression Heatmap',
      font: {
        family: 'Courier New, monospace',
        size: 24
      },
      xref: 'paper',
      x: 2,
    },
  };

  return [dataToPlot, layout];
};


// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// This function is useful for when you have a variable amount of plots to display on the page:
addElement = function(newDivID, oldDivID) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:25px"); 
  
  // add the newly created element and its content into the DOM 
  document.getElementById(oldDivID).after(newDiv); 
}


// This function will remove the current div elements if they exist:
removeElements = function() {
  var i = 1;
  var continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div"+i);
    if(divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      var continueBool = false;
    };
  };
};


// This functino is to display the error message:
showError = function(errorType) {
  // Create div1 and set it to be alert class:
  addElement('div1','div0');
  var divElement = document.getElementById('div1');
  divElement.className = 'alert';

  // Create span clone from span0 to add to div1:
  var span = document.getElementById('span0');
  var spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Add the error message to the div:
  if (errorType == 'geneError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Gene Fields for Query";
  } else if (errorType == 'cohortError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Cohort Fields for Query";
  };
};


// This function displays a warning for genes that don't have mRNA-Seq data:
showWarning = function(emptyGeneArray_arg) {
  // Create div1 and set it to be warning class:
  //addElement('div1','div0');
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


// This function checks that the user input cohort list is valid:
checkCohortList = function(cohort_list_arg) {
  // List of valid cohorts:
  var validCohortList = ['ACC','BLCA','BRCA','CESC','CHOL','COAD','COADREAD','DLBC','ESCA','FPPP','GBM','GBMLGG','HNSC',
                         'KICH','KIPAN','KIRC','KIRP','LAML','LGG','LIHC','LUAD','LUSC','MESO','OV','PAAD','PCPG','PRAD',
                         'READ','SARC','SKCM','STAD','STES','TGCT','THCA','THYM','UCEC','UCS','UVM'];

  // Check the cohort list:
  numCohorts = cohort_list_arg.length;
  for (var i = 0; i < numCohorts; i++) {
    var statusTemp = validCohortList.includes(cohort_list_arg[i]);
    if (statusTemp == false) {
      return false;
    };
  };

  return true;
};