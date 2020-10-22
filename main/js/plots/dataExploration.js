let buildDataExplorePlots = async function() {

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    let mySelectedClinicalFeatures = $('.clinicalMultipleSelection').select2('data').map(clinicalInfo => clinicalInfo.text);
    console.log(mySelectedClinicalFeatures)

    console.log(clinicalQuery)

    for(let j = 0; j < mySelectedClinicalFeatures.length; j++) {

        let currentFeature = mySelectedClinicalFeatures[j];

        let allX = []; 
        for(let i = 0; i < clinicalQuery.length; i++) {
            allX.push(clinicalQuery[i][currentFeature]);
        }

        console.log(allX)

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
            title: mySelectedClinicalFeatures[j] + "",
            showlegend: false
        };
        
        Plotly.newPlot('racePie', data, layout);

    }
}