// Returns an array of strings of cohort descriptions
// (e.g., ["Adrenocortical carcinoma", "Bladder Urothelial Carcinoma", "Breast Invasive Carcinoma"])

getCohortDescriptions = async function() {
    var dataFetched = await fetchCohortData();
    var results = dataFetched.Cohorts.map(x => (x.description));
    return results;
  };