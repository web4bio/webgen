const fetchClinicalFHByBarcodes = async function(barcodes) {
  const params = {
    format: "json",
    tcga_participant_barcode: barcodes,
  };
  const groupBy = [{key: "tcga_participant_barcode", length: 50}];
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params, groupBy);
  return data.Clinical_FH;
};

const fetchClinicalFHByCohorts = async function(cohorts) {
  const params = {
    format: "json",
    cohort: cohorts,
    sort_by: "tcga_participant_barcode",
  };
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params);
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

const fetchMutationMAF = async function (cohorts, genes) {
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
