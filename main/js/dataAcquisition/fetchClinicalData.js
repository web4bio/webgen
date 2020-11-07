// Executes a fetch for the following Clinical-associated data from Firebrowse as a 1-D array, where each element of the array 
// is associated with a particular cohort-clinicalData pair. Selections of cohort and measurement/characteristic are made by the user.
    // cohort
    // date
    // fh_cde_name
    // tcga_participant_barcode

// Function to fetch expression data from firebrowse:

dataAcquisition = {}

dataAcquisition.fetchClinicalData = async function(barcodeQuery, fhQuery) {
  
    // Set up host and endpoint urls
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Samples/Clinical_FH'; //sample remainder of URL is: ?format=json&cohort=PRAD&fh_cde_name=psa_value&page=1&page_size=250&sort_by=cohort
    
    // Set up endpoint url fields (except cohort and gene) with preset values
    const endpointurl_presets = {
        format: 'json',
        tcga_participant_barcode: barcodeQuery,
        fh_cde_name: fhQuery,     
        page: '1',
        page_size: 2001,
        sort_by: 'tcga_participant_barcode' 
    };
  
    // Assemble a string by concatenating all fields and field values for endpoint url
    const endpointurl_fieldsWithValues = 
        'format=' + endpointurl_presets.format +
        '&tcga_participant_barcode=' + barcodeQuery + 
        '&fh_cde_name=' + fhQuery + 
        '&page=' + endpointurl_presets.page + 
        '&page_size=' + endpointurl_presets.page_size.toString() + 
        '&sort_by=' + endpointurl_presets.sort_by;
  
    // Monitor the performance of the fetch:
    const fetchStart = performance.now();
  
    // Fetch data from stitched api:
    var fetchedClinicalData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues);
  
    // Monitor the performance of the fetch:
    var fetchTime = performance.now() - fetchStart;
    console.info("Performance of fetch: ");
    console.info(fetchTime);
  
    // Check if the fetch worked properly:
    if (fetchedClinicalData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedClinicalData.json();
    }
  
  }