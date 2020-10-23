// Function to combine expression values from long format into nested array (wide format)
// basically just loop through each unique TCGA_id and place expression_log2 values into one array
// expression array order specified by gene names (could use the gene query input)

mergeExpression = function(dataInput) {
    var unique_genes = d3.map(dataInput, function(d){return d.gene;}).keys();
    var unique_ids = d3.map(dataInput, function(d){return d.tcga_participant_barcode}).keys();
    
    var data_raw = dataInput.map(({tcga_participant_barcode,expression_log2, gene}) => ({id:tcga_participant_barcode, exp:expression_log2, gene, geneInd:unique_genes.indexOf(gene)}))

    var data_merge = unique_ids.map(function (str) {
        var arr = data_raw.filter(samp => samp.id.includes(str))
        return {id:arr[0].id,
                exps:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.exp; return acc},[]),
                genes:arr.reduce( (acc,samp) => { acc[samp.geneInd] = samp.gene; return acc},[])}
    })
    return data_merge
}