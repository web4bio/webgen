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
getClinicalDataJSONarray_bf = async function(barcodeQuery, fhQuery) {
    var dataFetched = await fetchClinicalData(barcodeQuery,fhQuery);
    // Remove the uppermost level of the data (cleaning)
    var results = dataFetched.clinical_FH;
    console.log(results)
    return await results;
  };