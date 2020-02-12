// Written by Ethan for VIP WebGen Team

// This JS File contains the function ethan_getExpressionJSONarray. 
// To use this function, pass it the arguments: cohort_list_arg and gene_list_arg. 
// The ouput is an array of JSON objects containing the cohort, gene, and the cooresponding RNA Seq expression array. 
// Note: to use ethan_getExpressionJSONarray, you must set a variable equal to the result returned by the function,
// then use the .then(function(finalResult)) method to use the finalResult inside the Promise that is returned.

ethan_getExpressionJSONarray  = async function(cohort_list_arg, gene_list_arg) {
  var dataFetched = getExpressionList(cohort_list,gene_list);
  var result = [];
  result = dataFetched.then(function(TCGA_Expression) {
      var expressionJSONarray = getExpressionJSONarray(cohort_list_arg, gene_list_arg, TCGA_Expression);    
      return expressionJSONarray;
  });
  
  return await result;
};

// Below are the helper functions:

// fetchData is an asynchronous function fetching data from the GDC using Firebrowse and Jonas' herokuapp: 
fetchData = async function(cohort_param, gene_param) {
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
  
// getExpressionList is an asynchronous function that calls fetchData for all gene/cohort combinations for the 
// input gene and cohort list parameters:  
getExpressionList = async function(cohort_list_param, gene_list_param) {
  var TCGA_expression_list = [];
  
  for (var i = 0; i < cohort_list_param.length; i ++) {
    for (var j = 0; j < gene_list_param.length; j ++) {
      var queryResult = await fetchData(cohort_list_param[i], gene_list_param[j]);
      TCGA_expression_list.push(queryResult);
    };
  };
    
  return TCGA_expression_list;
}; 

// getExpressionArrayJSON is a function that returns a JSON of the gene, cohort, and expression arrays from the GDC:
getExpressionJSONarray = function(cohort_list_arg, gene_list_arg, array) {
  var expressionJSONarray = [];
    
  var geneCohortComboList = [];
  for (var k = 0; k < cohort_list_arg.length; k ++) {
      for (var h = 0; h < gene_list_arg.length; h ++) {
      geneCohortComboList.push([gene_list_arg[h], cohort_list_arg[k]]);
      };
  };
    
  for (var i = 0; i < array.length; i ++) {
    var expressionArrayTemp = array[i].mRNASeq.map(x => (Number.parseFloat(x.expression_log2)));
    var expressionObjectTemp = {
      cohort: geneCohortComboList[i][1],
      gene: geneCohortComboList[i][0],
      RNASeqExpressionArray: expressionArrayTemp,
    };
    expressionJSONarray.push(expressionObjectTemp);
  };

  return expressionJSONarray;
};