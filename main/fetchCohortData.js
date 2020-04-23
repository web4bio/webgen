// Returns an array of JSON objects, where each object has a key:value pair for 
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")

fetchCohortData = async function() {
  
  // Set up host and endpoint urls
  const hosturl = 'https://firebrowse.herokuapp.com';
  const endpointurl='http://firebrowse.org/api/v1/Metadata/Cohorts';
  
  // Set up endpoint url fields (except cohort and gene) with preset values
  const endpointurl_presets = {format: 'json'};

  // Assemble a string by concatenating all fields and field values for endpoint url
  const endpointurl_fieldsWithValues = 'format=' + endpointurl_presets.format;

  // Fetch data from stitched api:
  var fetchedCohortData = await fetch(hosturl + '?' + endpointurl + '?' + endpointurl_fieldsWithValues);

  // Check if the fetch worked properly:
  if (fetchedCohortData == '')              
      return ['Error: Invalid Input Fields for Query.', 0];
  else {
      return fetchedCohortData.json();
  }

}
