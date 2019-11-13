// JS File for SBU WebGen

// Master Function for Expression Frequency Distribution (EFD) Data to Plot:

ethan_getEFDdata = async function(cohort_list_arg, gene_list_arg, plot_type, normalize) {
  var expressionArray = await getExpressionArray(cohort_list_arg, gene_list_arg);
  if (plot_type == 'histogram') {
    var dataToReturn = getDataToPlotForHistogram(expressionArray, cohort_list_arg, gene_list_arg);
  } else if (plot_type == 'heatmap' || plot_type == 'heatmap_norm') {
    var dataToReturn = getDataToPlotForHeatmap(expressionArray, cohort_list_arg, gene_list_arg, normalize);
  }
  return await dataToReturn;  
};


// Helper Functions:

// Async function to fetch requested RNA seq data from GDC with Firebrowse for particular cohort and gene:

fetchData = async function(cohort_list_arg, gene_list_arg) {
  var queryJSON = {
      format: 'json',
      gene: gene_list_arg,
      cohort: cohort_list_arg,
      page: 1,
      page_size: 5000,
      sort_by: 'cohort'
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  var cohortQueryString = cohort_list_arg.join('%2C%20');
  var geneQueryString = gene_list_arg.join('%2C');
  var queryString = 'format=json&gene='+geneQueryString+'&cohort='+cohortQueryString+'&protocol=RSEM&page='+ 
  queryJSON.page.toString()+'&page_size='+queryJSON.page_size.toString()+'&sort_by='+queryJSON.sort_by;

  const result = await fetch(hosturl +'?'+endpointurl +'?' + queryString);

  return result.json();
};


// Function to get the gene expression data into a more usable form:
getExpressionArray = async function(cohort_list_arg, gene_list_arg) {
  var expressionArray = [];
  
  var TCGA_expression_JSON = await fetchData(cohort_list_arg,gene_list_arg);
  var TCGA_expression_list = TCGA_expression_JSON.mRNASeq;
  

  var cohortGeneComboList = [];
  for (var k = 0; k < cohort_list_arg.length; k ++) {
    for (var h = 0; h < gene_list_arg.length; h ++) {
      cohortGeneComboList.push([cohort_list_arg[k], gene_list_arg[h]]);
    };
  };

  var filteredArray = [];
  for (var i = 0; i < cohortGeneComboList.length; i ++) {
    var filteredArrayTemp = TCGA_expression_list.filter(TCGA_expression => TCGA_expression.cohort === cohortGeneComboList[i][0]
      && TCGA_expression.gene === cohortGeneComboList[i][1]);
    filteredArray.push(filteredArrayTemp);
  };

  for (var i = 0; i < filteredArray.length; i ++) {
    var expressionArrayTemp = filteredArray[i].map(x => (Number.parseFloat(x.expression_log2)));
    expressionArray.push(expressionArrayTemp);
  };

  return expressionArray;
};

// Function to set up data to use for a Plotly Histagram for each cohort and gene combination:
getDataToPlotForHistogram = function(array, cohort_list_arg, gene_list_arg) {
  var dataToPlotArray = [];
  var layoutArray = [];

  var cohortGeneComboList = [];
  for (var k = 0; k < cohort_list_arg.length; k ++) {
    for (var h = 0; h < gene_list_arg.length; h ++) {
      cohortGeneComboList.push([cohort_list_arg[k], gene_list_arg[h]]);
    };
  };

  for (var i = 0; i < array.length; i ++) {  
    var cohort = cohortGeneComboList[i][0];
    var gene = cohortGeneComboList[i][1];
    var expressionLevels = array[i];

    var dataToPlot = [
      {
      x: expressionLevels,
      type: 'histogram'
      }
    ];
    dataToPlotArray.  push(dataToPlot);
  

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
getDataToPlotForHeatmap = function(array, cohort_list_arg, gene_list_arg, normalize) {
  var expressionValues = array;
  var xValues = cohort_list_arg;
  var yValues = gene_list_arg;
  var reversescaleValue = false;
  var colorscaleValue = [
    [0, '#3D9970'],
    [1, '#001f3f']
  ];

  if (normalize == true) {
    var expressionValuesNorm = [];
    for (i = 0; i < expressionValues.length; i++) {
      var expressionValuesNormTemp = array[i].map(x => x/Math.max(...array.map(x => Math.max(...x))));
      expressionValuesNorm.push(expressionValuesNormTemp);
    };

    var expressionValues = expressionValuesNorm;
    var colorscaleValue = 'Greens';
    var reversescaleValue = true;
  };

  var dataToPlot = [{
    x: xValues,
    y: yValues,
    z: expressionValues,
    type: 'heatmap',
    colorscale: colorscaleValue,
    reversescale: reversescaleValue,
    showscale: true
  }];

  var layout = [{
    title: 'Gene Expression Heat Map'
  }];

  return [[dataToPlot], [layout]];
};

// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// This function is useful for when you have a variable amount of plots to display on the page:
addElement = function(newDivID, oldDivID) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:50px"); 
  // add the newly created element and its content into the DOM 
  var currentDiv = document.getElementById(oldDivID); 
  document.getElementById(oldDivID).appendChild(newDiv); 
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
