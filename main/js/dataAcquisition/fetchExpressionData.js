/** One item describing mRNASeq data.
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
 */


/** Fetch mRNA expression data for a set of cohorts and genes.
 *
 * @param {string|string[]} cohorts - Cohort(s) to fetch.
 * @param {string|string[]} genes - Gene(s) to fetch.
 * @param {string|string[]} [barcodes] - TCGA participant barcodes to fetch. Optional.
 *
 * @returns {Promise<{mRNASeq: mRNASeqItem[]}>} Object with fetched data.
 *
 * @throws {Error} if fetch response is not OK.
 *
 * @example
 *   fetchExpressionData_cg("BLCA", "bcl2")
 *   fetchExpressionData_cg(["BLCA", "BRCA"], ["bcl2", "tp53"])
 **/
async function fetchmRNASeq(cohorts, genes, barcodes) {
  const params = {
    format: "json",
    gene: genes,
    cohort: cohorts,
    sample_type: "TP",
    protocol: "RSEM",
    page: "1",
    page_size: 2001,
    sort_by: "tcga_participant_barcode"
  };
  let groupBy = null;
  if (barcodes) {
    params.tcga_participant_barcode = barcodes;
    groupBy = [{key: "tcga_participant_barcode", length: 50}, {key: "gene", length: 20}];
  }
  const data = await fetchFromFireBrowse("/Samples/mRNASeq", params, groupBy);
  return data.mRNASeq;
}
