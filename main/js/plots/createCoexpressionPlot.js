

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
    // 2) DROPDOWNS FOR GENE SELECTION
    ///////////////////////////////////

    // Fetch the valid gene list and populate dropdowns
    getValidGeneList().then((validGeneList) => {

        // Dropdown for X-Axis selection
        div_optionsPanels.append('label').text("Select X-Axis Gene:");
        var xDropdown = div_optionsPanels.append("select").attr("id", "xGeneDropdown").style("display", "block");
        validGeneList.forEach(gene => xDropdown.append("option").attr("value", gene).text(gene));

        // Dropdown for Y-Axis selection
        div_optionsPanels.append('label').text("Select Y-Axis Gene:");
        var yDropdown = div_optionsPanels.append("select").attr("id", "yGeneDropdown").style("display", "block");
        validGeneList.forEach(gene => yDropdown.append("option").attr("value", gene).text(gene));

        // Set initial values
        document.getElementById("xGeneDropdown").value = "TP53";
        document.getElementById("yGeneDropdown").value = "KRAS";

        ///////////////////////////////////
        // 3) FUNCTION TO UPDATE PLOT
        ///////////////////////////////////

        async function updatePlot() {
            const selectedX = document.getElementById("xGeneDropdown").value;
            const selectedY = document.getElementById("yGeneDropdown").value;

            // Fetch the expression data for selected genes
            let selectedX_expression = await firebrowse.fetchmRNASeq({cohorts: selectedTumorTypes, genes: [selectedX]});
            let selectedY_expression = await firebrowse.fetchmRNASeq({cohorts: selectedTumorTypes, genes: [selectedY]});

            // Extract log2 expression values for selected genes
            const xValues = selectedX_expression.filter(d => d.gene === selectedX).map(d => d.expression_log2);
            const yValues = selectedY_expression.filter(d => d.gene === selectedY).map(d => d.expression_log2);

            // Get the clinical variable selected in the checkboxes
            const selectedClinicalVar = [];
            document.querySelectorAll('.myCheckbox:checked').forEach(checkbox => {
                selectedClinicalVar.push(checkbox.value);
            });

            // Create a mapping of clinical feature values for each sample
            const clinicalData = clinicalAndMutationData.map(sample => {
                const clinicalValues = selectedClinicalVar.map(variable => sample[variable]);
                return { x: sample[selectedX], y: sample[selectedY], clinicalValues };
            });

            // Color points based on the clinical variable(s)
            const colorMap = d3.scaleOrdinal(d3.schemeCategory10); // You can adjust the color scheme

            const trace = {
                x: xValues,
                y: yValues,
        mode: 'markers',
        type: 'scatter',
                name: 'Gene Expression (log2)',
                marker: {
                    size: 12,
                    color: clinicalData.map(d => colorMap(d.clinicalValues.join("-"))), // Color based on the clinical variable(s)
                }
            };

            const layout = {
                xaxis: { title: selectedX },
                yaxis: { title: selectedY },
                title: { text: 'Gene Expression Scatterplot' },
            };

            // Render the plot
            Plotly.newPlot("coexpressionPanel", [trace], layout);
        }

        // Add event listeners to dropdowns to update the plot on change
        document.getElementById("xGeneDropdown").addEventListener("change", updatePlot);
        document.getElementById("yGeneDropdown").addEventListener("change", updatePlot);

        // Set initial plot using first two genes
        updatePlot();
    });

    var div_plot = gridRow.append('div').attr("id", "coexpressionPanel").attr("class", "col s7");
};
