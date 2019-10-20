// JS File

// Imports:
//jq = require("https://code.jquery.com/jquery-3.4.1.js");
//import {text} from "@jashkenas/inputs";
//Plotly = require("https://cdn.plot.ly/plotly-latest.min.js");

// Fetching Sample Data with Firebrowse:
var gene = 'GATA6';
var cohort = 'BRCA';

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

 getCounts = function(array) {
    var results = {};
    for (var i = 0; i < array.length; i ++) {
      var num = array[i];
      results[num] = results[num] ? results[num] + 1 : 1;
    }
    return results
  };

 getDataToPlot = function(array) {
    var expressionLevels = Object.keys(array);
    var counts = [];
    for (var i = 0; i < expressionLevels.length; i ++) {
      var count = array[expressionLevels[i]];
      counts.push(count); 
    };
    
    var dataToPlot = [
      {
      x: expressionLevels,
      y: counts,
      type: 'bar'
      }
    ];
    
    var layout = {
    title: {
      text:'Distribution of Expression Levels in '+cohort,
      font: {
        family: 'Courier New, monospace',
        size: 24
      },
      xref: 'paper',
      x: 0.05,
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
    return [dataToPlot, layout];
  };