// This JS file contains the async function: fetchSigMutationData()

// fetchSigMutationData() takes two arguments: cohortQuery and numMutations
// cohortQuery is a TCGA cancer cohort, the datatype is string
// numMutations is the number of top ranked mutations for the given cohort to return, the datatype is integer
// fetchSigMutationData() returns the full json result of the Firebrowse query

fetchSigMutationData = async function(cohortQuery, numMutations) {
    // Set up host and endpoint urls
    const hosturl = 'https://firebrowse.herokuapp.com';
    const endpointurl='http://firebrowse.org/api/v1/Analyses/Mutation/SMG';

    // Set up endpoint url fields (except cohort and gene) with preset values
    const endpointurl_presets = {
        format: 'json',
        cohort: cohortQuery,  
        tool: 'MutSig2CV',   
        rank: numMutations.toString(),
        page: '1',
        page_size: 250,
        sort_by: 'rank' 
    };

    // Assemble a string by concatenating all fields and field values for endpoint url
    const endpointurl_fieldsWithValues = 
        'format=' + endpointurl_presets.format + 
        '&cohort=' + endpointurl_presets.cohort.toString() + 
        '&tool=' + endpointurl_presets.tool + 
        '&rank=' + endpointurl_presets.rank +
        '&page=' + endpointurl_presets.page + 
        '&page_size=' + endpointurl_presets.page_size.toString() + 
        '&sort_by=' + endpointurl_presets.sort_by;

    
    // Monitor the performance of the fetch:
    const fetchStart = performance.now();

    // Fetch data from stitched api:
    console.log(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues)
    var fetchedSigMutationData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues);

    // Monitor the performance of the fetch:
    var fetchTime = performance.now() - fetchStart;
    console.log("Performance of Significant Mutation Data fetch: ");
    console.log(fetchTime);

    // Check if the fetch worked properly:
    if (fetchedSigMutationData == '')
        return ['Error: Invalid Input Fields for Query.', 0];
    else {
        return fetchedSigMutationData.json();
    }

}