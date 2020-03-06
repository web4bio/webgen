// Fetch requested GDC RNA-seq data (i.e., expression) from Firebrowse for particular [cohort] and [gene]:
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
      page_size: 2000 * cohortQuery.length * geneQuery.length,
      sort_by: 'tcga_participant_barcode' 
  };

  // Assemble a string by concatenating all fields and field values for endpoint url
    // .join() is used to concatenate multiple genes and/or cohorts, separated by commas
  const endpointurl_fieldsWithValues = 
      'format=' + endpointurl_presets.format + 
      '&gene=' + geneQuery.join() + 
      '&cohort=' + cohortQuery.join() + 
      '&protocol=' + endpointurl_presets.protocol +
      '&page=' + endpointurl_presets.page + 
      '&page_size=' + endpointurl_presets.page_size.toString() + 
      '&sort_by=' + endpointurl_presets.sort_by;

  // Fetch data from stitched api:
  const fetchedExpressionData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues);

  // Monitor the performance of the fetch:
  const fetchStart = performance.now();
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return fetchedExpressionData.json();

}