

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

    function renderRadioButton(div_obj, id) {
        const label = div_obj.append('div').attr("class", "radio-container");
        const label2 = label.append('label');
        label2.append('input')
            .attr('type', 'radio')
            .attr('class', 'myRadioButton')
            .attr('name', 'clinicalFeature') // Ensures only one selection
            .attr('value', id)
            .on('change', function () {
                updatePlot(); // Update plot when radio button is changed
            });
        label2.append('span')
            .text(' ' + id)
            .style('font-weight', 'normal')
            .style("color", "#5f5f5f");
    }
    
    // Populate clinical feature selection radio buttons
    var clin_vars = Object.keys(clinicalAndMutationData[0]).sort();
    const unwantedKeys = new Set(['date', 'tcga_participant_barcode', 'tool']);
    clin_vars = clin_vars.filter(item => !unwantedKeys.has(item));
    clin_vars.forEach(el => renderRadioButton(div_selectBody, el));

    ///////////////////////////////////
    // 2) FUNCTION TO UPDATE PLOT
    ///////////////////////////////////

    async function updatePlot() {
        const selectedX = document.getElementById("xGeneDropdown")?.value;
        const selectedY = document.getElementById("yGeneDropdown")?.value;
    
        if (!selectedX || !selectedY) return;
    
        let selectedX_expression = expressionData.filter(item => item.gene === selectedX);
        let selectedY_expression = expressionData.filter(item => item.gene === selectedY);
    
        const xValues = selectedX_expression.map(d => d.expression_log2);
        const yValues = selectedY_expression.map(d => d.expression_log2);
    
        function pearsonCorrelation(x, y) {
            const n = x.length;
            const meanX = d3.mean(x);
            const meanY = d3.mean(y);
            const numerator = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
            const denominator = Math.sqrt(d3.sum(x.map(xi => (xi - meanX) ** 2)) * d3.sum(y.map(yi => (yi - meanY) ** 2)));
            return denominator === 0 ? 0 : (numerator / denominator).toFixed(3);
        }
    
        const rValue = pearsonCorrelation(xValues, yValues);
        const selectedClinicalVar = document.querySelector('.myRadioButton:checked')?.value;
    
        // Join by TCGA participant barcode
        const clinicalMap = new Map(clinicalAndMutationData.map(d => [d.tcga_participant_barcode, d]));

        const combinedData = selectedX_expression.map((xObj, i) => {
            const barcode = xObj.sample || xObj.tcga_participant_barcode;
            const yObj = selectedY_expression.find(y => y.sample === barcode || y.tcga_participant_barcode === barcode);
            const clinical = clinicalMap.get(barcode);

            if (!yObj || !clinical) return null;

            return {
                x: xObj.expression_log2,
                y: yObj.expression_log2,
                clinicalValue: selectedClinicalVar ? clinical[selectedClinicalVar] ?? "NA" : "All"
            };
        }).filter(d => d !== null);

    
        const uniqueGroups = [...new Set(combinedData.map(d => d.clinicalValue))];
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueGroups);
    
        const traces = [];
    
        // Scatter points
        traces.push({
            x: combinedData.map(d => d.x),
            y: combinedData.map(d => d.y),
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 10,
                color: combinedData.map(d => colorScale(d.clinicalValue))
            },
            text: combinedData.map(d => `${selectedClinicalVar || "Clinical Feature"}: ${d.clinicalValue}`),
            name: '',
            showlegend: false
        });
    
        // Regression lines
        if (selectedClinicalVar) {
            for (const group of uniqueGroups) {
                const groupData = combinedData.filter(d => d.clinicalValue === group);
                if (groupData.length < 2) continue;
    
                const regression = d3.regressionLinear()
                    .x(d => d.x)
                    .y(d => d.y)(groupData);
    
                const lineX = regression.map(d => d[0]);
                const lineY = regression.map(d => d[1]);
    
                traces.push({
                    x: lineX,
                    y: lineY,
                    mode: 'lines',
                    type: 'scatter',
                    name: `Fit: ${group}`,
                    line: { color: colorScale(group), width: 2, dash: 'solid' }
                });
            }
        } else {
            // Single global regression
            const regression = d3.regressionLinear()
                .x(d => d.x)
                .y(d => d.y)(combinedData);
    
            const lineX = regression.map(d => d[0]);
            const lineY = regression.map(d => d[1]);
    
            traces.push({
                x: lineX,
                y: lineY,
                mode: 'lines',
                type: 'scatter',
                name: 'Fit (all data)',
                line: { color: 'black', width: 2, dash: 'dot' }
            });
        }
    
        const layout = {
            xaxis: { title: selectedX },
            yaxis: { title: selectedY },
            title: { text: `Gene Expression (Log2) | r = ${rValue}` }
        };
    
        Plotly.newPlot("coexpressionPanel", traces, layout);
    }
    
    
    ///////////////////////////////////
    // 3) DROPDOWNS FOR GENE SELECTION
    ///////////////////////////////////

    getValidGeneList().then((validGeneList) => {

        // get unique gene names from genes user selected in gene 2 select box
        let submittedGenes = [...new Set(expressionData.map(item => item.gene))];

        div_optionsPanels.append('label').text("Select X-Axis Gene:");
        var xDropdown = div_optionsPanels.append("select").attr("id", "xGeneDropdown").style("display", "block");
        submittedGenes.forEach(gene => xDropdown.append("option").attr("value", gene).text(gene));

        div_optionsPanels.append('label').text("Select Y-Axis Gene:");
        var yDropdown = div_optionsPanels.append("select").attr("id", "yGeneDropdown").style("display", "block");
        submittedGenes.forEach(gene => yDropdown.append("option").attr("value", gene).text(gene));

        // default values for scatterplot are the first two that the user selected
        document.getElementById("xGeneDropdown").value = submittedGenes[0];
        document.getElementById("yGeneDropdown").value = submittedGenes[1];

        document.getElementById("xGeneDropdown").addEventListener("change", updatePlot);
        document.getElementById("yGeneDropdown").addEventListener("change", updatePlot);

        gridRow.append('div').attr("id", "coexpressionPanel").attr("class", "col s7").style('height', '550px');

        updatePlot(); // Initial plot
    });

};
