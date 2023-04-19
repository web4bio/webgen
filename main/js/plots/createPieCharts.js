
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Generate pie charts for selected features ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

let selectedCategoricalFeatures = [];
let selectedContinuousFeatures = [];
let selectedRange = [];
let previouslySelectedFeatures;
let mutationDataForAllGenesSelected = []
let sliceColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
'#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#90cc54', '#c9bf61'];

let mutationDataForAllGenes = [];

// an object that defines color schema of pie charts
// maintains yellow highlights despite addition removal of individual pie charts
// maintains consistent color scheme across pie charts
let colorOutOfSpace = {
    yellowAt: {},
    colorCodeKey: {}, // Genes Only
    dictLength: 0, // Gene Only
    buildColorCodeKeyGene: (arrayOfPieSlices) => {
        arrayOfPieSlices.forEach((ele) => {
            if (colorOutOfSpace.colorCodeKey[ele] === undefined) {
                colorOutOfSpace.colorCodeKey[ele] = sliceColors[colorOutOfSpace.dictLength % 10]
                colorOutOfSpace.dictLength = colorOutOfSpace.dictLength + 1
            }
        })
    },
    buildColorCodeKeyArray: (arrayOfPieSlices) => {
        let sliceColorsCopy = [...sliceColors]
        let keyDict = colorOutOfSpace.colorCodeKey
        arrayOfPieSlices.forEach((ele, index) => {
          let colorCode = keyDict[ele]
          sliceColorsCopy[index] = colorCode
        })
        return sliceColorsCopy
    },
    createColorArray: (colorCodeArray, keyName) => {
        let yellowArray = colorOutOfSpace.yellowAt[keyName]['YellowAt'] || []
        return colorCodeArray.map((color, index) => {
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
        const newKeys = Object.keys(newDict)

        // scenario occurs when newKeys has less keys than oldKeys
        const oldKeys = Object.keys(oldDict)
        if (newKeys.length < oldKeys.length) {
            for (let i = 0; i < oldKeys.length; i++) {
                if (newDict[oldKeys[i]] === undefined) { // oldKey does not exist in the new Dict
                    oldArrayCopy[oldArray.indexOf(oldDict[oldKeys[i]])] = 'X'
                    // replace it with a placeholder val, do not want to change the position of the elements
                }
            }
        }

        for (let i = 0; i < newKeys.length; i++) {
            const num = oldDict[newKeys[i]]
            const index = oldArray.indexOf(num)
            if (index !== -1) {
                oldArrayCopy[index] = newDict[newKeys[i]]
            }
        }

        colorOutOfSpace.yellowAt[keyName] = {
            'YellowAt': oldArrayCopy.filter(ele => ele !== 'X'),
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
            var newA = yellowArray.filter((ele) => ele !== newNumber)
        } else {
            var newA = yellowArray.concat(newNumber).sort()
        }
        colorOutOfSpace.yellowAt[keyName]['YellowAt'] = newA
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/** Build and display data explore plots i.e. pie charts and histograms
 *
 * This function fetches the necessary data, builds the pie charts to display discrete data
 * and builds histograms to display continunous data.
 * 
 * @returns {undefined}
 */
let buildDataExplorePlots = async function() {
    let mySelectedGenes = $('.geneOneMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.id);
    let mySelectedFeatures = mySelectedGenes.concat(mySelectedClinicalFeatures)

    // if no features are selected, do not display any pie charts
    if(mySelectedFeatures.length == 0) {
        document.getElementById('dataexploration').innerHTML = ""

    // if feature(s) is/are selected, display pie chart(s)
    } else {
        
        // If feature was unselected
        if (previouslySelectedFeatures !== undefined) {
            // get any features that were previously selected that are no longer selected
            let unselectedFeature = previouslySelectedFeatures.filter(x => !mySelectedFeatures.includes(x));
            if(unselectedFeature.length > 0) {
                let temp = document.getElementById(unselectedFeature + 'Div');
                if (temp) {
                    // remove associated div/plot
                    temp.remove();
                }
                // if unselected feature is not a gene, set isSelected status to false
                if(!(unselectedFeature[0] === unselectedFeature[0].toUpperCase())) {
                    let index = clinicalType.findIndex(x => x.name == unselectedFeature);
                    clinicalType[index].isSelected = false;
                }
                // if unselected feature is a gene, update mutationDataForAllGenesSelected
                if(unselectedFeature[0] === unselectedFeature[0].toUpperCase()) {
                    let index = mutationDataForAllGenesSelected.findIndex(x => x[0].Hugo_Symbol == unselectedFeature);
                    mutationDataForAllGenesSelected.splice(index, 1)
                }
                
            }
        }
        previouslySelectedFeatures = mySelectedFeatures;    

        // get total number of barcodes for selected cancer type(s)
        let totalNumberBarcodes = 0;
        for(let i = 0; i < numbersOfSamples.length; i++) {
            totalNumberBarcodes += parseInt(numbersOfSamples[i].mrnaseq);

        // loop through each selected feature
        for(let i = 0; i < mySelectedFeatures.length; i++) {

            let continuous = false;
            let currentFeature = mySelectedFeatures[i];
            let uniqueValuesForCurrentFeature = [];
            let xCounts = [];

            // If a plot already exists for this feature, do not re-render this plot
            if(document.getElementById(currentFeature + 'Div')) {
                continue
            }

            // if current feature is a gene,
            // get values and labels for this feature
            if(currentFeature[0] === currentFeature[0].toUpperCase()) {
                
                let geneResults = await computeGeneMutationFrequencies(xCounts, uniqueValuesForCurrentFeature, currentFeature);
                xCounts = geneResults[0]
                uniqueValuesForCurrentFeature = geneResults[1]
            }
            // if current feature is clinical (i.e., not a gene)
            // get values and labels for this feature 
            else {

                let clinicalFeaturesResults = await computeClinicalFeatureFrequencies(xCounts, uniqueValuesForCurrentFeature, currentFeature, continuous);
                console.log(clinicalFeaturesResults)
                xCounts = clinicalFeaturesResults[0]
                uniqueValuesForCurrentFeature = clinicalFeaturesResults[1]
                continuous = clinicalFeaturesResults[2]

            }

            let parentRowDiv = document.getElementById("dataexploration");        
            let newDiv = document.createElement("div");
            newDiv.setAttribute("id", currentFeature + "Div");
            newDiv.setAttribute("style", "float:left;");
            parentRowDiv.appendChild(newDiv);

            let setChartDimsAndPlot = async function (uniqueValuesForCurrentFeature, currentFeature, xCounts, continuous) {

                let currentFeatureDiv = document.getElementById(currentFeature + "Div")
                if (currentFeatureDiv) {

                    let chartDimensions = await setChartDimensions(uniqueValuesForCurrentFeature, currentFeatureDiv)
                    let chartHeight = chartDimensions[0]
                    let chartWidth = chartDimensions[1]
                    let legend_location_x = chartDimensions[2]
                    let legend_location_y = chartDimensions[3]
            
                    var data = [{
                        values: xCounts,
                        labels: uniqueValuesForCurrentFeature,
                        type: 'pie',
                        textinfo: "none",
                        marker: {
                            sliceColors,
                            //colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
                            //'#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
                            line: {
                                color: 'black',
                                width: 1
                            }
                        },
                        showlegend: false
                    }];
        
                    var histo_data = [{
                        x: uniqueValuesForCurrentFeature,
                        hovertemplate: '%{x}<br>'+
                                       '<extra></extra>'+
                                       '<b>Frequency:</b> %{y}',
                        type: 'histogram'
                    }];
        
                    // set colors of pie sectors:
                    if (!continuous) {
                        colorOutOfSpace.buildColorCodeKeyGene(uniqueValuesForCurrentFeature)
                        let colorArray = colorOutOfSpace.buildColorCodeKeyArray(uniqueValuesForCurrentFeature)
                        data[0] = {...data[0], marker: {
                            colors: colorArray,
                            line: {
                                color: 'black',
                                width: 1
                            }
                        }}
                        if (colorOutOfSpace.yellowAt[currentFeature]) {
                            // if (Object.keys(colorOutOfSpace.yellowAt[currentFeature]['Key']).length !== uniqueValuesForCurrentFeature.length) {}
                            colorOutOfSpace.updateGlobalColorDict(uniqueValuesForCurrentFeature, currentFeature)
                            data[0] = {...data[0], marker: {
                                colors: colorOutOfSpace.createColorArray(colorArray, currentFeature),
                                line: {
                                color: 'black',
                                width: 1
                                }
                            }}
                        } else {
                            colorOutOfSpace.createGlobalColorDict(currentFeature, uniqueValuesForCurrentFeature)
                        }
                    }
        
                    var layout = {
                        height: chartHeight,
                        width: chartWidth,
                        title: (currentFeature + "").replaceAll('_', ' '),
                        showlegend: true,
                        font: {
                            family: 'Arial, Helvetica, sans-serif'
                        },
                        legend: {
                            // maxWidth: 5,
                            x: legend_location_x,
                            y: legend_location_y,
                            font: {
                                size: 14
                            },
                            itemwidth: 40,
                            orientation: "v"
                        },
                        extendpiecolors: true
                    };
        
                    var histo_layout = {
                        bargap: 0.05,
                        height: 400,
                        width: 500,
                        // title: (currentFeature + "").replaceAll('_', ' '),
                        showlegend: false,
                        font: {
                            family: 'Arial, Helvetica, sans-serif'
                        },
                        hoverlabel: { bgcolor: "#FFF" },
                        xaxis: {
                            title: (currentFeature + "").replaceAll('_', ' '),
                            // rangeselector: {}
                            fixedrange: true
                        },
                        yaxis: {
                            title: "Frequency",
                            fixedrange: true
                        },
                        dragmode: 'select',
                        selectdirection: 'h'
                    };
        
                    var config = {
                        responsive: true, 
                        displayModeBar: false
                    }
        
                    if (continuous) {
                        Plotly.newPlot(currentFeature + 'Div', histo_data, histo_layout, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
                    } else {
                        Plotly.newPlot(currentFeature + 'Div', data, layout, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
                    }

                }
            }

            await setChartDimsAndPlot(uniqueValuesForCurrentFeature, currentFeature, xCounts, continuous)
            
            window.addEventListener("resize", function() { setChartDimsAndPlot(uniqueValuesForCurrentFeature, currentFeature, xCounts, continuous);} )

            document.getElementById(currentFeature + 'Div').on('plotly_selected', function(eventData) {
                // if continuous data range has not yet been added 
                if(selectedContinuousFeatures.findIndex(element => element == currentFeature) == -1){
                    if(currentFeature != "pathologic_stage") {
                        selectedContinuousFeatures.push(currentFeature);
                    }
                }
                if(eventData) {
                    selectedRange[0] = eventData.range.x[0];
                    selectedRange[1] = eventData.range.x[1];
                } else {
                    selectedRange = (document.getElementById(currentFeature + 'Div')).layout.xaxis.range;
                }
            });

            // add on click event for pie chart
            if(!continuous) {
                document.getElementById(currentFeature + 'Div').on('plotly_click', function(data) {
                    var pts = '';
                    var colore;
                    var tn = '';
                    var slice = '';
                    for(let j = 0; j < data.points.length; j++) {
                        pts = data.points[j].pointNumber;
                        tn = data.points[j].curveNumber;
                        colore = data.points[j].data.marker.colors;
                        slice = data.points[j].label;
                    }
                    if(selectedCategoricalFeatures[currentFeature] != null) {
                        if(selectedCategoricalFeatures[currentFeature].findIndex(element => element == slice) != -1){
                            let colorArray = colorOutOfSpace.buildColorCodeKeyArray(uniqueValuesForCurrentFeature)
                            colore[pts] = colorArray[pts];
                            selectedCategoricalFeatures[currentFeature].pop(slice);
                        } else {
                            selectedCategoricalFeatures[currentFeature].push(slice);
                            colore[pts] = '#FFF34B';
                        }
                    } else {
                        selectedCategoricalFeatures[currentFeature] = [slice];
                        colore[pts] = '#FFF34B';
                    }
                    colorOutOfSpace.updateYellowAt(currentFeature, slice)
                    var update = {'marker': {colors: colore,
                                            line: {color: 'black', width: 1}}};
                    Plotly.restyle(currentFeature + 'Div', update, [tn], {scrollZoom: true});
                });
            }
        }
        //Hard code for now
        // let testCacheFetch = await cacheMu.fetchWrapperMU("ACC",["TP53","ABL1","ACSL3"])
        // console.log("All cached data: ")
        // console.log(testCacheFetch)

    }
}}

/** Compute gene mutation frequencies based on user's selected tumor type(s) and gene(s).
  *
  * @param {array} xCounts - An empty array
  * @param {array} uniqueValuesForCurrentFeature - An empty array
  * @param {string|string[]} currentGeneSelected - One of the genes that was selected by the user in the first gene dropdown
  * @returns {Array} Contains values and labels to input to Plotly data object.
  */
 let computeGeneMutationFrequencies = async function(xCounts, uniqueValuesForCurrentFeature, currentGeneSelected) {
    let jsonToAppend;
    //Acquire all the barcodes for the cohort specified to identify which patients in the cohort have wild-type mutations
    let expressionData = await firebrowse.fetchmRNASeq({cohorts:selectedTumorTypes,
        genes:'TTN'});    
    let allBarcodes = []; // Barcodes in expression data
    for(let i = 0; i < expressionData.length; i++) {
        allBarcodes.push(expressionData[i].tcga_participant_barcode);
    }
    //Filter allBarcodes to obtain unique barcodes
    allBarcodes = allBarcodes.filter(onlyUnique);

    //allCohortsBarcodes will contain JSON elements consisting of the participant barcode and their respective cohort
    let allCohortsBarcodes = [];
    for(let i = 0; i < expressionData.length; i++) {
        /*Since we remove a participant barocde from allBarcodes after it is appended to allCohortsBarcodes, the indexOf()
        call is used to determine whether a participant barcode in expressionData has already been appended*/
        let barcodeIndex = allBarcodes.indexOf(expressionData[i].tcga_participant_barcode)
        if(barcodeIndex >= 0) {
            //Create JSON object with barcode and corresponding cohort; then append to allCohortsBarcodes
            let elToAppend = {patient_barcode:expressionData[i].tcga_participant_barcode,
                cohort:expressionData[i].cohort};
            allCohortsBarcodes.push(elToAppend);
            //Remove participant barcode from allBarcodes to track which we have appended
            allBarcodes.splice(barcodeIndex, 1);
        }
    } 

    let allVariantClassifications = [];
    let allLabels = []; //Mutation labels for each barcode

    // get all mutations that exist for this gene and cancer type
    let mutationDataForThisGene = await firebrowse.fetchMutationMAF({cohorts: selectedTumorTypes, 
        genes: currentGeneSelected});
    
    //Push the mutation data to global variable
    mutationDataForAllGenesSelected.push(mutationDataForThisGene)

    // if mutations DO exist for this gene (i.e., if the gene is NOT wild-type)
    if(mutationDataForThisGene != undefined) {
        // substring barcodes & save barcodes
        for(let i = 0; i < mutationDataForThisGene.length; i++) {
            //Loop over allBarcodes from expression data to filter out
            //barcodes unique to the mutation data
            mutationDataForThisGene[i].Tumor_Sample_Barcode = mutationDataForThisGene[i].Tumor_Sample_Barcode.substring(0, 12);
            let participantBarcode = mutationDataForThisGene[i].Tumor_Sample_Barcode;
            let barcodeInExpressionCohort = false;
            for(let j = 0; j < allCohortsBarcodes.length; j++) {
                if(allCohortsBarcodes[j].patient_barcode == participantBarcode) {
                    barcodeInExpressionCohort = true;
                    break;
                }
            }
            if(!barcodeInExpressionCohort) {
                mutationDataForThisGene.splice(i, 1);
                //Decrement index i by 1
                i--;
            }
            else {
                allVariantClassifications.push(mutationDataForThisGene[i].Variant_Classification);
                allBarcodes.push(mutationDataForThisGene[i].Tumor_Sample_Barcode);
            }
        }

        // get unique mutation types and unique substringed barcodes
        uniqueValuesForCurrentFeature = allVariantClassifications.filter(onlyUnique);
        allBarcodes = allBarcodes.filter(onlyUnique);

        // FINAL: create object with patient ids sorted by mutation types that they appear in
        // create object with patient ids sorted by mutation types that they appear in
        let barcodesByMutationType = []
        for(let i = 0; i < uniqueValuesForCurrentFeature.length; i++) {
            let obj = {};
            obj[uniqueValuesForCurrentFeature[i] + ''] = []
            barcodesByMutationType.push(obj)
            for(let j = 0; j < mutationDataForThisGene.length; j++) 
                if(mutationDataForThisGene[j].Variant_Classification == uniqueValuesForCurrentFeature[i]) 
                    barcodesByMutationType[i][uniqueValuesForCurrentFeature[i]].push(mutationDataForThisGene[j].Tumor_Sample_Barcode)
        }
        // get rid of duplicate barcodes that may exist within a mutation type
        for(let i = 0; i < barcodesByMutationType.length; i++) {
            let temp = new Set(barcodesByMutationType[i][uniqueValuesForCurrentFeature[i]])
            barcodesByMutationType[i][uniqueValuesForCurrentFeature[i]] = Array.from(temp);
        }


        // FINAL: get barcodes that appear in >1 mutation type
        // count number of occurrences of each unique barcode in each mutation type
        let counter = [];
        counter.length = allBarcodes.length;
        for(let i = 0; i < counter.length; i++)
            counter[i] = 0;
        for(let i = 0; i < allBarcodes.length; i++) {
            for(let j = 0; j < barcodesByMutationType.length; j++) 
                if(barcodesByMutationType[j][uniqueValuesForCurrentFeature[j]].includes(
                    allBarcodes[i])) 
                    counter[i]++;
        }
        // get indices of barcodes that appear in >1 mutation type
        let myIndices = [];
        for(let i = 0; i < counter.length; i++)
            if(counter[i] > 1)
                myIndices.push(i)
        // get barcodes that appear in >1 mutation type
        let barcodesWithMoreThanOneMutationForGene = []
        for(let i = 0; i < myIndices.length; i++) {
            if(myIndices[i] > 1) {
                //let barcode = allCohortsBarcodes[myIndices[i]].patient_barcode;
                let barcode = allBarcodes[myIndices[i]];
                let cohort = allCohortsBarcodes[myIndices[i]].cohort;
                let elToAppend = {cohort:cohort, patient_barcode:barcode};
                barcodesWithMoreThanOneMutationForGene.push(elToAppend)
            }
        }


        // FINAL: GET LABELS
        // get array of unique paired mutation types in which a single barcode appears
        let poolWithBarcodes = [];
        poolWithBarcodes.length = barcodesWithMoreThanOneMutationForGene.length;
        for(let i = 0; i < poolWithBarcodes.length; i++) {
            /*Each element in poolWithBarcodes will have a cohort, mutation_label, and patient_barcode field to map 
            patients to mutation labels*/
            poolWithBarcodes[i] = {patient_barcode:"", cohort:"", mutation_label:""}
        }
        for(let i = 0; i < barcodesWithMoreThanOneMutationForGene.length; i++) {
            for(let j = 0; j < barcodesByMutationType.length; j++) {
                if(barcodesByMutationType[j][uniqueValuesForCurrentFeature[j]].includes(
                    barcodesWithMoreThanOneMutationForGene[i].patient_barcode)) {
                    if(poolWithBarcodes[i]["mutation_label"].length > 1) {
                        poolWithBarcodes[i].mutation_label += '_&_' + uniqueValuesForCurrentFeature[j];
                        poolWithBarcodes[i].patient_barcode = barcodesWithMoreThanOneMutationForGene[i].patient_barcode;
                        poolWithBarcodes[i].cohort = barcodesWithMoreThanOneMutationForGene[i].cohort;
                    } else {
                        poolWithBarcodes[i].mutation_label = uniqueValuesForCurrentFeature[j] + '';
                        poolWithBarcodes[i].patient_barcode = barcodesWithMoreThanOneMutationForGene[i].patient_barcode;
                        poolWithBarcodes[i].cohort = barcodesWithMoreThanOneMutationForGene[i].cohort;
                    }
                }
            }
        }
        let swim = []
        for(let i = 0; i < poolWithBarcodes.length; i++) {
            if(!swim.includes(poolWithBarcodes[i].mutation_label))
                swim.push(poolWithBarcodes[i].mutation_label)
        }

        allLabels = swim.concat(uniqueValuesForCurrentFeature)


        // FINAL: COMPUTE FREQUENCIES         
        // count how many occurrences there are for each mutation type for the given gene
        // xCounts is an array that will be used to label number of occurrences of each mutation for the given gene
        xCounts.length = allLabels.length;
        for(let i = 0; i < xCounts.length; i++)
            xCounts[i] = 0;

        //Compute counts for multi-mutation labels
        //Create array of multi-mutation barcodes
        let multiMutationBarcodes = []
        for(let i = 0; i < poolWithBarcodes.length; i++) {
            //Increment xCounts value if allLabels contains the mutation_label field of poolWithBarcodes element
            let j = allLabels.indexOf(poolWithBarcodes[i]["mutation_label"]);            
            if(j > -1) {
                xCounts[j] = xCounts[j] + 1;
                multiMutationBarcodes.push(poolWithBarcodes[i].patient_barcode)
            }
        }


        // remove from mutationDataForThisGene any barcodes that are associated wtih >1 mutation
        let indicesToRemove = [];
        for(let i = 0; i < mutationDataForThisGene.length; i++)
            if(multiMutationBarcodes.includes(mutationDataForThisGene[i].Tumor_Sample_Barcode)) {
                indicesToRemove.push(i)
            }

        mutationDataForThisGene = mutationDataForThisGene.filter(function(value, index) {
            return indicesToRemove.indexOf(index) == -1;
        })


        let sinlgeMutationBarcodes = [];
        for(let i = 0; i < mutationDataForThisGene.length; i++) {
            sinlgeMutationBarcodes.push(mutationDataForThisGene[i].Tumor_Sample_Barcode);
        }

        //Remove duplicate single-mutation patient elements from mutationDataForThisGene
        for(let i = 0; i < mutationDataForThisGene.length; i++) {
            let barcode = mutationDataForThisGene[i].Tumor_Sample_Barcode;
            //See if indexOf() returns a valid index after index i and use splice() to remove duplicate entries
            while(sinlgeMutationBarcodes.indexOf(barcode, i+1) > -1) {
                let indexToRemove = sinlgeMutationBarcodes.indexOf(barcode, i+1)
                sinlgeMutationBarcodes.splice(indexToRemove, 1);
                mutationDataForThisGene.splice(indexToRemove, 1);
            }
        }

        //Get array of unique barcodes from mutationDataForThisGene
        sinlgeMutationBarcodes = [];
        for(let i = 0; i < mutationDataForThisGene.length; i++) {
            sinlgeMutationBarcodes.push(mutationDataForThisGene[i].Tumor_Sample_Barcode);
        }
        sinlgeMutationBarcodes = sinlgeMutationBarcodes.filter(onlyUnique);
        //Create array to track the single-mutation patient barcodes and their mutation types
        let singleMutationPatients = [];
        singleMutationPatients.length = sinlgeMutationBarcodes.length;
        //Initialize each element of singleMutationPatients to be a JSON object
        for(let i = 0; i < singleMutationPatients.length; i++) {
            singleMutationPatients[i] = {patient_barcode:"", cohort:"", mutation_label:""};
        }
        // count number of barcodes associated with single mutations
        for(let i = 0; i < mutationDataForThisGene.length; i++) {
            xCounts[allLabels.indexOf(mutationDataForThisGene[i].Variant_Classification)]++;
            singleMutationPatients[i].mutation_label = mutationDataForThisGene[i].Variant_Classification;
            singleMutationPatients[i].patient_barcode = mutationDataForThisGene[i].Tumor_Sample_Barcode;
            singleMutationPatients[i].cohort = mutationDataForThisGene[i].cohort;
        }

        //Concatenate poolWithBarcodes and singleMutationPatients into a single array
        let mergedMutationData = poolWithBarcodes.concat(singleMutationPatients);
        //Loop over all patients with no mutation data and assign them "Wild_Type"
        //Get barcodes in array for simpler logic
        let mergedMutationBarcodes = [];
        for(let i = 0; i < mergedMutationData.length; i++)
            mergedMutationBarcodes.push(mergedMutationData[i].patient_barcode);

        //Remove barcode from patientsWithNoMutation array if it has mutation data
        let patientsWithNoMutation = allCohortsBarcodes;
        let barcodesArr = [];
        for(let i = 0; i < patientsWithNoMutation.length; i++)
            barcodesArr.push(patientsWithNoMutation[i].patient_barcode);

        for(let i = 0; i < mergedMutationBarcodes.length; i++) {
            let indexToRemove = barcodesArr.indexOf(mergedMutationBarcodes[i]);
            if(indexToRemove > -1) {
                barcodesArr.splice(indexToRemove, 1);
                patientsWithNoMutation.splice(indexToRemove, 1);
            }
        }

            //Remove duplicate single-mutation patient elements from mutationDataForThisGene
        for(let i = 0; i < patientsWithNoMutation.length; i++) {
            let barcode = patientsWithNoMutation[i].patient_barcode;
            //See if indexOf() returns a valid index after index i and use splice() to remove duplicate entries
            while(barcodesArr.indexOf(barcode, i+1) > -1) {
                let indexToRemove = sinlgeMutationBarcodes.indexOf(barcode, i+1)
                barcodesArr.splice(indexToRemove, 1);
                patientsWithNoMutation.splice(indexToRemove, 1);
            }
        }

        //Append element to allLabels and xCounts for Wild_Type mutation
        if(patientsWithNoMutation) {
            allLabels.push("Wild_Type");
            xCounts.push(0);
        }

        for(let i = 0; i < patientsWithNoMutation.length; i++)
            patientsWithNoMutation[i].mutation_label = "Wild_Type";
        //Concatenate patientWithNoMutation and mergedMutationData
        mergedMutationData = mergedMutationData.concat(patientsWithNoMutation);

        //New array of JSONs mutation data object
        mutationDataForAllGenes = mergedMutationData;
        
        
        jsonToAppend = {gene:currentGeneSelected, mutation_data:mergedMutationData};
        //DEBUG
        console.log("JSON Object:")
        console.log(jsonToAppend)
        //DEBUG
            

        //If mutationDataForAllGenes already includes the gene of interest, then replace entry for that specific gene
        let mutationDataForAllGenesIndex = -1;
        for(let index = 0; index < mutationDataForAllGenes.length; index++) {
            if(mutationDataForAllGenes[index].gene == currentGeneSelected) {
                mutationDataForAllGenesIndex = index;
                break;
            }
        }
        if(mutationDataForAllGenesIndex >= 0) {
            //This branch triggers when the global mutation data needs to be updated
            //Replace outdated entry with current gene's worth of data
            mutationDataForAllGenes[mutationDataForAllGenesIndex] = jsonToAppend;
        }
        else
            mutationDataForAllGenes.push(jsonToAppend);
        

        //Loop over xCounts and reset all values to 0
        for(let i = 0; i < xCounts.length; i++) {
            xCounts[i] = 0;
        }

        // count number of barcodes associated with >1 mutation
        for(let i = 0; i < mergedMutationData.length; i++) {
            if(allLabels.includes(mergedMutationData[i]["mutation_label"]))
                xCounts[allLabels.indexOf(mergedMutationData[i]["mutation_label"])]++;
        }
    }
    // if mutations do NOT exist for this gene (i.e., if the gene is wild-type)
    else {
        //xCounts, allLabels should only represent the total number of patients in allCohortsBarcodes
        xCounts.push(allCohortsBarcodes.length);
        allLabels.push("Wild_Type");
        //Update global variable for mutation data with all "Wild_Type" mutation values
        let wildTypeMutationData = [];
        //Loop over allCohortsBarcodes and create JSON element for each patient with "Wild_Type" mutation value
        for(let index = 0; index < allCohortsBarcodes.length; index++) {
            let obj = {};
            obj["mutation_label"] = "Wild_Type";
            obj["patient_barcode"] = allCohortsBarcodes[index].patient_barcode;
            obj["cohort"] = allCohortsBarcodes[index].cohort;
            wildTypeMutationData.push(obj);
        }        
        //Declare jsonToAppend with necessary data
        jsonToAppend = {gene:currentGeneSelected, mutation_data:wildTypeMutationData};
        //If mutationDataForAllGenes already includes the gene of interest, then replace entry for that specific gene
        let mutationDataForAllGenesIndex = -1;
        for(let index = 0; index < mutationDataForAllGenes.length; index++) {
            if(mutationDataForAllGenes[index].gene == currentGeneSelected) {
                mutationDataForAllGenesIndex = index;
                break;
            }
        }
        if(mutationDataForAllGenesIndex >= 0) {
            //This branch triggers when the global mutation data needs to be updated
            //Replace outdated entry with current gene's worth of data
            mutationDataForAllGenes[mutationDataForAllGenesIndex] = jsonToAppend;
        }
        else
            mutationDataForAllGenes.push(jsonToAppend);
        
    }

    //Finally, filter out values with frequency counts of 0
    for(let index = 0; index < xCounts.length; index++) {
        if(xCounts[index] == 0) {
            //Remove element with splice() from xCounts and allLabels
            xCounts.splice(index, 1);
            allLabels.splice(index, 1);
        }
    }

    console.log(jsonToAppend);

    //DEBUG
    //Save mutation data to smartCache interface
    cacheMu = await getCacheMU();
    await cacheMu.saveToDBAndSaveToInterface(jsonToAppend);

    //Was the data cached?
    console.log("Cached Data after cacheMu.saveToDBAndSaveToInterface():")
    console.log(await cacheMu.db.getCollection('cohorts'))


    console.log("Result of fetchWrapperMU() after caching data: ");
    console.log(await cacheMu.fetchWrapperMU(selectedTumorTypes,[currentGeneSelected]));
    

    console.log("mutationDataForAllGenes:")
    console.log(mutationDataForAllGenes);
    //DEBUG


    return [xCounts, allLabels]
}

/** Compute clinical feature frequencies based on user's selected tumor type(s) and clinical feature(s).
  *
  * @param {array} xCounts - An empty array
  * @param {array} uniqueValuesForCurrentFeature - An empty array
  * @param {string|string[]} currentGeneSelected - One of the clinical features that was selected by the user in the clinical feature dropdown
  *
  * @returns {Array} Contains values and labels to input to Plotly data object.
  */
let computeClinicalFeatureFrequencies = async function (xCounts, uniqueValuesForCurrentFeature, currentClinicalFeatureSelected, continuous) {

    let allValuesForCurrentFeature = [];
    for(let i = 0; i < allClinicalData.length; i++)
        allValuesForCurrentFeature.push(allClinicalData[i][currentClinicalFeatureSelected]);
    
    let index = clinicalType.findIndex(x => x.name == currentClinicalFeatureSelected);
    clinicalType[index].isSelected = true;
    if (clinicalType[index].type === "continuous") {
        continuous = true;
        uniqueValuesForCurrentFeature = allValuesForCurrentFeature; // changed from uniqueValuesForCurrentFeature = allValuesForCurrentFeature.filter(onlyUnique);
    } else {
        continuous = false;
        uniqueValuesForCurrentFeature = allValuesForCurrentFeature.filter(onlyUnique);
    }
    xCounts.length = uniqueValuesForCurrentFeature.length;
    for(let i = 0; i < xCounts.length; i++)
        xCounts[i] = 0;
    for(let i = 0; i < allClinicalData.length; i++)
        for(let k = 0; k < uniqueValuesForCurrentFeature.length; k++)
            if(allClinicalData[i][currentClinicalFeatureSelected] == uniqueValuesForCurrentFeature[k])
                xCounts[k]++;

    console.log([xCounts, uniqueValuesForCurrentFeature, continuous])

    return [xCounts, uniqueValuesForCurrentFeature, continuous]

}

let setChartDimensions = async function(uniqueValuesForCurrentFeature, currentFeatureDiv) {
    let dpr = window.devicePixelRatio; // returns the ratio of the resolution in physical pixels to the resolution in CSS pixels for the current display device
    let windowWidth = window.innerWidth; // returns the interior width of the window in pixels
    let twoColLower = 675 * dpr;
    let threeColLower = 850 * dpr;
    let chartHeight;
    let chartWidth;
    /* 
    // if on mobile or tablet device, always 1 pie chart per row--> make pie chart larger
    if (dpr == 1) {
        var scalingFactor = 1;
    } else {
        scalingFactor = 1 + 2 / dpr;
    } 
    */

    // depending on window width, set column size class of plot divs
    if (windowWidth > threeColLower) {
        currentFeatureDiv.setAttribute("class", "col s4");
    } else if (windowWidth > twoColLower) {
        currentFeatureDiv.setAttribute("class", "col s5");
    } else {
        currentFeatureDiv.setAttribute("class", "col s7");
    }

    // set chart height and width
    if (windowWidth >= (1000)) {
        chartHeight = 850;
        chartWidth = 400;
    } else if (windowWidth >= (threeColLower)) {
        chartHeight = 0.8 * (windowWidth) + 80;
        chartWidth = 0.4 * (windowWidth);
    } else {
        chartHeight = 0.9 * (windowWidth) + 200;
        chartWidth = 0.5 * (windowWidth);
    }

    let legend_location_x;
    let legend_location_y;

    // if there are more than 9 labels in legend, put legend to the right
    if (uniqueValuesForCurrentFeature.length > 9) { 
        chartWidth *= 1.2;
        legend_location_x = 1.2;
        legend_location_y = 1;
        for (let i = 0; i < uniqueValuesForCurrentFeature.length; i++) {
            /*
            if (uniqueValuesForCurrentFeature[i].length > 10) {
                let shorten = ".."; // ellipses for shortening labels in the string
                let stringLength = uniqueValuesForCurrentFeature[i].length;
                //replaces the label with its shortened version
                uniqueValuesForCurrentFeature[i] = shorten.concat(uniqueValuesForCurrentFeature[i].substring(stringLength-7,stringLength));
            }
            */
        }
        if (windowWidth > threeColLower)
            windowWidth = 849 * dpr;
        else if (windowWidth > twoColLower)
            windowWidth = 674 * dpr;
    } else {
        legend_location_x = 0;
        legend_location_y = 1;
    }
    return [chartHeight, chartWidth, legend_location_x, legend_location_y]
}

/**
 * Gets the sanitized mutation data with multiple mutation records for a patient merged into a single multi-mutation entry
 * @returns The sanitized mutation data that ensures patients with multiple mutations only account for one entry per gene
 */
let getSanitizedMutationData = async function() {
    return mutationDataForAllGenes;
}