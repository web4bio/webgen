// Function to fetch expression data from firebrowse:
const fetchClinicalData_cc = async function(cohortQuery, clinicalQuery) {
  const params = {
    format: 'json',
    cohort: cohortQuery.join(","),
    fh_cde_name: clinicalQuery.join(","),
    page: '1',
    page_size: 2000,
    sort_by: 'tcga_participant_barcode'
  };
  // Monitor the performance of the fetch:
  const fetchStart = performance.now();
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params);
  // Monitor the performance of the fetch:
  const fetchTime = performance.now() - fetchStart;
  console.info(`Performance of clinical data fetch: ${fetchTime} ms`);
  return data;
}

// Function to fetch expression data from firebrowse, no clinical features specified:
const fetchClinicalData_b = async function(barcodeQuery) {
  const params = {
    format: 'json',
    tcga_participant_barcode: barcodeQuery.join(","),
    //fh_cde_name: clinicalQuery.join(","),
    page: '1',
    page_size: 2000,
    sort_by: 'tcga_participant_barcode'
  };
  // Monitor the performance of the fetch:
  const fetchStart = performance.now();
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params);
  // Monitor the performance of the fetch:
  const fetchTime = performance.now() - fetchStart;
  console.info(`Performance of clinical data fetch: ${fetchTime} ms`);
  // Check if the fetch worked properly:
  return data;
}

// Function to fetch expression data from firebrowse, no clinical features specified:
const fetchClinicalData_c = async function(cohortQuery) {
  const params = {
    format: 'json',
    cohort: cohortQuery.join(","),
    //fh_cde_name: clinicalQuery.join(","),
    page: '1',
    page_size: 2000,
    sort_by: 'tcga_participant_barcode'
  };
  // Monitor the performance of the fetch:
  const fetchStart = performance.now();
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params);
  // Monitor the performance of the fetch:
  const fetchTime = performance.now() - fetchStart;
  console.info(`Performance of clinical data fetch: ${fetchTime} ms`);
  // Check if the fetch worked properly:
  return data;
}
