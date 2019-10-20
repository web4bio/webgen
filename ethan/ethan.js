// JS File for SBU WebGen

// Functions:

fetchData = async function(gene_param,cohort_param) {
  var queryJSON = {
      format: 'json',
      gene: gene_param,
      cohort: cohort_param,
      page: 1,
      page_size: 5000,
      sort_by: 'tcga_participant_barcode'
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';
  const result = await fetch(hosturl +'?'+endpointurl +'?' + jQuery.param(queryJSON));

  return result.json();
};


getExpressionList = async function (gene_list_param,cohort_list_param) {
  var TCGA_expression_list = [];

  for (var i = 0; i < cohort_list_param.length; i ++) {
    for (var j = 0; j < gene_list_param.length; j ++) {
      var queryResult = await fetchData(gene_list_param[j],cohort_list_param[i]);
      TCGA_expression_list.push(queryResult);
    };
  };

  return TCGA_expression_list;
}; 


getExpressionArray = function (array) {
  var expressionArray = [];
  for (var i = 0; i < array.length; i ++) {
    var expressionArrayTemp = array[i].mRNASeq.map(x => (Number.parseFloat(x.expression_log2).toPrecision(3)));
    expressionArray.push(expressionArrayTemp);
  };

  return expressionArray;
};


getCounts = function(array) {
  resultsArray = [];
  for (var i = 0; i <array.length; i ++) {  
    var resultsTemp = {};
      for (var j = 0; j < array[i].length; j ++) {
        var num = array[i][j];
        resultsTemp[num] = resultsTemp[num] ? resultsTemp[num] + 1 : 1;
      };
    resultsArray.push(resultsTemp);
  };
  
  return resultsArray
};


getDataToPlot = function(array, gene_list_param, cohort_list_param) {
  var dataToPlotArray = [];
  var layoutArray = [];

  var geneCohortComboList = [];
  for (var k = 0; k < cohort_list_param.length; k ++) {
    for (var h = 0; h < gene_list_param.length; h ++) {
      geneCohortComboList.push([gene_list_param[h], cohort_list_param[k]]);
    };
  };

  for (var i = 0; i < array.length; i ++) {  
    var gene = geneCohortComboList[i][0];
    var cohort = geneCohortComboList[i][1];
    
    var expressionLevels = Object.keys(array[i]);
    var countsTemp = [];
    for (var j = 0; j < expressionLevels.length; j ++) {
      var count = array[i][expressionLevels[j]];
      countsTemp.push(count); 
    };
    
    var dataToPlot = [
      {
      x: expressionLevels,
      y: countsTemp,
      type: 'bar'
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
  document.createElement('div');
  return [dataToPlotArray, layoutArray];
};


addElement = function(x) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute("id",x);
  newDiv.setAttribute("style","margin-top:50px"); 
  // add the newly created element and its content into the DOM 
  var currentDiv = document.getElementById("div0"); 
  document.body.appendChild(newDiv, currentDiv); 
}
