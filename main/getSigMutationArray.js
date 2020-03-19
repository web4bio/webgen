// This script contains the function: getSigMutationArray()

// This function takes two input: cohortQuery and numMutations
// This function then calls fetchSigMutationData()
// For more information on what fetchSigMutationData() does, look at fetchSigMutationData.js

// This function then returns an array of length numMutations containing the top n
// ranked mutations for the given cohort in cohortQuery, where: n = numMutations.

// Example of how to utilize this function:
/*
            var sigMutationArrayReturned = getSigMutationArray("PAAD", 20);

            sigMutationArrayReturned.then(function(sigMutationArray) {
                console.log(sigMutationArray)
            });
*/

getSigMutationArray = async function(cohortQuery, numMutations) {
    // Fetch data:
    var sigMutationDataReturned = await fetchSigMutationData(cohortQuery, numMutations);

    // Get just the list of the top n genes:
    var sigMutationArray = sigMutationDataReturned.SMG;
    var geneInfoArray = sigMutationArray.map(x => x.gene);

    return await geneInfoArray
}