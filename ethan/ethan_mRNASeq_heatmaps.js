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