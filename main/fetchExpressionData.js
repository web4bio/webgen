// Function to fetch requested GDC RNA-seq data (i.e., expression) from Firebrowse for particular [cohort] and [gene]:

fetchExpressionData = async function(cohortQuery, geneQuery) {
  
  // Set up fields and host/endpoint urls:
  var queryJSON = {
      format: 'json',
      cohort: cohortQuery,
      gene: geneQuery,
      page: 1,
      page_size: 2000 * cohortQuery.length * geneQuery.length,
      sort_by: 'tcga_participant_barcode'                               // Allows order of individuals while sorting for cohort/gene sets later
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  // Querying multiple cohorts & genes at once:
  // .join() creates and returns a new string by concatenating all of the elements in an array (or an array-like object), 
  // separated by commas or a specified separator string
  var cohortQueryString = cohortQuery.join(); 
  var geneQueryString = geneQuery.join();
  var queryString = 'format=json&gene=' + geneQueryString + '&cohort=' + cohortQueryString + '&protocol=RSEM&page=' + 
  queryJSON.page.toString() + '&page_size=' + queryJSON.page_size.toString() + '&sort_by=' + queryJSON.sort_by;

  // Performing fetch:
  const result = await fetch(hosturl + '?' + endpointurl + '?' + queryString);

  // Monitoring the performance of the fetch:
  var fetchStart = performance.now();

  // Return performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return result.json();

}