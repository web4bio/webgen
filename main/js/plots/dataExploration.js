let buildDataExplorePlots = async function() {

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);

    let currentFeature = mySelectedClinicalFeatures[mySelectedClinicalFeatures.length-1];

    let allX = []; 
    for(let i = 0; i < clinicalQuery.length; i++) {
        allX.push(clinicalQuery[i][currentFeature]);
    }

    let uniqueX = allX.filter(onlyUnique);

    let xCounts = [];
    xCounts.length = uniqueX.length;
    for(let i = 0; i < xCounts.length; i++)
    xCounts[i] = 0;
    
    for(let i = 0; i < clinicalQuery.length; i++) 
        for(let k = 0; k < uniqueX.length; k++) 
            if(clinicalQuery[i][currentFeature] == uniqueX[k]) 
                xCounts[k]++;

    var data = [{
        values: xCounts,
        labels: uniqueX,
        type: 'pie',
        textinfo: "label+percent",
        textposition: "outside"
    }];
    
    var layout = {
        height: 400,
        width: 500,
        title: currentFeature + "",
        showlegend: false
    };

    let parentRowDiv = document.getElementById("dataexploration");        
    let newDiv = document.createElement("div");
    newDiv.setAttribute("class", "col s4");
    newDiv.setAttribute("id", currentFeature + "Div");
    parentRowDiv.appendChild(newDiv);
    
    Plotly.newPlot(currentFeature + 'Div', data, layout);

}