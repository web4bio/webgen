

const createCoexpressionPlot = async function (expressionData, clinicalAndMutationData) {

    document.getElementById("coexpressionLoaderDiv").classList.remove("loader");

    // Create div object for heatmap and clear

    const divObject = d3.select("#coexpressionLoaderDiv").html("");


    ///////////////////////////////////
    // 1) SAMPLE TRACK SELECTOR SETUP
    ///////////////////////////////////

    // Create div for clinical feature sample track variable selector as scrolling check box list
    // Note that we are using the Grid system for Materialize
    var gridRow = divObject.append("div");
    gridRow.attr("id", "coexpressionGridRow").attr("class", "row");
    //Append column for div options panel
    var div_optionsPanels = gridRow.append('div');
    div_optionsPanels.attr("id", "optionsPanels");
    div_optionsPanels.attr("class", "col s3");
    div_optionsPanels.style("margin-top", "30px");
    div_optionsPanels.style("padding-left", "30px");
    var div_clinSelect = div_optionsPanels.append('div');
    div_clinSelect.attr("id", "coexpressionPartitionSelector");
    div_clinSelect.append('text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Select column annotations');
    div_clinSelect.append('br')
    div_clinSelect
        .append('div')
        .attr('class', 'viewport')
        .style('overflow-y', 'scroll')
        .style('height', '365px')
        .style('width', '300px')
        .style('font-size', '14px')
        .style('text-align', 'left')
        .append('div')
        .attr('class', 'clin_selector');
    let div_selectBody = div_clinSelect.select('.clin_selector'); // body for check vbox list


    // functions to get check box selection and update text
    var choices;
    function getClinvarSelection() {
        choices = [];
        div_selectBody.selectAll('.myCheckbox').each(function(d){
            let cb = d3.select(this);
            if(cb.property('checked')){ choices.push(cb.property('value')); };
          });
        return choices
    };

    // function to create a pair of checkbox and text
    function renderCB(div_obj, id) {
        const label = div_obj.append('div');
        const label2 = label.append('label')
        label2.append('input')
            .attr('id', 'check' + id)
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('value', id)
            .on('change', function () {
                sortGroups();
                updateHeatmap();
            })
        label2.append('span')
            .text(' ' + id)
            .style('font-weight', 'normal')
            .style("color", "#5f5f5f");
    };
    // populate clinical feature sample track variable selector
    // get unique clinical features
    var clin_vars = Object.keys(clinicalAndMutationData[0]).sort();

    const unwantedKeys = new Set(['date', 'tcga_participant_barcode', 'tool']);
    clin_vars = clin_vars.filter(item => !unwantedKeys.has(item));

    clin_vars.forEach(el => renderCB(div_selectBody, el));

    // automatically check off selected boxes from clinical query box
    sampTrackVars = $('.clinicalMultipleSelection').select2('data').map((el) => el.id);
    sampTrackVars.forEach(id => {
        div_selectBody.select('#check'+id).property('checked', true);
    });


    var div_plot = gridRow.append('div');
    div_plot.attr("id", "coexpressionPanel");
    div_plot.attr("class", "col s7");


    ///////////////////////////////////
    // 2) PLOTLY GROUPED SCATTERPLOT
    ///////////////////////////////////

    console.log(expressionData)

    var trace1 = {
        x: [1, 2, 3, 4, 5],
        y: [1, 6, 3, 6, 1],
        mode: 'markers',
        type: 'scatter',
        name: 'Team A',
        text: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'],
        marker: { size: 12 }
      };
      
      var trace2 = {
        x: [1.5, 2.5, 3.5, 4.5, 5.5],
        y: [4, 1, 7, 1, 4],
        mode: 'markers',
        type: 'scatter',
        name: 'Team B',
        text: ['B-a', 'B-b', 'B-c', 'B-d', 'B-e'],
        marker: { size: 12 }
      };
      
      var data = [ trace1, trace2 ];
      
      var layout = {
        xaxis: {
          range: [ 0.75, 5.25 ]
        },
        yaxis: {
          range: [0, 8]
        },
        title: {text: ''}
      };
      
      Plotly.newPlot('coexpressionPanel', data, layout);
      



}