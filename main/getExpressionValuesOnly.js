// Returns a 2-D array, where each element in the first (outer) level of the array is a cohort-gene pair, and each 
// element in the second (inner) level of the array is an expression_log2 value. 
// Information about genes that have missing mRNA-Seq data is also returned.
  // NOTE: This function will likely not be usef much if at all for future functionalities and 
  //       The getExpressionDataJSONarray.js function is preferable 

// Function to get only the expression values in a nested array with no other data attached:
getExpressionValuesOnly = async function(cohortQuery, geneQuery) {

  // expressionDataTemp is a 1-D array where each element provides data for a cohort-gene pair for a tcga_participant
  var expressionDataTemp = await getAllExpressionData(cohortQuery, geneQuery);

      // Check if expressionData contains data:
      if (expressionDataTemp == '')
        return ['Error: Invalid Input for Cohort and/or Query.', 0];

  // Remove the unecessary uppermost layer of the data
  var expressionData = expressionDataTemp.mRNASeq;

  // Construct a 2-D array of all pairs of cohort and gene
  // e.g., [cohortQuery[0], geneQuery[0]], [cohortQuery[0], geneQuery[1]], ...]
  var cohortGenePairs = [];
  for (var i = 0; i < cohortQuery.length; i++)
    for (var j = 0; j < geneQuery.length; j++)
      cohortGenePairs.push([cohortQuery[i], geneQuery[j]]);

  // Create sortedExpressionData, in which the outer array is cohort-gene pairs, and the inner array is patients
  var sortedExpressionData = [];
  var emptyGenesArray = [];
  for (var i = 0; i < cohortGenePairs.length; i++) {
    var sortedExpressionDataTemp = expressionData.filter(patient => patient.cohort === cohortGenePairs[i][0] &&
                                                                   patient.gene === cohortGenePairs[i][1]);
    // Check for any empty gene field results
    if (sortedExpressionDataTemp.length == 0)
      emptyGenesArray.push(cohortGenePairs[i][1]);
    else
      sortedExpressionData.push(sortedExpressionDataTemp);
  };

  // Extract expression_log2 values from sortedExpressionData and store in expressionValuesOnly
  var expressionValuesOnly = [];
  for (var i = 0; i < sortedExpressionData.length; i++) {
    var expressionArrayTemp = sortedExpressionData[i].map(x => (Number.parseFloat(x.expression_log2)));
    expressionValuesOnly.push(expressionArrayTemp);
  };

  // Display warning for missing genes
  var emptyGenesArrayDeduped = [...new Set(emptyGenesArray)];
  if (emptyGenesArrayDeduped.length != 0) {
    document.getElementById('div0').classList.remove('loader');                              // Remove the loader.
    showWarning(emptyGenesArrayDeduped);
  }

  // As a reminder, expressionValuesOnly is sorted by cohort-gene pair
  return [expressionValuesOnly, emptyGenesArrayDeduped];
};