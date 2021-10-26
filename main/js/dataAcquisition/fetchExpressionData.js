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


/** Fetch mRNA expression data.
 *
 * @param {object} obj - Object with named arguments.
 * @param {string|string[]} obj.cohorts - Cohort(s) to fetch.
 * @param {string|string[]} obj.genes - Gene(s) to fetch.
 * @param {string|string[]} obj.barcodes - TCGA participant barcodes to fetch. Optional.
 *
 * @returns {Promise<{mRNASeq: mRNASeqItem[]}>} Object with fetched data.
 **/
async function fetchmRNASeq({cohorts, genes, barcodes}) {
  if (!cohorts && !genes && !barcodes) {
    console.error("no arguments provided to function");
  }
  const params = {
    format: "json",
    sample_type: "TP",
    protocol: "RSEM",
    page: "1",
    page_size: 2001,
    sort_by: "tcga_participant_barcode"
  };
  if (cohorts) {
    params.cohort = cohorts;
  }
  if (genes) {
    params.gene = genes;
  }
  let groupBy = null;
  if (barcodes) {
    params.tcga_participant_barcode = barcodes;
    groupBy = [{key: "tcga_participant_barcode", length: 50}, {key: "gene", length: 20}];
  }
  const data = await fetchFromFireBrowse("/Samples/mRNASeq", params, groupBy);
  return data.mRNASeq;
}
