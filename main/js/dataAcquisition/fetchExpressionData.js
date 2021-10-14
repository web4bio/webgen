/** Fetch mRNA expression data for a set of cohorts and genes.
 *
 * @param {string|string[]} cohortQuery - Cohort(s) to fetch.
 * @param {string|string[]} geneQuery - Gene(s) to fetch.
 *
 * @typedef {Object} mRNASeqItem
 * @property {string} cohort
 * @property {number} expression_log2
 * @property {string} gene
 * @property {number} geneID
 * @property {string} protocol
 * @property {string} sample_type
 * @property {string} tcga_participant_barcode
 * @property {number} z-score
 *
 * @returns {{mRNASeq: mRNASeqItem[]}|[]} Object with fetched data, or array with
 *  error information.
 *
 * @example
 *   fetchExpressionData_cg("BLCA", "bcl2")
 *   fetchExpressionData_cg(["BLCA", "BRCA"], ["bcl2", "tp53"])
**/
async function fetchExpressionData_cg(cohortQuery, geneQuery) {
    // Set up host and endpoint urls
    const hosturl = "https://firebrowse.herokuapp.com";
    const endpointurl = "http://firebrowse.org/api/v1/Samples/mRNASeq";
    const params = new URLSearchParams({
        format: "json",
        gene: geneQuery,
        cohort: cohortQuery,
        sample_type: "TP",
        protocol: "RSEM",
        page: "1",
        page_size: 2001,
        sort_by: "tcga_participant_barcode"
    });

    // Fetch data from stitched api:
    const fetchedExpressionData = await fetch(`${hosturl}?${endpointurl}?${params.toString()}`);

    // Check if the fetch worked properly:
    if (fetchedExpressionData === "") {
        return ["Error: Invalid Input Fields for Query.", 0];
    }
    else {
        return await fetchedExpressionData.json();
    }

}
