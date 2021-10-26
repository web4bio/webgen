/**
 * TODO: use named arguments via destructuring. this will allow us to handle different
 * combinations of parameters. some functions are defined expecting some params, while
 * other functions are very similar but construct slightly different params. we can
 * remove redundancy with that.
 */

/** Fetch Clinical_FH data from FireBrowse.
  *
  * @param {object} obj - Object with named arguments.
  * @param {string|string[]} obj.cohorts - Cohort(s) to fetch.
  * @param {string|string[]} obj.genes - Gene(s) to fetch.
  * @param {string|string[]} obj.barcodes - TCGA participant barcodes to fetch.
  *
  * @returns {Array} Returns clinical data.
  */
const fetchClinicalFH = async function({cohorts, genes, barcodes}) {
  if (!cohorts && !genes && !barcodes) {
    console.error("no arguments provided to function");
  }
  const params = {
    format: "json",
    sort_by: "tcga_participant_barcode",
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
    groupBy = [{key: "tcga_participant_barcode", length: 50}];
    if (genes) {
      groupBy.push({key: "gene", length: 20});
    }
  }
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params, groupBy);
  return data.Clinical_FH;
};


// Returns an array of JSON objects, where each object has a key:value pair for
// "cohort" (e.g., "BRCA") and "description" (e.g., "Breast invasive carcioma")
const fetchCohortData = async function() {
  const params = { format: "json" };
  const data = await fetchFromFireBrowse("/Metadata/Cohorts", params);
  return data.Cohorts;
};

const fetchNumberSamples = async function(cohorts) {
  const params = {
    cohort: cohorts,
    sample_type: "TP",
    data_type: "mrnaseq",
    totals: "true",
  };
  const data = await fetchFromFireBrowse("/Metadata/Counts", params);
  return data.Counts;
};

const fetchMutationMAF = async function ({cohorts, genes}) {
  const params = {
    format: "json",
    cohort: cohorts,
    tool: "MutSig2CV",
    gene: genes,
    page: "1",
    page_size: 250,
    sort_by: "cohort",
  };
  const data = await fetchFromFireBrowse("/Analyses/Mutation/MAF", params);
  return data.MAF;
};
