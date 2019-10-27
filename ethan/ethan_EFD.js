// JS File for SBU WebGen

// Master Function for Expression Frequency Distribution (EFD) Data to Plot:

ethan_getEFDdata = async function(cohort_list_arg, gene_list_arg) {
  var dataFetched = await getExpressionList(cohort_list_arg, gene_list_arg);
  var expressionArray = getExpressionArray(dataFetched);
  var dataToReturn = getDataToPlot(expressionArray, cohort_list_arg, gene_list_arg);
  return await dataToReturn;  
};


// Helper Functions:

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


getExpressionArray = function(array) {
  var expressionArray = [];
  for (var i = 0; i < array.length; i ++) {
    //var expressionArrayTemp = array[i].mRNASeq.map(x => (Number.parseFloat(x.expression_log2).toPrecision(3)));
    var expressionArrayTemp = array[i].mRNASeq.map(x => (Number.parseFloat(x.expression_log2)));
    expressionArray.push(expressionArrayTemp);
  };

  return expressionArray;
};


getDataToPlot = function(array, cohort_list_arg, gene_list_arg) {
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
    dataToPlotArray.push(dataToPlot);
  

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


addElement = function(newDivID, oldDivID) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:50px"); 
  // add the newly created element and its content into the DOM 
  var currentDiv = document.getElementById(oldDivID); 
  document.body.appendChild(newDiv, currentDiv); 
}
