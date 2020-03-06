// Written by Ethan for VIP WebGen Team

// This JS File contains the function getExpressionDataJSONarray. 
// To use this function, pass it the arguments: cohortQuery and geneQuery. 
// The ouput is an array of JSON objects of the form:
/*
    {
      "cohort": string,
      "expression_log2": float,
      "gene": string,
      "geneID": int,
      "protocol": string,
      "sample_type": string,
      "tcga_participant_barcode": string,
      "z-score": float 
    }
*/
// Going forward, this array of JSONs will likely be the best data structure to use for plotting with d3
// The array is also sorted by tcga_participant_barcode, which can be thought of as an index for plotting and for 
// merging this data with other data types (such as mutation data) later on.

// Note: to use getExpressionDataJSONarray, you must set a variable equal to the result returned by the function,
// then use the .then(function(finalResult)) method to use the finalResult inside the Promise that is returned.

getExpressionDataJSONarray  = async function(cohortQuery, geneQuery) {
  var dataFetched = await fetchExpressionData(cohortQuery,geneQuery);
  var results = dataFetched.mRNASeq;

  return await results;
};

// Below are the helper functions:

fetchExpressionData = async function(cohortQuery, geneQuery) {
  // Set up query:
  var queryJSON = {
      format: 'json',
      gene: geneQuery,
      cohort: cohortQuery,
      page: 1,
      page_size: 2001,                                              // The max page_size is 2000, setting page_size=2001 sends all data to one page.
      sort_by: 'tcga_participant_barcode'                           // Allows order of individuals while sorting for cohort/gene sets later
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  // The code below is specific for mRNA Seq data and allows for querying multiple cohorts & genes at once.
  var cohortQueryString = cohortQuery.join('%2C%20');
  var geneQueryString = geneQuery.join('%2C');
  var queryString = 'format=json&gene='+geneQueryString+'&cohort='+cohortQueryString+'&protocol=RSEM&page='+ 
  queryJSON.page.toString()+'&page_size='+queryJSON.page_size.toString()+'&sort_by='+queryJSON.sort_by;

  // Monitor the perfomance of the fetch:
  var fetchStart = performance.now();

  // Perform fetch:
  const result = await fetch(hosturl +'?'+endpointurl +'?' + queryString);

  // Return performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return result.json();
};