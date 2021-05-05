// Written by Luke for VIP WebGen Team

// This JS File contains the function getClinicalDataJSONarray. 
// To use this function, pass it the arguments: cohortQuery and geneQuery. 
// The ouput is an array of JSON objects of the form:
/*
    {
        // cohort: string
        // date: string
        // fh_cde_name: variable, can be string or float depending on queried info
        // tcga_participant_barcode: string
    }
*/
// Going forward, this array of JSONs will likely be the best data structure to use for plotting with d3
// The array is also sorted by tcga_participant_barcode, which can be thought of as an index for plotting and for 
// merging this data with other data types (such as Clinical or mutation data) later on.

// Note: to use getClinicalDataJSONarray, you must set a variable equal to the result returned by the function,
// then use the .then(function(finalResult)) method to use the finalResult inside the Promise that is returned.

// Function that calls fetchClinicalData and returns the useful format of the data:
// Only queries by barcodes preselected from dropdown

// getClinicalDataJSONarray_bc = async function (barcodeQuery, clinicalQuery) {
//   var dataFetched = await fetchClinicalData_bc(barcodeQuery, clinicalQuery);
//   // Remove the uppermost level of the data (cleaning)
//   var results = dataFetched.Clinical_FH;
//   console.log(results)
//   return await results;
// };

getClinicalDataJSONarray_cc = async function (cohortQuery, clinicalQuery) {
  var dataFetched = await fetchClinicalData_cc(cohortQuery, clinicalQuery);
  // Remove the uppermost level of the data (cleaning)
  var results = dataFetched.Clinical_FH;
  console.log(results)
  return await results;
};

// functions to just query all of clinical data (don't specify any clinical feature) for cohort or barcodes
getClinicalDataJSONarray_b = async function (barcodeQuery) {
  var dataFetched = await fetchClinicalData_b(barcodeQuery);
  // Remove the uppermost level of the data (cleaning)
  var results = dataFetched.Clinical_FH;
  console.log(results)
  return await results;
};

getClinicalDataJSONarray_c = async function (cohortQuery) {
  var dataFetched = await fetchClinicalData_c(cohortQuery);
  // Remove the uppermost level of the data (cleaning)
  var results = dataFetched.Clinical_FH;
  console.log(results)
  return await results;
};