
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
    // Remove fields from selectedCategoricalFeatures that were previously selected but now removed
    // Iterate over keys of selectedCategoricalFeatures and remove outdated keys
    for(let key of Object.keys(selectedCategoricalFeatures)) {
        // If one of the keys in selectedCategoricalFeatures is not chosen in one of the select boxes, then remove the key
        if(!mySelectedFeatures.includes(key))
            delete selectedCategoricalFeatures[key]; // Delete key, value pair from selectedCategoricalFeatures
    }
    // Iterate over selectedContinuousFeatures and remove outdated keys
    for(let key of Object.keys(selectedContinuousFeatures)) {
        // If one of the keys in selectedContinuousFeatures is not chosen in one of the select boxes, then remove the key
        if(!mySelectedFeatures.includes(key))
            delete selectedContinuousFeatures[key]; // Delete key, value pair from selectedContinuousFeatures
    }
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
                if(unselectedFeature[0] !== unselectedFeature[0].toUpperCase()) {
                    let index = clinicalType.findIndex(x => x.name == unselectedFeature);
                    clinicalType[index].isSelected = false;
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
                    continue;
                }

                // if current feature is a gene,
                // get values and labels for this feature
                if(currentFeature[0] === currentFeature[0].toUpperCase()) {
                    let cacheMu = await getCacheMU(); // Instantiate mutation cache object
                    let mutationData = await cacheMu.fetchWrapperMU(selectedTumorTypes, [currentFeature]); // Retrieve mutation data from cache
                    let mutationCounts = computeMutationFrequencies(mutationData); // Obtain map of mutation types and their respective counts
                    uniqueValuesForCurrentFeature = Array.from(mutationCounts.keys()); // Get mutation types from keys()
                    xCounts = Array.from(mutationCounts.values()); // Get corresponding counts from values()
                    let cacheGe = await getCacheGE();
                    let geneMutationExpression = await cacheGe.fetchWrapperGE(selectedTumorTypes, [currentFeature]);                
                    await createGeneExpressionHistogram(geneMutationExpression, mutationData, currentFeature);

                // if current feature is clinical (i.e., not a gene)
                // get values and labels for this feature 
                } else {
                    let clinicalFeaturesResults = await computeClinicalFeatureFrequencies(xCounts, uniqueValuesForCurrentFeature, currentFeature, continuous);
                    xCounts = clinicalFeaturesResults[0]
                    uniqueValuesForCurrentFeature = clinicalFeaturesResults[1]
                    continuous = clinicalFeaturesResults[2]
                }

                let parentRowDiv = document.getElementById("dataexploration");        
                let newDiv = document.createElement("div");
                newDiv.setAttribute("id", currentFeature + "Div");
                newDiv.setAttribute("style", "float:left;");
                parentRowDiv.appendChild(newDiv);

                await setChartDimsAndPlot(uniqueValuesForCurrentFeature, currentFeature, xCounts, continuous);
                
                window.addEventListener("resize", function() { setChartDimsAndPlot(uniqueValuesForCurrentFeature, currentFeature, xCounts, continuous);});

                document.getElementById(currentFeature + 'Div').on('plotly_selected', function(eventData) {
                    // if continuous data range has not yet been added 
                    if(selectedContinuousFeatures.findIndex(element => element == currentFeature) == -1){
                        if(currentFeature != "pathologic_stage")
                            selectedContinuousFeatures[currentFeature] = []; // Initialize to empty array
                    }
                    if(eventData) {
                        selectedContinuousFeatures[currentFeature][0] = eventData.range.x[0];
                        selectedContinuousFeatures[currentFeature][1] = eventData.range.x[1];
                    } else
                    selectedContinuousFeatures[currentFeature] = (document.getElementById(currentFeature + 'Div')).layout.xaxis.range;
                });

                // Add on click event for pie chart
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
                            // Obtain index of slice in array
                            let sliceIndex = selectedCategoricalFeatures[currentFeature].findIndex(element => element == slice);
                            if(sliceIndex != -1){
                                let colorArray = colorOutOfSpace.buildColorCodeKeyArray(uniqueValuesForCurrentFeature)
                                colore[pts] = colorArray[pts];
                                selectedCategoricalFeatures[currentFeature].splice(sliceIndex, 1); // Call splice() method to remove element
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
        }
    }
}

