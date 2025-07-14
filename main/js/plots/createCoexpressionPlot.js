const createCoexpressionPlot = async function (expressionData, clinicalAndMutationData) {
    document.getElementById("coexpressionLoaderDiv").classList.remove("loader");

    const divObject = d3.select("#coexpressionLoaderDiv").html("");

    ///////////////////////////////////
    // 1) LAYOUT + TOGGLE SWITCH
    ///////////////////////////////////
    const gridRow = divObject.append("div").attr("id", "coexpressionGridRow").attr("class", "row");
    const div_optionsPanels = gridRow.append('div')
        .attr("id", "optionsPanels")
        .attr("class", "col s3")
        .style("margin-top", "30px")
        .style("padding-left", "30px");

        const toggleContainer = div_optionsPanels.append('div')
        .attr('class', 'switch')
        .style('margin-bottom', '20px');
    
        toggleContainer.html(`
            <label style="font-weight:bold;font-size:14px;">
                Raw
                <input type="checkbox" id="logToggle" checked>
                <span class="lever"></span>
                Log2
            </label>
        `);
        
        d3.select('#logToggle').on('change', updatePlot);
    

    // Clinical variable selector
    const div_clinSelect = div_optionsPanels.append('div').attr("id", "coexpressionPartitionSelector");
    div_clinSelect.append('text')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Color Plot by Feature');
    div_clinSelect.append('br');

    const div_checklist = div_clinSelect.append('div')
        .attr('class', 'viewport')
        .style('overflow-y', 'scroll')
        .style('height', '365px')
        .style('width', '100%')
        .style('font-size', '14px')
        .style('text-align', 'left');

    const div_selectBody = div_checklist.append('div').attr('class', 'clin_selector');

    function renderRadioButton(div_obj, id) {
        const label = div_obj.append('div').attr("class", "radio-container");
        const label2 = label.append('label');
        label2.append('input')
            .attr('type', 'radio')
            .attr('class', 'myRadioButton')
            .attr('name', 'clinicalFeature')
            .attr('value', id)
            .on('change', () => updatePlot());
        label2.append('span')
            .text(' ' + id)
            .style('font-weight', 'normal')
            .style("color", "#5f5f5f");
    }

    const clin_vars = Object.keys(clinicalAndMutationData[0])
        .filter(k => !['date', 'tcga_participant_barcode', 'tool'].includes(k))
        .sort();
    clin_vars.forEach(el => renderRadioButton(div_selectBody, el));

    ///////////////////////////////////
    // 2) PLOTTING FUNCTION
    ///////////////////////////////////
    async function updatePlot() {
        const selectedX = document.getElementById("xGeneDropdown")?.value;
        const selectedY = document.getElementById("yGeneDropdown")?.value;
        const useLog = document.getElementById("logToggle")?.checked ?? true;
        if (!selectedX || !selectedY) return;

        const selectedX_expression = expressionData.filter(item => item.gene === selectedX);
        const selectedY_expression = expressionData.filter(item => item.gene === selectedY);
        const selectedClinicalVar = document.querySelector('.myRadioButton:checked')?.value;

        const clinicalMap = new Map(clinicalAndMutationData.map(d => [d.tcga_participant_barcode, d]));

        const combinedData = selectedX_expression.map(xObj => {
            const barcode = xObj.sample || xObj.tcga_participant_barcode;
            const yObj = selectedY_expression.find(y => y.sample === barcode || y.tcga_participant_barcode === barcode);
            const clinical = clinicalMap.get(barcode);
            if (!yObj || !clinical) return null;

            const rawX = Math.pow(2, xObj.expression_log2);
            const rawY = Math.pow(2, yObj.expression_log2);

            return {
                x: useLog ? xObj.expression_log2 : rawX,
                y: useLog ? yObj.expression_log2 : rawY,
                clinicalValue: selectedClinicalVar ? clinical[selectedClinicalVar] ?? "NA" : "All"
            };
        }).filter(d => d !== null);

        const uniqueGroups = [...new Set(combinedData.map(d => d.clinicalValue))];
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueGroups);
        const traces = [];

        // Scatter plot
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

        function pearsonCorrelationAndPValue(x, y) {
            const n = x.length;
            const meanX = d3.mean(x);
            const meanY = d3.mean(y);
            const covXY = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
            const stdX = Math.sqrt(d3.sum(x.map(xi => (xi - meanX) ** 2)));
            const stdY = Math.sqrt(d3.sum(y.map(yi => (yi - meanY) ** 2)));
            const r = covXY / (stdX * stdY);
            const t = r * Math.sqrt((n - 2) / (1 - r * r));
            const df = n - 2;
            const p = jStat.ttest(t, df, 2);  // requires jStat.js
            return { r: r.toFixed(3), p: p.toExponential(2) };
        }

        if (selectedClinicalVar) {
            for (const group of uniqueGroups) {
                const groupData = combinedData.filter(d => d.clinicalValue === group);
                if (groupData.length < 2) continue;

                const { r, p } = pearsonCorrelationAndPValue(groupData.map(d => d.x), groupData.map(d => d.y));
                const regression = d3.regressionLinear().x(d => d.x).y(d => d.y)(groupData);

                traces.push({
                    x: regression.map(d => d[0]),
                    y: regression.map(d => d[1]),
                    mode: 'lines',
                    type: 'scatter',
                    name: `Fit: ${group} (r=${r}, p=${p})`,
                    line: { color: colorScale(group), width: 2 }
                });
            }
        } else {
            const { r, p } = pearsonCorrelationAndPValue(combinedData.map(d => d.x), combinedData.map(d => d.y));
            const regression = d3.regressionLinear().x(d => d.x).y(d => d.y)(combinedData);

            traces.push({
                x: regression.map(d => d[0]),
                y: regression.map(d => d[1]),
                mode: 'lines',
                type: 'scatter',
                name: `Fit (all) (r=${r}, p=${p})`,
                line: { color: 'black', width: 2, dash: 'dot' }
            });
        }

        const layout = {
            xaxis: { title: selectedX },
            yaxis: { title: selectedY },
            title: ''
        };

        Plotly.newPlot("coexpressionPanel", traces, layout);
    }

    ///////////////////////////////////
    // 3) GENE DROPDOWNS
    ///////////////////////////////////
    getValidGeneList().then(() => {
        let submittedGenes = [...new Set(expressionData.map(item => item.gene))];

        // —— X‑Axis Gene selector —————————————————————————

        div_optionsPanels.append('br');

        const xRow = div_optionsPanels.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px')
            .style('margin-bottom', '12px')
            .style('width', '100%');

        xRow.append('label')
            .text("X-Axis Gene:")
            .attr('for', 'xGeneDropdown')
            .style('white-space', 'nowrap')
            .style('font-weight', 'bold')
            .style('margin', 0);

        const xDropdown = xRow.append("select")
            .attr("id", "xGeneDropdown")
            .attr("class", "browser-default")
            .style("flex", "1")
            .style("min-width", "120px");

        submittedGenes.forEach(gene =>
            xDropdown.append("option").attr("value", gene).text(gene)
        );

        // —— Y‑Axis Gene selector —————————————————————————
        const yRow = div_optionsPanels.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px')
            .style('margin-bottom', '10px')
            .style('width', '100%');

        yRow.append('label')
            .text("Y-Axis Gene:")
            .attr('for', 'yGeneDropdown')
            .style('white-space', 'nowrap')
            .style('font-weight', 'bold')
            .style('margin', 0);

        const yDropdown = yRow.append("select")
            .attr("id", "yGeneDropdown")
            .attr("class", "browser-default")
            .style("flex", "1")
            .style("min-width", "120px");

        submittedGenes.forEach(gene =>
            yDropdown.append("option").attr("value", gene).text(gene)
        );

        document.getElementById("xGeneDropdown").value = submittedGenes[0];
        document.getElementById("yGeneDropdown").value = submittedGenes[1];

        document.getElementById("xGeneDropdown").addEventListener("change", updatePlot);
        document.getElementById("yGeneDropdown").addEventListener("change", updatePlot);

        gridRow.append('div').attr("id", "coexpressionPanel").attr("class", "col s7").style('height', '550px');

        updatePlot(); // Initial render
    });
};
