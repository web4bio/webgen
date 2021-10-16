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
 * @returns {Promise<{mRNASeq: mRNASeqItem[]}>} Object with fetched data.
 *
 * @throws {Error} if fetch response is not OK.
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

    const response = await fetch(`${hosturl}?${endpointurl}?${params.toString()}`);
    const minimal_json = { mRNASeq: [] };
    if (!response.ok) {
        console.log("Fetching mRNASeq data was unsuccessful.")
        return minimal_json
    }
    const json = await response.json();
    // We expect at least an mRNASeq key, so if this json object is empty, there's
    // a problem.
    if (!json) {
        console.log("mRNASeq is empty, returning an object with empty mRNASeq")
        return minimal_json
    }
    return json
}
