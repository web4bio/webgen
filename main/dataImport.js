// Function to fetch requested GDC RNA-seq data (i.e., expression) from Firebrowse for particular [cohort] and [gene]:

fetchExpressionData = async function(cohort_list_arg, gene_list_arg) {
  // Set up query:
  var queryJSON = {
      format: 'json',
      cohort: cohort_list_arg,
      gene: gene_list_arg,
      page: 1,
      page_size: 2000 * cohort_list_arg.length * gene_list_arg.length,
      sort_by: 'tcga_participant_barcode'                               // Allows order of individuals while sorting for cohort/gene sets later
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  // The code below is specific for expression data, and allows for querying multiple cohorts & genes at once.
  var cohortQueryString = cohort_list_arg.join('%2C%20');
  var geneQueryString = gene_list_arg.join('%2C');
  var queryString = 'format=json&gene=' + geneQueryString + '&cohort=' + cohortQueryString + '&protocol=RSEM&page=' + 
  queryJSON.page.toString() + '&page_size=' + queryJSON.page_size.toString() + '&sort_by=' + queryJSON.sort_by;

  // Performing8 fetch:
  const result = await fetch(hosturl + '?' + endpointurl + '?' + queryString);

  // Monitoring the performance of the fetch:
  var fetchStart = performance.now();

  // Return performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return result.json();

}