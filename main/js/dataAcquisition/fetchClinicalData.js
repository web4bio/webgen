// Executes a fetch for the following Clinical-associated data from Firebrowse as a 1-D array, where each element of the array 
// is associated with a particular cohort-clinicalData pair. Selections of cohort and measurement/characteristic are made by the user.
// cohort
// date
// fh_cde_name
// tcga_participant_barcode

// Function to fetch expression data from firebrowse:
fetchClinicalData_bc = async function (barcodeQuery, clinicalQuery) {

    // Set up host and endpoint urls
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl = 'http://firebrowse.org/api/v1/Samples/Clinical_FH'; //sample remainder of URL is: ?format=json&cohort=PRAD&fh_cde_name=psa_value&page=1&page_size=250&sort_by=cohort

    console.log(barcodeQuery)
    console.log(barcodeQuery.join(","))
    console.log(clinicalQuery)
    console.log(clinicalQuery.join(","))

    // Set up endpoint url fields (except barcodes and clinical query) with preset values
    const endpointurl_presets = {
        format: 'json',
        tcga_participant_barcode: barcodeQuery.join(","),
        fh_cde_name: clinicalQuery.join(","),
        page: '1',
        page_size: 2000,
        sort_by: 'tcga_participant_barcode'
    };

    // Monitor the performance of the fetch:
    const fetchStart = performance.now();

    // Fetch data from stitched api:
    var fetchedClinicalData = await fetch(hosturl + '?' + endpointurl + '?' + jQuery.param(endpointurl_presets));

    // Monitor the performance of the fetch:
    var fetchTime = performance.now() - fetchStart;
    console.info("Performance of clinical data fetch: ");
    console.info(fetchTime);

    // Check if the fetch worked properly:
    if (fetchedClinicalData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedClinicalData.json();
    }

}

// Function to fetch expression data from firebrowse:
fetchClinicalData_cc = async function (cohortQuery, clinicalQuery) {

    // Set up host and endpoint urls
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl = 'http://firebrowse.org/api/v1/Samples/Clinical_FH'; //sample remainder of URL is: ?format=json&cohort=PRAD&fh_cde_name=psa_value&page=1&page_size=250&sort_by=cohort

    // Set up endpoint url fields (except cohort and clinical query) with preset values
    const endpointurl_presets = {
        format: 'json',
        cohort: cohortQuery.join(","),
        fh_cde_name: clinicalQuery.join(","),
        page: '1',
        page_size: 2000,
        sort_by: 'tcga_participant_barcode'
    };

    // Monitor the performance of the fetch:
    const fetchStart = performance.now();

    // Fetch data from stitched api:
    var fetchedClinicalData = await fetch(hosturl + '?' + endpointurl + '?' + jQuery.param(endpointurl_presets));

    // Monitor the performance of the fetch:
    var fetchTime = performance.now() - fetchStart;
    console.info("Performance of clinical data fetch: ");
    console.info(fetchTime);

    // Check if the fetch worked properly:
    if (fetchedClinicalData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedClinicalData.json();
    }

}