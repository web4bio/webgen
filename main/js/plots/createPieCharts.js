
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Generate pie charts for selected features ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

let selectedData = [];
let selectedRange = [];
let sliceColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
'#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

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
    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
    mySelectedFeatures = mySelectedGenes.concat(mySelectedClinicalFeatures)

    // if no features are selected, do not display any pie charts
    if(mySelectedFeatures.length == 0) {
        document.getElementById('dataexploration').innerHTML = ""

    // if feature(s) is/are selected, display pie chart(s)
    } else {

        // clear all previous plots that were displayed
        document.getElementById('dataexploration').innerHTML = "";

        // get total number of barcodes for selected cancer type(s)
        let myCohort = $(".cancerTypeMultipleSelection")
            .select2("data")
            .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
        let countQuery = await firebrowse.fetchCounts(myCohort);
        let totalNumberBarcodes = 0;
        for(let i = 0; i < countQuery.length; i++) {
            totalNumberBarcodes += parseInt(countQuery[i].mrnaseq);
        // reset isSelected, so when a plot is deleted the clinicalType arr is updated
        for(let j = 0; j < clinicalType.length; j++){
            clinicalType[j].isSelected = false;
        }
        // loop through each selected clinical feature
        for(let i = 0; i < mySelectedFeatures.length; i++) {

            let continuous = false;
            let currentFeature = mySelectedFeatures[i];
            let uniqueValuesForCurrentFeature = [];
            let xCounts = [];

            // if current feature is a gene,
            // get values and labels for this feature
            if(currentFeature[0] === currentFeature[0].toUpperCase()) {
                
                let geneResults = await computeGeneMutationFrequencies(xCounts, uniqueValuesForCurrentFeature, totalNumberBarcodes, currentFeature);
                xCounts = geneResults[0]
                uniqueValuesForCurrentFeature = geneResults[1]

            // if current feature is clinical (i.e., not a gene)
            // get values and labels for this feature
            } else {

                let clinicalFeaturesResults = await computeClinicalFeatureFrequencies(xCounts, uniqueValuesForCurrentFeature, currentFeature);
                xCounts = clinicalFeaturesResults[0]
                uniqueValuesForCurrentFeature = clinicalFeaturesResults[1]

            }

            let chartDimensions = await setChartDimensions()
            let chartHeight = chartDimensions[0]
            let chartWidth = chartDimensions[1]
            let windowWidth = chartDimensions[2]
            let threeColLower = chartDimensions[3]
            let twoColLower = chartDimensions[4]

            let legendLocation = await setLegendLocation(chartWidth, uniqueValuesForCurrentFeature, threeColLower, twoColLower)
            let locationX = legendLocation[0]
            let locationY = legendLocation[1]


            var data = [{
                values: xCounts,
                labels: uniqueValuesForCurrentFeature,
                type: 'pie',
                textinfo: "none",
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
                //y: xCounts,
                hovertemplate: '<b>Number of samples:</b> %{y}<br>'+
                               '<extra></extra>',
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
                title: currentFeature + "",
                showlegend: true,
                legend: {

                    // maxWidth: 5,

                    x:locationX,
                    y:locationY,
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
                bargap: 0.05,
                height: 400,
                width: 500,
                title: currentFeature + "",
                showlegend: false,
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

            // different number of columns depending on window width

            if (windowWidth>threeColLower){
                newDiv.setAttribute("class", "col s4");
            }
            else if (windowWidth>twoColLower){

                newDiv.setAttribute("class", "col s5");
            }
            else{
                newDiv.setAttribute("class", "col s7");
            }
            newDiv.setAttribute("id", currentFeature + "Div");
            parentRowDiv.appendChild(newDiv);

            if(continuous){
                Plotly.newPlot(currentFeature + 'Div', histo_data, histo_layout, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
            }
            else{
                Plotly.newPlot(currentFeature + 'Div', data, layout, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
            }
            
            function updatePlots() { //if window is resized, this function will be called to replot the pie charts and continuous data charts
                //console.log('Full inner window size:' + window.innerWidth);
                //console.log('DPR: '+ dpr);


                windowWidth=window.innerWidth;
                if (windowWidth>(threeColLower)){
                    newDiv.setAttribute("class", "col s4");
                }
                else if (windowWidth>(twoColLower)){

                    newDiv.setAttribute("class", "col s5");
                }
                else{
                    newDiv.setAttribute("class", "col s7");
                }
                //pie chart size

                if (windowWidth>1000){
                    chartHeight=850;
                    chartWidth=400;
                }
                // resizing parameters for different number of columns
                else if (windowWidth>threeColLower){
                    chartHeight=0.8*(windowWidth)+80;
                    chartWidth=0.4*(windowWidth);
                }else if (windowWidth>twoColLower){
                    chartHeight=0.9*(windowWidth)+200;
                    chartWidth=0.5*(windowWidth);
                }
                else{
                    chartHeight=850;
                    chartWidth=400;
                }
                
                //legend location
                if(uniqueValuesForCurrentFeature.length>9){
                    chartWidth=chartWidth*1.2;
                    locationX=1.2;
                    locationY=1;
                    for(let i=0; i<uniqueValuesForCurrentFeature.length; i++){
                        if(uniqueValuesForCurrentFeature[i].length>10){
                            var shorten=".."; //ellipses for shortening labels in the string
                            var stringLength=uniqueValuesForCurrentFeature[i].length;
                            //replaces the label with its shortened version
                            uniqueValuesForCurrentFeature[i]=shorten.concat(uniqueValuesForCurrentFeature[i].substring(stringLength-7,stringLength));
                        }
                    }
                    if (windowWidth>threeColLower){
                        windowWidth=849*dpr;
                    }
                    else if(windowWidth>twoColLower){
                        windowWidth=674*dpr;
                    }
                }else{
                    locationX=0;
                    locationY=1;
                }
                
                var data = [{
                    values: xCounts,
                    labels: uniqueValuesForCurrentFeature,
                    type: 'pie',
                    textinfo: "none",
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
                    hovertemplate: '<b>Number of samples:</b> %{y}<br>'+
                                   '<extra></extra>',
                    type: 'histogram'
                }];

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

                var layoutNew = {
                    height: chartHeight,
                    width: chartWidth,
                    title: currentFeature + "",
                    showlegend: true,
                    legend: {
                        x:locationX,
                        y:locationY,
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

                var histo_layoutNew = {
                    bargap: 0.05,
                    height: 400,
                    width: 500,
                    title: currentFeature + "",
                    showlegend: false,
                    xaxis: {
                        rangeselector: {},
                        rangeslider: {}
                    },
                    yaxis: {
                        fixedrange: true
                    }
                };
                let checkIfNumeric = function() {

                    if((uniqueValuesForCurrentFeature.length==1)&&(uniqueValuesForCurrentFeature[0]=="Wild_Type")){
                        continuous = false;
                    }
                    else{
                        var numbers = /^[0-9/.]+$/;
                        var firstElement = (uniqueValuesForCurrentFeature[0]).match(numbers);
                        var secondElement = (uniqueValuesForCurrentFeature[1]).match(numbers);
                        if((firstElement != null || secondElement != null) & (currentFeature != 'vital_status')){
                            continuous = true;
                        }
                    }
                }


                checkIfNumeric();
                if(continuous){
                    Plotly.newPlot(currentFeature + 'Div', histo_data, histo_layoutNew, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
                    }
                if(continuous==false){
                    Plotly.newPlot(currentFeature + 'Div', data, layoutNew, config, {scrollZoom: true}).then(gd => {gd.on('plotly_legendclick', () => false)});
                    }
            }
            window.addEventListener("resize", updatePlots);
            ////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////
            //////////////////////// On-click event for pie charts below ///////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////

            document.getElementById(currentFeature + 'Div').on('plotly_relayout', function(data) {
                //checks if continuous data range has been added yet
                if(selectedRange.findIndex(element => element == currentFeature) == -1){
                    if(currentFeature != "pathologic_stage") {
                        selectedRange.push(currentFeature);
                    }
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
                        let colorArray = colorOutOfSpace.buildColorCodeKeyArray(uniqueValuesForCurrentFeature)
                        colore[pts] = colorArray[pts];
                        selectedData[currentFeature].pop(slice);
                    }
                    else {
                        selectedData[currentFeature].push(slice);
                        colore[pts] = '#FFF34B';
                    }
                }
                else {
                    selectedData[currentFeature] = [slice];
                    colore[pts] = '#FFF34B';
                }
                colorOutOfSpace.updateYellowAt(currentFeature, slice)
                var update = {'marker': {colors: colore,
                                        line: {color: 'black', width: 1}}};
                Plotly.restyle(currentFeature + 'Div', update, [tn], {scrollZoom: true});
            });
        }
    }
}}

/** Compute gene mutation frequencies based on user's selected tumor type(s) and gene(s).
  *
  * @param {array} xCounts - An empty array
  * @param {array} uniqueValuesForCurrentFeature - An empty array
  * @param {number} totalNumberBarcodes - The total number of unique barcodes among the selected tumor type(s)
  * @param {string|string[]} currentGeneSelected - One of the genes that was selected by the user in the first gene dropdown
  *
  * @returns {Array} Contains values and labels to input to Plotly data object.
  */
 let computeGeneMutationFrequencies = async function(xCounts, uniqueValuesForCurrentFeature, totalNumberBarcodes, currentGeneSelected) {

    let allVariantClassifications = [];
    let allBarcodes = []; // barcodes that correspond to a mutation
    await getAllVariantClassifications(currentGeneSelected).then(function(result) { // get all mutations that exist for this gene and cancer type

        let mutationsForThisGene = result;

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

    return [xCounts, uniqueValuesForCurrentFeature]

}

/** Compute clinical feature frequencies based on user's selected tumor type(s) and clinical feature(s).
  *
  * @param {array} xCounts - An empty array
  * @param {array} uniqueValuesForCurrentFeature - An empty array
  * @param {string|string[]} currentGeneSelected - One of the clinical features that was selected by the user in the clinical feature dropdown
  *
  * @returns {Array} Contains values and labels to input to Plotly data object.
  */
let computeClinicalFeatureFrequencies = async function (xCounts, uniqueValuesForCurrentFeature, currentClinicalFeatureSelected) {
    let allValuesForCurrentFeature = [];

    for(let i = 0; i < allClinicalData.length; i++)
        allValuesForCurrentFeature.push(allClinicalData[i][currentClinicalFeatureSelected]);

    var index = clinicalType.findIndex(p => p.name == currentClinicalFeatureSelected);
    clinicalType[index].isSelected = true;
    if(clinicalType[index].type === "continuous"){
        continuous = true;
        uniqueValuesForCurrentFeature = allValuesForCurrentFeature; // changed from uniqueValuesForCurrentFeature = allValuesForCurrentFeature.filter(onlyUnique);
    }
    else{
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

    return [xCounts, uniqueValuesForCurrentFeature]

}

let setChartDimensions = async function() {
    var dpr=window.devicePixelRatio;
    var threeColLower=850*dpr;
    var twoColLower=675*dpr;
    //if on mobile or tablet device, always 1 pie chart per row--> make pie chart larger
    // if (dpr==1){
    //     var scalingFactor=1;
    // }
    // else{
    //     scalingFactor=1+2/dpr;
    // }

    var windowWidth=window.innerWidth;
    //pie chart size
    if (window.innerWidth>(1000)){
        var chartHeight=850;
        var chartWidth=400;
    }
    //sizing parameters for different number of columns
    else if (windowWidth>(threeColLower)){
        chartHeight=0.8*(windowWidth)+80;
        chartWidth=0.4*(windowWidth);
    }else if (windowWidth>(twoColLower)){
        chartHeight=0.9*(windowWidth)+200;
        chartWidth=0.5*(windowWidth);
    }else{
        chartHeight=850;
        chartWidth=400;
    }

    return [chartHeight, chartWidth, windowWidth, threeColLower, twoColLower]
}

//legend location
let setLegendLocation = async function(chartWidth, uniqueValuesForCurrentFeature, threeColLower, twoColLower) {
    if(uniqueValuesForCurrentFeature.length>9){ //puts legend to the right if there are more than 9 labels in legend 
        chartWidth=chartWidth*1.2;
        locationX=1.2;
        locationY=1;
        for(let i=0; i<uniqueValuesForCurrentFeature.length; i++){
            if(uniqueValuesForCurrentFeature[i].length>10){
                var shorten=".."; //ellipses for shortening labels in the string
                var stringLength=uniqueValuesForCurrentFeature[i].length;
                //replaces the label with its shortened version
                uniqueValuesForCurrentFeature[i]=shorten.concat(uniqueValuesForCurrentFeature[i].substring(stringLength-7,stringLength));
            }
        }
        if (windowWidth>threeColLower){
            windowWidth=849*dpr;
        }
        else if(windowWidth>twoColLower){
            windowWidth=674*dpr;
        }
    }else{
        locationX=0;
        locationY=1;
    }
    return [locationX, locationY]
}
