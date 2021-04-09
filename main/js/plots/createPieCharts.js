
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Generate pie charts for selected features ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

let selectedData = [];
let selectedRange = [];
let sliceColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
'#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
let continuous = false;

let colorOutOfSpace = {
    yellowAt: {},
    createColorArray: (keyName) => {
        let yellowArray = colorOutOfSpace.yellowAt[keyName]['YellowAt'] || []
        return sliceColors.map((color, index) => {
            if (yellowArray.includes(index))
                return '#FFF34B'
            else
                return color 
        })
    },
    createSliceKey: (listOfSlices) => {
        return listOfSlices.reduce((obj, ele, index) => {
            return {...obj, [ele]: index}
            }, {}
        )
    },
    createGlobalColorDict: (keyName, listOfSlices) => {
      colorOutOfSpace.yellowAt = {
          ...colorOutOfSpace.yellowAt, 
          [keyName]: {
              'YellowAt': [],
              'Key': colorOutOfSpace.createSliceKey(listOfSlices),
          },
      }
    },
    updateGlobalColorDict: (newListOfSlices, keyName) => {
        let oldArray = colorOutOfSpace.yellowAt[keyName]['YellowAt']
        let oldArrayCopy = [...oldArray]
        const oldDict = colorOutOfSpace.yellowAt[keyName]['Key']
        const newDict = colorOutOfSpace.createSliceKey(newListOfSlices)
        // console.log({...newDict})
        const newKeys = Object.keys(newDict) // perhaps this should be oldDict
        for (let i = 0; i < newKeys.length; i++) {
            const num = oldDict[newKeys[i]]
            const index = oldArray.indexOf(num)
            if (index !== -1) {
                oldArrayCopy[index] = newDict[newKeys[i]]
            }
        }

        colorOutOfSpace.yellowAt[keyName] = {
            'YellowAt': [...oldArrayCopy],
            'Key': {...newDict}
        }
        // console.log({...colorOutOfSpace.yellowAt})
    },
    updateYellowAt: (keyName, sliceToChange) => {
        const geneDict = colorOutOfSpace.yellowAt[keyName]
        const key = geneDict['Key']
        const yellowArray = geneDict['YellowAt']
        const newNumber = key[sliceToChange]
        if (yellowArray.includes(newNumber)) {
            let newA = yellowArray.filter((ele) => ele !== newNumber)
            colorOutOfSpace.yellowAt[keyName]['YellowAt'] = newA
        } else {
            let newA = yellowArray.concat(newNumber).sort()
            colorOutOfSpace.yellowAt[keyName]['YellowAt'] = newA
        }
    }
}

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

    let mySelectedClinicalFeatures = $('.geneOneMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
    let mySelectedClinicalFeatures2 = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
    mySelectedClinicalFeatures = mySelectedClinicalFeatures.concat(mySelectedClinicalFeatures2)

    // if no clinical features are selected, do not display any pie charts
    if(mySelectedClinicalFeatures.length == 0) {
        document.getElementById('dataexploration').innerHTML = ""

    // if clinical feature(s) is/are selected, display pie chart(s)
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

            // if current feature is a gene,
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

                            // add all variant classifications (i.e., mutation types) (WITH DUPLICATES) for the given gene to the array
                            allVariantClassifications.push(mutationsForThisGene[i].Variant_Classification);

                            // add all associated barcodes that correspond to the cancer type and gene to the array
                            allBarcodes.push(mutationsForThisGene[i].Tumor_Sample_Barcode);
                        }

                        // create an array of unique variant classifications (i.e., mutation types) for each gene selected
                        // these will become the labels for the legend items 
                        uniqueValuesForCurrentFeature = allVariantClassifications.filter(onlyUnique);
                        
                        // count how many occurrences there are for each mutation type for the given gene
                        // xCounts is an array that will be used to label number of occurrences of each mutation for the given gene
                        xCounts.length = uniqueValuesForCurrentFeature.length;
                        for(let i = 0; i < xCounts.length; i++)
                            xCounts[i] = 0;
                        let totalNumberMutations = 0;
                        for(let k = 0; k < allVariantClassifications.length; k++) {
                            xCounts[uniqueValuesForCurrentFeature.indexOf( allVariantClassifications[k] )]++;
                            totalNumberMutations++;
                        }

                        // if there are fewer patients with mutations than the total number of patients for the given cancer type and gene,
                        // then create a new pie sector for patients with a wild-type version of the gene
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

                var numbers = /^[0-9/.]+$/;
                var firstElement = (allClinicalData[0][currentFeature]).match(numbers);
                var secondElement = (allClinicalData[1][currentFeature]).match(numbers);
                // console.log(firstElement);
                // console.log(secondElement);
                if(firstElement != null || secondElement != null)
                    continuous = true;
                else
                    continuous = false;

                uniqueValuesForCurrentFeature = allValuesForCurrentFeature.filter(onlyUnique);
                xCounts.length = uniqueValuesForCurrentFeature.length;
                for(let i = 0; i < xCounts.length; i++)
                    xCounts[i] = 0;
                // console.log(allClinicalData[0][currentFeature]) // i.e., ~first~ patient's ethnicity
                for(let i = 0; i < allClinicalData.length; i++) 
                    for(let k = 0; k < uniqueValuesForCurrentFeature.length; k++) 
                        if(allClinicalData[i][currentFeature] == uniqueValuesForCurrentFeature[k]) 
                            xCounts[k]++;
            }

            var data = [{
                values: xCounts,
                labels: uniqueValuesForCurrentFeature,
                type: 'pie',
                textinfo: "none",
                // textposition: "inside",
                marker: {
                    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
                    '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
                    line: {
                        color: 'black', 
                        width: 1
                    }
                }
            }];

            var histo_data = [{
                x: uniqueValuesForCurrentFeature,
                y: xCounts,
                type: 'histogram'
            }];
            
            if (colorOutOfSpace.yellowAt[currentFeature]) {
              // if (Object.keys(colorOutOfSpace.yellowAt[currentFeature]['Key']).length !== uniqueValuesForCurrentFeature.length) {}
                colorOutOfSpace.updateGlobalColorDict(uniqueValuesForCurrentFeature, currentFeature)
                data[0] = {...data[0], marker: {
                    colors: colorOutOfSpace.createColorArray(currentFeature),
                    line: {
                      color: 'black', 
                      width: 1
                    }
                }}
            } else {
                colorOutOfSpace.createGlobalColorDict(currentFeature, uniqueValuesForCurrentFeature)
            }

            var layout = {
                height: 400,
                width: 500,
                title: currentFeature + "",
                showlegend: true,
                legend: {
                    font: {
                        size: 14
                    },
                    itemwidth: 40,
                    orientation: "v"
                    // title: {
                    //     text: "Mutations"
                    // }
                },
                extendpiecolors: true,
            };

            var histo_layout = {
                height: 400,
                width: 500,
                title: currentFeature + "",
                showlegend: true,
                legend: {
                    font: {
                        size: 14
                    },
                    itemwidth: 40,
                    orientation: "v"
                },
                xaxis: {
                    rangeselector: {},
                    rangeslider: {}
                },
                yaxis: {
                    fixedrange: true
                }
            };

            var config = {responsive: true}
        
            let parentRowDiv = document.getElementById("dataexploration");        
            let newDiv = document.createElement("div");
            newDiv.setAttribute("class", "col s4");
            newDiv.setAttribute("id", currentFeature + "Div");
            parentRowDiv.appendChild(newDiv);
            
            if(continuous){
                Plotly.newPlot(currentFeature + 'Div', histo_data, histo_layout, config, {scrollZoom: true});
            }
            else{
                Plotly.newPlot(currentFeature + 'Div', data, layout, config, {scrollZoom: true});
            }

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////// On-click event for pie charts below ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////  
          
            document.getElementById(currentFeature + 'Div').on('plotly_relayout', function(data) {
                //checks if continuous data range has been added yet
                if(selectedRange.findIndex(element => element == currentFeature) == -1){
                    selectedRange.push(currentFeature);
                    console.log(selectedRange);
                }
            });
          
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
                if(selectedData[currentFeature] != null) {
                    if(selectedData[currentFeature].findIndex(element => element == slice) != -1){
                        colore[pts] = sliceColors[pts];
                        selectedData[currentFeature].pop(slice);
                        colorOutOfSpace.updateYellowAt(currentFeature, slice) // removes it
                    }
                    else {
                        selectedData[currentFeature].push(slice);
                        colorOutOfSpace.updateYellowAt(currentFeature, slice) // adds it
                        colore[pts] = '#FFF34B';
                    }
                }
                else {
                    selectedData[currentFeature] = [slice];
                    colore[pts] = '#FFF34B';
                    colorOutOfSpace.updateYellowAt(currentFeature, slice)
                }
                var update = {'marker': {colors: colore, 
                                        line: {color: 'black', width: 1}}};
                Plotly.restyle(currentFeature + 'Div', update, [tn], {scrollZoom: true});
                displayNumberBarcodesAtIntersection()
            });
        }
    }
}}
                                                                   
let displayNumberBarcodesAtIntersection = async function () {

    let cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
        cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);

    let geneQuery = $('.geneOneMultipleSelection').select2('data').map(
        gene => gene.text);

    // Fetch RNA sequence data for selected cancer type(s) and gene(s)
    let expressionData = await getExpressionDataJSONarray_cg(cohortQuery, geneQuery);

    let intersectedBarcodes = await getBarcodesFromSelectedPieSectors(expressionData);

    if (document.getElementById("numAtIntersectionText")) {
      document.getElementById("numAtIntersectionText").remove();
    }

    let para = document.createElement("P");
    para.setAttribute(
      "style",
      'text-align: center; color: #4db6ac; font-family: Georgia, "Times New Roman", Times, serif'
    );

    let string = intersectedBarcodes.length + ""

    para.setAttribute("id", "numAtIntersectionText");
    para.innerText = "Number of samples with expression data in defined cohort: " + string;

    let blah = document.getElementById("numIntersectedBarcodesDiv")
    blah.appendChild(para);

};
