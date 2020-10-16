let buildExplorePlots = async function(clinicalQuery) {

    console.log(clinicalQuery);
    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    let buildGenderPie = async function() {

        let allGenders = [];
        for(let i = 0; i < clinicalQuery.length; i++)
            allGenders.push(clinicalQuery[i].gender);
    
        let uniqueGenders = allGenders.filter(onlyUnique);
      
        let genderCounts = [];
        genderCounts.length = uniqueGenders.length;
        for(let i = 0; i < genderCounts.length; i++)
            genderCounts[i] = 0;
        
        for(let i = 0; i < clinicalQuery.length; i++) 
            for(let j = 0; j < uniqueGenders.length; j++) 
                if(clinicalQuery[i].gender == uniqueGenders[j]) 
                    genderCounts[j]++;
    
        var data = [{
            values: genderCounts,
            labels: uniqueGenders,
            type: 'pie',
            textinfo: "label+percent",
            textposition: "outside"
        }];
        
        var layout = {
            height: 400,
            width: 500,
            title: 'Genders',
            showlegend: false
        };
        
        Plotly.newPlot('genderPie', data, layout);

        document.getElementById('genderPie').on('plotly_click', function(data){
            var pts = '';
            for(let i = 0; i < data.points.length; i++){
                pts = 'Label: ' + data.points[0].label + ' Value: ' + data.points[0].value;
            }
            alert(pts);
          });
    }

    let buildEthnicityPie = async function() {

        let allEthnicities = [];
        for(let i = 0; i < clinicalQuery.length; i++)
            allEthnicities.push(clinicalQuery[i].ethnicity);
    
        let uniqueEthnicities = allEthnicities.filter(onlyUnique);
      
        let ethnicityCounts = [];
        ethnicityCounts.length = uniqueEthnicities.length;
        for(let i = 0; i < ethnicityCounts.length; i++)
        ethnicityCounts[i] = 0;
        
        for(let i = 0; i < clinicalQuery.length; i++) 
            for(let j = 0; j < uniqueEthnicities.length; j++) 
                if(clinicalQuery[i].ethnicity == uniqueEthnicities[j]) 
                    ethnicityCounts[j]++;
    
        var data = [{
            values: ethnicityCounts,
            labels: uniqueEthnicities,
            type: 'pie',
            textinfo: "label+percent",
            textposition: "outside"
        }];
        
        var layout = {
            height: 400,
            width: 500,
            title: 'Ethnicities',
            showlegend: false
        };
        
        Plotly.newPlot('ethnicityPie', data, layout);

        document.getElementById('ethnicityPie').on('plotly_click', function(data){
            var pts = '';
            for(let i = 0; i < data.points.length; i++){
                pts = 'Label: ' + data.points[0].label + ' Value: ' + data.points[0].value;
            }
            alert(pts);
          });
    }

    let buildRacePie = async function() {

        let allRaces = [];
        for(let i = 0; i < clinicalQuery.length; i++)
            allRaces.push(clinicalQuery[i].race);
    
        let uniqueRaces = allRaces.filter(onlyUnique);
      
        let raceCounts = [];
        raceCounts.length = uniqueRaces.length;
        for(let i = 0; i < raceCounts.length; i++)
        raceCounts[i] = 0;
        
        for(let i = 0; i < clinicalQuery.length; i++) 
            for(let j = 0; j < uniqueRaces.length; j++) 
                if(clinicalQuery[i].race == uniqueRaces[j]) 
                    raceCounts[j]++;
    
        var data = [{
            values: raceCounts,
            labels: uniqueRaces,
            type: 'pie',
            textinfo: "label+percent",
            textposition: "outside"
        }];
        
        var layout = {
            height: 400,
            width: 500,
            title: 'Races',
            showlegend: false
        };
        
        Plotly.newPlot('racePie', data, layout);

        document.getElementById('racePie').on('plotly_click', function(data){
            var pts = '';
            for(let i = 0; i < data.points.length; i++){
                pts = 'Label: ' + data.points[0].label + ' Value: ' + data.points[0].value;
            }
            alert(pts);
          });
    }



    buildGenderPie();

    buildEthnicityPie();

    buildRacePie();

}