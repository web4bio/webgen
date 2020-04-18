// Returns an array of strings of cohort IDs
// (e.g., ["ACC", "BLCA", "BRCA"])

getCohortIDs = async function() {
    var dataFetched = await fetchCohortData();
    var results = dataFetched.Cohorts.map(x => (x.cohort));
    return results;  
  };