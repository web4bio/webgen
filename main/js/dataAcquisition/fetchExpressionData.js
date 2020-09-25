// Executes a fetch for the following mRNASeq-associated data from Firebrowse as a 1-D array, where each element of the array 
// is associated with a particular cohort-gene pair. Selections of cohort and gene are made by the user.
    // cohort
    // expression_log2
    // gene
    // geneID
    // protocol
    // sample_type
    // tcga_participant_barcode
    // z-score

// Function to fetch expression data from firebrowse:
fetchExpressionData = async function(cohortQuery, geneQuery) {
  
  // Set up host and endpoint urls
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';
  
  // Set up endpoint url fields (except cohort and gene) with preset values
  const endpointurl_presets = {
      format: 'json',
      gene: geneQuery,
      cohort: cohortQuery,     
      protocol: 'RSEM',
      page: '1',
      page_size: 2001,
      sort_by: 'tcga_participant_barcode' 
  };

  // Assemble a string by concatenating all fields and field values for endpoint url
  const endpointurl_fieldsWithValues = 
      'format=' + endpointurl_presets.format + 
      '&gene=' + geneQuery + 
      '&cohort=' + cohortQuery + 
      '&protocol=' + endpointurl_presets.protocol +
      '&page=' + endpointurl_presets.page + 
      '&page_size=' + endpointurl_presets.page_size.toString() + 
      '&sort_by=' + endpointurl_presets.sort_by;

    
  // Monitor the performance of the fetch:
  const fetchStart = performance.now();

  // Fetch data from stitched api:
  var fetchedExpressionData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues);

  // Monitor the performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  // Check if the fetch worked properly:
  if (fetchedExpressionData == '')
      return ['Error: Invalid Input Fields for Query.', 0];
  else {
      return fetchedExpressionData.json();
  }

}