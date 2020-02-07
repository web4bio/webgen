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