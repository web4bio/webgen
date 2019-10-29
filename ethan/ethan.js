// JS File for SBU WebGen

// Master Function for Expression Frequency Distribution (EFD) Data to Plot:

ethan_getEFDdata = async function(cohort_list_arg, gene_list_arg, plot_type) {
  var dataFetched = await getExpressionList(cohort_list_arg, gene_list_arg);
  var expressionArray = getExpressionArray(dataFetched);
  if (plot_type == 'histogram') {
    var dataToReturn = getDataToPlotForHistogram(expressionArray, cohort_list_arg, gene_list_arg);
  } else if (plot_type == 'heatmap') {
    var dataToReturn = getDataToPlotForHeatmap(expressionArray, cohort_list_arg, gene_list_arg);
  }
  return await dataToReturn;  
};


// Helper Functions:

// Async function to fetch requested RNA seq data from GDC with Firebrowse for particular cohort and gene:
fetchData = async function(cohort_arg, gene_arg) {
  var queryJSON = {
      format: 'json',
      gene: gene_arg,
      cohort: cohort_arg,
      page: 1,
      page_size: 5000,
      sort_by: 'tcga_participant_barcode'
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';
  const result = await fetch(hosturl +'?'+endpointurl +'?' + jQuery.param(queryJSON));

  return result.json();
};

// Function to get the RNA seq data for each cohort/gene combination between a list of cohorts and a list of genes:
getExpressionList = async function (cohort_list_arg, gene_list_arg) {
  var TCGA_expression_list = [];

  for (var i = 0; i < cohort_list_arg.length; i ++) {
    for (var j = 0; j < gene_list_arg.length; j ++) {
      var queryResult = await fetchData(cohort_list_arg[i], gene_list_arg[j]);
      TCGA_expression_list.push(queryResult);
    };
  };

  return TCGA_expression_list;
}; 

// Function to get the gene expression data into a more usable form:
getExpressionArray = function(array) {
  var expressionArray = [];
  for (var i = 0; i < array.length; i ++) {
    var expressionArrayTemp = array[i].mRNASeq.map(x => (Number.parseFloat(x.expression_log2)));
    expressionArray.push(expressionArrayTemp);
  };

  return expressionArray;
};

// Function to set up data to use for a Plotly Histagram for each cohort and gene combination:
getDataToPlotForHistogram = function(array, cohort_list_arg, gene_list_arg) {
  var dataToPlotArray = [];
  var layoutArray = [];

  var geneCohortComboList = [];
  for (var k = 0; k < cohort_list_arg.length; k ++) {
    for (var h = 0; h < gene_list_arg.length; h ++) {
      geneCohortComboList.push([gene_list_arg[h], cohort_list_arg[k]]);
    };
  };

  for (var i = 0; i < array.length; i ++) {  
    var gene = geneCohortComboList[i][0];
    var cohort = geneCohortComboList[i][1];
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
getDataToPlotForHeatmap = function(array, cohort_list_arg, gene_list_arg) {
  var expressionValues = array;
  var xValues = cohort_list_arg;
  var yValues = gene_list_arg;

  var colorscaleValue = [
    [0, '#3D9970'],
    [1, '#001f3f']
  ];
  
  var dataToPlot = [{
    x: xValues,
    y: yValues,
    z: expressionValues,
    type: 'heatmap',
    colorscale: 'colorscaleValue',
    showscale: true
  }];

  var layout = [{
    title: 'Gene Expression Heat Map'
  }];

  return [[dataToPlot], layout];
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