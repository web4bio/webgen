// Async function to fetch requested RNA seq data from GDC with Firebrowse for particular cohort and gene:

fetchmRNASeqData = async function(cohort_list_arg, gene_list_arg) {
  // Set up query:
  var queryJSON = {
      format: 'json',
      gene: gene_list_arg,
      cohort: cohort_list_arg,
      page: 1,
      page_size: 2000*cohort_list_arg.length*gene_list_arg.length,
      sort_by: 'tcga_participant_barcode'                           // Allows order of individuals while sorting for cohort/gene sets later
  };
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Samples/mRNASeq';

  // The code below is specific for mRNA Seq data and allows for querying multiple cohorts & genes at once.
  var cohortQueryString = cohort_list_arg.join('%2C%20');
  var geneQueryString = gene_list_arg.join('%2C');
  var queryString = 'format=json&gene='+geneQueryString+'&cohort='+cohortQueryString+'&protocol=RSEM&page='+ 
  queryJSON.page.toString()+'&page_size='+queryJSON.page_size.toString()+'&sort_by='+queryJSON.sort_by;

  // The code below monitors the perfomance of the fetch:
  var fetchStart = performance.now();

  // Perform fetch:
  const result = await fetch(hosturl +'?'+endpointurl +'?' + queryString);

  // Return performance of the fetch:
  var fetchTime = performance.now() - fetchStart;
  console.log("Performance of fetch: ");
  console.log(fetchTime);

  return result.json();
};


// Function to get the gene expression data into a more usable form:
getExpressionArray = async function(cohort_list_arg, gene_list_arg) {
  // Initialize result to return:
  var expressionArray = [];
  
  // Run the fetch:
  var TCGA_expression_JSON = await fetchmRNASeqData(cohort_list_arg,gene_list_arg);

  // Check the fetched worked properly:
  if (TCGA_expression_JSON == '') {
    return ['Error: Invalid Input Fields for Query.', 0];
  };

  // If the fetched worked properly, continue:
  var TCGA_expression_list = TCGA_expression_JSON.mRNASeq;

  // Build a list of all cohort and gene combinations:
  var cohortGeneComboList = [];
  var numCohorts = cohort_list_arg.length;
  var numGenes = gene_list_arg.length;
  for (var k = 0; k < numCohorts; k ++) {
    for (var h = 0; h < numGenes; h ++) {
      cohortGeneComboList.push([cohort_list_arg[k], gene_list_arg[h]]);
    };
  };

  // Filter the TCGA expression list to align with each cohort:gene combo in the comboList.
  var filteredArray = [];
  var emptyGenesArray = [];
  var comboListLength = cohortGeneComboList.length;
  for (var i = 0; i < comboListLength; i ++) {
    var filteredArrayTemp = TCGA_expression_list.filter(TCGA_expression => TCGA_expression.cohort === cohortGeneComboList[i][0]
      && TCGA_expression.gene === cohortGeneComboList[i][1]);
    
      // Check for any empy gene field results:
      if (filteredArrayTemp.length == 0) {
        emptyGenesArray.push(cohortGeneComboList[i][1]);
      } else {
        filteredArray.push(filteredArrayTemp);
      };
  };

  // Extract the mRNA Seq values from the data:
  var filteredArrayLength = filteredArray.length;
  for (var i = 0; i < filteredArrayLength; i ++) {
    var expressionArrayTemp = filteredArray[i].map(x => (Number.parseFloat(x.expression_log2)));
    expressionArray.push(expressionArrayTemp);
  };

  // Display warning for missing genes:
  var emptyGenesArrayDeduped = [...new Set(emptyGenesArray)];
  if (emptyGenesArrayDeduped.length != 0) {
    document.getElementById('div0').classList.remove('loader');                        // Remove the loader.
    showWarning(emptyGenesArrayDeduped);
  }

  return [expressionArray, emptyGenesArrayDeduped];
};