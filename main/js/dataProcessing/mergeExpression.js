/** Transform expression values from long format into wide format (i.e., nested array).
 *
 * We loop through each unique TCGA_id and place expression_log2 values into one array.
 * The expression array order is specified by gene names.
 *
 * @param {mRNASeqItem[]} dataInput - The data to transform.
 * @returns {{id: string, exps: (number|null)[], genes: string[]}[]} - Transformed data.
 */
const mergeExpression = function(dataInput) {
  const unique_genes = d3.map(dataInput, d => d.gene).keys();
  const unique_ids = d3.map(dataInput, d => d.tcga_participant_barcode ).keys();

  const data_raw = dataInput.map(({tcga_participant_barcode,expression_log2, gene}) => ({id:tcga_participant_barcode, exp:expression_log2, gene, geneInd:unique_genes.indexOf(gene)}));

  const data_merge = unique_ids.map(function (str) {
    const arr = data_raw.filter(samp => samp.id.includes(str));
    return {id:arr[0].id,
            exps:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.exp; return acc;},[]),
            genes:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.gene; return acc;},[])};
  });
  return data_merge;
};
