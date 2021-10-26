const fetchClinicalFHByBarcodes = async function(barcodes) {
  const params = {
    format: "json",
    tcga_participant_barcode: barcodes,
  };
  const groupBy = [{key: "tcga_participant_barcode", length: 50}];
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params, groupBy);
  return data.Clinical_FH;
}

const fetchClinicalFHByCohorts = async function(cohorts) {
  const params = {
    format: 'json',
    cohort: cohorts,
    sort_by: "tcga_participant_barcode",
  };
  const data = await fetchFromFireBrowse("/Samples/Clinical_FH", params);
  return data.Clinical_FH;
}
