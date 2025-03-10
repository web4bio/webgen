

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
    div_clinSelect.append('br');

    // Scrollable box for checkboxes
    var div_checklist = div_clinSelect.append('div')
        .attr('class', 'viewport')
        .style('overflow-y', 'scroll')
        .style('height', '365px')
        .style('width', '100%')
        .style('font-size', '14px')
        .style('text-align', 'left');

    var div_selectBody = div_checklist.append('div').attr('class', 'clin_selector'); // This is where checkboxes go

    function renderCB(div_obj, id) {
        const label = div_obj.append('div').attr("class", "checkbox-container");
        const label2 = label.append('label');
        label2.append('input')
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('value', id)
            .on('change', function () {
                updatePlot(); // Update plot when checkbox is changed
            });
        label2.append('span')
            .text(' ' + id)
            .style('font-weight', 'normal')
            .style("color", "#5f5f5f");
    }

    // Populate clinical feature selection checkboxes
    var clin_vars = Object.keys(clinicalAndMutationData[0]).sort();
    const unwantedKeys = new Set(['date', 'tcga_participant_barcode', 'tool']);
    clin_vars = clin_vars.filter(item => !unwantedKeys.has(item));
    clin_vars.forEach(el => renderCB(div_selectBody, el));

    ///////////////////////////////////
    // 2) FUNCTION TO UPDATE PLOT
    ///////////////////////////////////

    async function updatePlot() {
        const selectedX = document.getElementById("xGeneDropdown")?.value;
        const selectedY = document.getElementById("yGeneDropdown")?.value;
    
        if (!selectedX || !selectedY) return;
    
        let selectedX_expression = await firebrowse.fetchmRNASeq({cohorts: selectedTumorTypes, genes: [selectedX]});
        let selectedY_expression = await firebrowse.fetchmRNASeq({cohorts: selectedTumorTypes, genes: [selectedY]});
    
        const xValues = selectedX_expression.filter(d => d.gene === selectedX).map(d => d.expression_log2);
        const yValues = selectedY_expression.filter(d => d.gene === selectedY).map(d => d.expression_log2);
    
        // Compute Pearson correlation coefficient
        function pearsonCorrelation(x, y) {
            const n = x.length;
            const meanX = d3.mean(x);
            const meanY = d3.mean(y);
            const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
            const denominator = Math.sqrt(d3.sum(x.map(xi => (xi - meanX) ** 2)) * d3.sum(y.map(yi => (yi - meanY) ** 2)));
            return denominator === 0 ? 0 : (numerator / denominator).toFixed(3);
        }
    
        const rValue = pearsonCorrelation(xValues, yValues);
    
        const selectedClinicalVar = document.querySelector('.myCheckbox:checked')?.value;
    
        const clinicalData = clinicalAndMutationData.map(sample => ({
            x: sample[selectedX],
            y: sample[selectedY],
            clinicalValue: selectedClinicalVar ? sample[selectedClinicalVar] : "None"
        }));
    
        const uniqueClinicalValues = [...new Set(clinicalData.map(d => d.clinicalValue))];
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueClinicalValues);
    
        const colors = clinicalData.map(d => colorScale(d.clinicalValue));
    
        const trace = {
            x: xValues,
            y: yValues,
            mode: 'markers',
            type: 'scatter',
            name: 'Gene Expression (log2)',
            marker: { size: 12, color: colors },
            text: clinicalData.map(d => `${selectedClinicalVar || "Clinical Feature"}: ${d.clinicalValue}`)
        };
    
        const layout = { 
            xaxis: { title: selectedX }, 
            yaxis: { title: selectedY }, 
            title: { text: `Gene Expression (Log2) | r = ${rValue}` }
        };
    
        Plotly.newPlot("coexpressionPanel", [trace], layout);
    }
    
    ///////////////////////////////////
    // 3) DROPDOWNS FOR GENE SELECTION
    ///////////////////////////////////

    getValidGeneList().then((validGeneList) => {
        div_optionsPanels.append('label').text("Select X-Axis Gene:");
        var xDropdown = div_optionsPanels.append("select").attr("id", "xGeneDropdown").style("display", "block");
        validGeneList.forEach(gene => xDropdown.append("option").attr("value", gene).text(gene));

        div_optionsPanels.append('label').text("Select Y-Axis Gene:");
        var yDropdown = div_optionsPanels.append("select").attr("id", "yGeneDropdown").style("display", "block");
        validGeneList.forEach(gene => yDropdown.append("option").attr("value", gene).text(gene));

        document.getElementById("xGeneDropdown").value = "TP53";
        document.getElementById("yGeneDropdown").value = "KRAS";

        document.getElementById("xGeneDropdown").addEventListener("change", updatePlot);
        document.getElementById("yGeneDropdown").addEventListener("change", updatePlot);

        updatePlot(); // Initial plot
    });

    var div_plot = gridRow.append('div').attr("id", "coexpressionPanel").attr("class", "col s7");
};