/**
 * Computes the frequency of mutation types based on a user's selected gene and tumor type(s)
 * @param {Array} mutationData Array of JSONs for one or more tumor types and a selected gene
 * @returns {Map} Map of mutation types to patient counts
 */
let computeMutationFrequencies = function(mutationData) {
    let mutationCounts = new Map();
    for(patient of mutationData) {
        if(mutationCounts.has(patient.mutation_label))
            mutationCounts.set(patient.mutation_label, mutationCounts.get(patient.mutation_label)+1);
        else
            mutationCounts.set(patient.mutation_label, 1);
    }
    return mutationCounts;
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
        uniqueValuesForCurrentFeature = allValuesForCurrentFeature;
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
        currentFeatureDiv.setAttribute("class", "col s4");
    } else {
        currentFeatureDiv.setAttribute("class", "col s6");
    }

    // set chart height and width
    if (windowWidth >= (1000)) {
        chartHeight = 400;
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
 * Helper function for buildDataExplorePlots()
 * @param {String[]} uniqueValuesForCurrentFeature 
 * @param {String} currentFeature 
 * @param {Number[]} xCounts 
 * @param {Boolean} continuous 
 */
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

/**
 * Creates histograms to visualize gene expression distribution with filtering capability
 * 
 * @param {Array} geneMutationExpression - Array of objects containing gene expression data
 * @param {Array} mutationData - Array of objects containing mutation data
 * @param {String} currentFeature - The gene being analyzed
 * @returns {undefined}
 */
async function createGeneExpressionHistogram(geneMutationExpression, mutationData, currentFeature) {
    // Exit if no data is provided
    if (!geneMutationExpression || geneMutationExpression.length === 0) {
        console.log("No expression data available for this gene");
        return;
    }

    // Extract expression values for tumor samples only
    const expressionValues = [];
    const patientBarcodes = [];
    
    for (const record of geneMutationExpression) {
        // Only include tumor samples (TP)
        if (record.sample_type !== "TP") continue;
        
        const expressionValue = record.expression_log2;
        if (expressionValue !== null && expressionValue !== undefined && !isNaN(expressionValue)) {
            expressionValues.push(expressionValue);
            patientBarcodes.push(record.tcga_participant_barcode);
        }
    }

    if (expressionValues.length === 0) {
        console.log("No valid expression data available for this gene");
        return;
    }

    // Create single histogram trace (no mutation stratification)
    const histogramTrace = {
        x: expressionValues,
        type: 'histogram',
        name: `${currentFeature} Expression`,
        xbins: {
            size: calculateBinSize(expressionValues)
        },
        hovertemplate: 'Expression: %{x}<br>Count: %{y}<extra></extra>'
    };

    // Create histogram layout with native range selection
    const histogramLayout = {
        bargap: 0.05,
        height: 400,
        width: 500,
        dragmode: 'select',
        selectdirection: 'h',
        title: `${currentFeature} Expression Distribution`,
        xaxis: {
            title: 'Expression Level (log2)',
            tickfont: { size: 12 },
            rangeslider: {
                visible: false,
                thickness: 0.1
            },
            rangeselector: {
                buttons: [
                    {
                        count: 1,
                        label: 'Reset',
                        step: 'all'
                    }
                ],
                y: -0.2,
                x: 0
            }
        },
        yaxis: {
            title: 'Frequency',
            tickfont: { size: 12 }
        },
        font: {
            family: 'Arial, Helvetica, sans-serif'
        }
    };

    // Create a div for the histogram if it doesn't exist
    const parentDiv = document.getElementById("dataexploration");
    let histogramDiv = document.getElementById(currentFeature + "ExpressionDiv");
    
    if (!histogramDiv) {
        histogramDiv = document.createElement("div");
        histogramDiv.setAttribute("id", currentFeature + "ExpressionDiv");
        histogramDiv.setAttribute("style", "float:left;");
        histogramDiv.setAttribute("class", "col s6");
        parentDiv.appendChild(histogramDiv);
    }
    // Plot the histogram
    const divId = currentFeature + "ExpressionDiv";
    const gd = document.getElementById(divId);
    
    const plotConfig = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
      scrollZoom: false
    };
    
    Plotly.newPlot(gd, [histogramTrace], histogramLayout, plotConfig).then(gd => {
        const dataMin = Math.min(...expressionValues);
        const dataMax = Math.max(...expressionValues);
      
        const updateStateAndUI = (minVal, maxVal, isReset=false) => {
          // 1) Update global state FIRST
          const isFullRange = Math.abs(minVal - dataMin) < 0.01 && Math.abs(maxVal - dataMax) < 0.01;
          if (isFullRange || isReset) {
            getExpressionRangeValues(currentFeature, null);
          } else {
            getExpressionRangeValues(currentFeature, { min: minVal, max: maxVal });
          }
      
          // 2) Then update UI (guard null)
          const rangeDisplay = document.getElementById(currentFeature + "RangeDisplay");
          if (rangeDisplay) {
            if (isFullRange || isReset) {
              rangeDisplay.textContent = `All patients (${expressionValues.length})`;
            } else {
              const filteredCount = expressionValues.filter(v => v >= minVal && v <= maxVal).length;
              rangeDisplay.textContent =
                `Range: ${minVal.toFixed(2)} to ${maxVal.toFixed(2)} (${filteredCount} patients)`;
            }
          }
        };
      
        // Selection (drag box)
        gd.on('plotly_selected', ev => {
          const [minVal, maxVal] = ev?.range?.x ?? [dataMin, dataMax];
          updateStateAndUI(minVal, maxVal);
        });
      
        // Deselection (click empty space)
        gd.on('plotly_deselect', () => updateStateAndUI(dataMin, dataMax, true));
      
        // Zoom/pan/range changes
        gd.on('plotly_relayout', ev => {
          const r0 = ev['xaxis.range[0]'] ?? ev['xaxis.range']?.[0];
          const r1 = ev['xaxis.range[1]'] ?? ev['xaxis.range']?.[1];
      
          if (r0 !== undefined && r1 !== undefined) {
            updateStateAndUI(r0, r1);
          }
          if (ev['xaxis.autorange'] === true) {
            updateStateAndUI(dataMin, dataMax, true);
          }
        });
      });

    /**
     * Apply expression level filter to the patient cohort
     * This function integrates with the existing filtering system used by pie charts
     * 
     * @param {String} gene - The gene being filtered
     * @param {Object|null} range - The expression range {min, max} or null to clear filter
     */
    function getExpressionRangeValues(gene, range) {
        if (range) {
            console.log(`Applying expression filter for ${gene}: ${range.min.toFixed(2)} to ${range.max.toFixed(2)}`);

            // Store the range in selectedContinuousFeatures following the same pattern as pie charts
            selectedContinuousFeatures[gene] = [range.min, range.max];
            
            console.log('Updated selectedContinuousFeatures:', selectedContinuousFeatures);
            
        } else {
            console.log(`Clearing expression filter for ${gene}`);
            
            // Remove the filter from selectedContinuousFeatures
            if (selectedContinuousFeatures[gene]) {
                delete selectedContinuousFeatures[gene];
            }
            
            console.log('Updated selectedContinuousFeatures:', selectedContinuousFeatures);
        }
    }

    /**
     * Helper function to calculate appropriate bin size based on data distribution
     * 
     * @param {Array} data - Array of expression values
     * @returns {Number} - Appropriate bin size
     */
    function calculateBinSize(data) {
        // Calculate IQR (Interquartile Range) based bin size using Freedman-Diaconis rule
        if (data.length < 2) return 0.5; // Default if not enough data
        
        // Sort the data
        const sortedData = [...data].sort((a, b) => a - b);
        
        // Find min and max
        const min = sortedData[0];
        const max = sortedData[sortedData.length - 1];
        
        // If range is too small, use a default bin size
        if (max - min < 0.1) return 0.1;
        
        // Calculate quartiles
        const q1Index = Math.floor(sortedData.length * 0.25);
        const q3Index = Math.floor(sortedData.length * 0.75);
        const q1 = sortedData[q1Index];
        const q3 = sortedData[q3Index];
        const iqr = q3 - q1;
        
        // Freedman-Diaconis rule: 2 * IQR * n^(-1/3)
        const binSize = 2 * iqr * Math.pow(data.length, -1/3);
        
        // If calculated bin size is too small or too large, use reasonable defaults
        if (binSize < 0.1 || isNaN(binSize)) return 0.5;
        if (binSize > 5) return 2;
        
        return binSize;
    }

}