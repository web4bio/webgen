
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Generate pie charts for selected features ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

let clinicalValues = [];
let sliceColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
'#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

let buildDataExplorePlots = async function() {

    // get total number of barcodes for selected cancer type(s)
    let dataFetched = await fetchNumberSamples();
    let countQuery = dataFetched.Counts;
    let totalNumberBarcodes = 0;
    for(let i = 0; i < countQuery.length; i++) {
        totalNumberBarcodes += parseInt(countQuery[i].mrnaseq);

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);

    if(mySelectedClinicalFeatures.length == 0) {
        document.getElementById('dataexploration').innerHTML = ""
    } else {

        // clear all previous plots that were displayed
        document.getElementById('dataexploration').innerHTML = "";

        // loop through each selected clinical feature
        for(let i = 0; i < mySelectedClinicalFeatures.length; i++) {

            let currentFeature = mySelectedClinicalFeatures[i];
            let allValuesForCurrentFeature = []; 
            let mutationsForThisGene;
            let uniqueValuesForCurrentFeature = [];
            let xCounts = [];

            // if current feature is a gene
            // get values and labels for this feature
            if(currentFeature[0] === currentFeature[0].toUpperCase()) {

                let currentGeneSelected = currentFeature;
                let allVariantClassifications = [];
                let allBarcodes = []; // barcodes that correspond to a mutation
                await getAllVariantClassifications(currentGeneSelected).then(function(result) { // get all mutations that exist for this gene and cancer type
                    
                    mutationsForThisGene = result;

                    // if mutations DO exist for this gene (i.e., if the gene is NOT wild-type)
                    if(mutationsForThisGene != undefined) { 
                        for(let i = 0; i < mutationsForThisGene.length; i++) {
                            allVariantClassifications.push(mutationsForThisGene[i].Variant_Classification); // add all variant classifications (with duplicates) to the array
                            allBarcodes.push(mutationsForThisGene[i].Tumor_Sample_Barcode);   // add all associated barcodes to the array
                        }
                        uniqueValuesForCurrentFeature = allVariantClassifications.filter(onlyUnique);
                        xCounts.length = uniqueValuesForCurrentFeature.length;
                        for(let i = 0; i < xCounts.length; i++)
                            xCounts[i] = 0;
                        let totalNumberMutations = 0;
                        for(let k = 0; k < allVariantClassifications.length; k++) {
                            xCounts[uniqueValuesForCurrentFeature.indexOf( allVariantClassifications[k] )]++;
                            totalNumberMutations++;
                        }

                        if(totalNumberMutations < totalNumberBarcodes) {
                            uniqueValuesForCurrentFeature[uniqueValuesForCurrentFeature.length] = "Wild_Type"
                            xCounts[xCounts.length] = totalNumberBarcodes - totalNumberMutations;
                        }

                    // if mutations do NOT exist for this gene (i.e., if the gene is wild-type)
                    } else {
                        uniqueValuesForCurrentFeature.push("Wild_Type");  
                        xCounts.push(totalNumberBarcodes);
                    }
                });

            // if current feature is clinical (i.e., not a gene)
            // get values and labels for this feature
            } else {
                for(let i = 0; i < allClinicalData.length; i++) 
                    allValuesForCurrentFeature.push(allClinicalData[i][currentFeature]);
                uniqueValuesForCurrentFeature = allValuesForCurrentFeature.filter(onlyUnique);
                xCounts.length = uniqueValuesForCurrentFeature.length;
                for(let i = 0; i < xCounts.length; i++)
                    xCounts[i] = 0;
                console.log(allClinicalData[0][currentFeature]) // i.e., ~first~ patient's ethnicity
                for(let i = 0; i < allClinicalData.length; i++) 
                    for(let k = 0; k < uniqueValuesForCurrentFeature.length; k++) 
                        if(allClinicalData[i][currentFeature] == uniqueValuesForCurrentFeature[k]) 
                            xCounts[k]++;
            }
        
            var data = [{
                values: xCounts,
                labels: uniqueValuesForCurrentFeature,
                type: 'pie',
                textinfo: "label+percent",
                textposition: "outside",
                marker: {
                    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
                    '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
                    line: {
                        color: 'black', 
                        width: 1
                    }
                }
            }];
            
            var layout = {
                height: 400,
                width: 500,
                title: currentFeature + "",
                showlegend: true,
                extendpiecolors: true
            };
        
            let parentRowDiv = document.getElementById("dataexploration");        
            let newDiv = document.createElement("div");
            newDiv.setAttribute("class", "col s4");
            newDiv.setAttribute("id", currentFeature + "Div");
            parentRowDiv.appendChild(newDiv);
            
            Plotly.newPlot(currentFeature + 'Div', data, layout, {scrollZoom: true});


////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// On-click event for pie charts below ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

            document.getElementById(currentFeature + 'Div').on('plotly_click', function(data) {
                var pts = '';
                var colore;
                var tn = '';
                var slice = '';
                for(let i = 0; i < data.points.length; i++) {
                    pts = data.points[i].pointNumber;
                    tn = data.points[i].curveNumber;
                    colore = data.points[i].data.marker.colors;
                    slice = data.points[i].label;
                }
                if(clinicalValues[currentFeature] != null){
                    if(clinicalValues[currentFeature].findIndex(element => element == slice) != -1){
                        colore[pts] = sliceColors[pts];
                        clinicalValues[currentFeature].pop(slice);
                    }
                    else{
                        clinicalValues[currentFeature].push(slice);
                        colore[pts] = '#FFF34B';
                    }
                }
                else{
                    clinicalValues[currentFeature] = [slice];
                    colore[pts] = '#FFF34B';
                }
                var update = {'marker': {colors: colore, 
                                        line: {color: 'black', width: 1}}};
                Plotly.restyle(currentFeature + 'Div', update, [tn], {scrollZoom: true});
            });
        }
    }
}}