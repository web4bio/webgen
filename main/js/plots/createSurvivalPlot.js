/**
 * Format survival data using Kaplan-Meier method
 * @param {Array} clinicalData - Clinical data array
 * @returns {Object} Object with a single key and a corresponding array of survival data as the value
 */
const formatSurvivalDate = function(clinicalData) {
  let group_name = "All Patients";
    
  // Group data into "All Patients" category
  const grouped_data = {};
  // Process each patient in this cohort
  const deathCounts = [];
  clinicalData.forEach(patient => {
    const barcode = patient.tcga_participant_barcode;
    let daysValue, status;
          
    // Parse days_to_death or days_to_last_followup
    if (patient.days_to_death !== "NA" && patient.vital_status === "1") {
        daysValue = parseInt(patient.days_to_death);
        status = 1; // Death event occurred
    } else if (patient.days_to_last_followup !== "NA") {
        daysValue = parseInt(patient.days_to_last_followup);
        status = 0; // Censored (no death event)
    } else {
        // Skip patients with no valid data
        return;
    }
    deathCounts.push({
        barcode: barcode,
        days: daysValue,
        status: status
    });
  });
  grouped_data[group_name] = deathCounts;
  return grouped_data;
};

/**
* Calculate survival values for each cohort using Kaplan-Meier method
* @param {Object} cohortGroups - Grouped data by cohort
* @returns {Object} Survival curves by cohort
*/
const calculateSurvivalValuesByCohort = function(cohortGroups) {
  const survivalCurvesByCohort = {};
  
  for (const [cohort, deathCounts] of Object.entries(cohortGroups)) {
      // Sort by days (ascending)
      deathCounts.sort((a, b) => a.days - b.days);
      
      // Calculate survival curve points
      const survivalCurve = [];
      let totalPatients = deathCounts.length;
      let cumulativeSurvival = 1.0;
      
      // Add starting point
      survivalCurve.push({
          time: 0,
          survival: cumulativeSurvival,
          std_error: 0,
          upper: 1.0,
          lower: 1.0,
          sample_size: totalPatients
      });
      
      // Calculate Kaplan-Meier estimate
      let atRiskCount = totalPatients;
      let cumulativeEvents = 0;
      
      deathCounts.forEach((point, i) => {
          if (point.status === 1) {
              // Only update survival at actual death events
              cumulativeSurvival *= (atRiskCount - 1) / atRiskCount;
              cumulativeEvents += 1;
              
              // Calculate confidence interval (simplified)
              const std_error = Math.sqrt(cumulativeEvents / (atRiskCount * (atRiskCount - cumulativeEvents)));
              const z = 1.96; // 95% confidence
              const upper = Math.min(1, cumulativeSurvival + z * std_error);
              const lower = Math.max(0, cumulativeSurvival - z * std_error);
              
              survivalCurve.push({
                  time: point.days,
                  survival: cumulativeSurvival,
                  std_error: std_error,
                  upper: upper,
                  lower: lower,
                  sample_size: totalPatients
              });
          } else {
              // For censored data points, add a marker without changing survival
              survivalCurve.push({
                  time: point.days,
                  survival: cumulativeSurvival,
                  censored: true,
                  sample_size: totalPatients
              });
          }
          
          atRiskCount--;
      });
      
      survivalCurvesByCohort[cohort] = survivalCurve;
  }
  
  return survivalCurvesByCohort;
};

/**
* Create survival plot with separate lines for each cohort
* @param {Object} survivalCurvesByCohort - Survival curves grouped by cohort
*/
const createSurvivalPlotByCohort = function(survivalCurvesByCohort) {
  // Clear any existing plot
  d3.select("#survivalPlot").html("");
  
  // Set up dimensions and margins
  const margin = {top: 50, right: 200, bottom: 50, left: 100};
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  
  // Create SVG element
  const svg = d3.select("#survivalPlot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Find max time value across all cohorts for x-axis scale
  let maxTime = 0;
  for (const cohort in survivalCurvesByCohort) {
      const cohortMaxTime = d3.max(survivalCurvesByCohort[cohort], d => d.time);
      maxTime = Math.max(maxTime, cohortMaxTime);
  }
  
  // Create a tooltip
  let tooltip = d3.select("#survivalPlot")
    .append("div")
    .style("opacity", 0)
    .attr("id", "survivalPlotTooltip")
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

    // Three functions that change the tooltip when user hover / move / leave a cell
  let mouseover = function(d) {
    tooltip
        .style("opacity", 1)
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
  }
  
  let mousemove = function(d) {
    tooltip
        .style("left", (d3.mouse(this)[0]+70) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
        .attr("transform", "translate(" + width/4 + ")")
  
    for (prop in this) {
        let spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
        var tooltipstring = "\xa0\xa0" +
            `Time: ${String(d.time)} days\n` + spacing +
            `Survival Probability: ${String(Math.round(d.survival * 1000, 4)/1000)}` + spacing;
        if("censored" in d && d.censored == true)
            tooltipstring += `Censored: True`;
        else {
            tooltipstring += `Censored: False`;
        }
        tooltipstring += (spacing + `Sample Size: ${d.sample_size}`);
        return tooltip.style("visibility", "visible").html(tooltipstring);
    };
  }
  let mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        d3.select(this)
        .style("stroke", "none")
  }
  // Set up scales
  const x = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, width]);
      
  const y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);
  
  // Define color scale for different cohorts
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Create line generator
  const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.survival));
  
  // Add X and Y axes
  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .style("text-anchor", "middle")
      .text("Time (days)");
  
  svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("fill", "#000")
      .style("text-anchor", "middle")
      .text("Survival Probability");
  
  // Add title
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Kaplan-Meier Survival Curve by Cohort");
  
  // Draw lines for each cohort
  Object.keys(survivalCurvesByCohort).forEach((cohort, i) => {
      const curveData = survivalCurvesByCohort[cohort];
      const curveColor = colorScale(i);
      
      // Draw the survival curve line
      svg.append("path")
          .datum(curveData)
          .attr("fill", "none")
          .attr("stroke", curveColor)
          .attr("stroke-width", 2)
          .attr("d", line)

      // Render invisible data points that form the path to create a tooltip for
      svg.selectAll(`${cohort}`)
          .data(curveData)
          .enter()
          .append("circle")
          .attr("cx", d => x(d.time))
          .attr("cy", d => y(d.survival))
          .attr("r", 4)
          .style("fill", "none")
          .style("stroke", "none")
          .style("pointer-events", "all")
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave);
      
       // Add censored data points (small circles)
       svg.selectAll(`.censored-${cohort}`)
           .data(curveData.filter(d => d.censored))
           .enter()
           .append("circle")
           .attr("cx", d => x(d.time))
           .attr("cy", d => y(d.survival))
           .attr("r", 4)
           .attr("fill", curveColor)
           .on("mouseover", mouseover)
           .on("mousemove", mousemove)
           .on("mouseleave", mouseleave);
  });
  
  // Add legend
  const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 0)`);
  
  Object.keys(survivalCurvesByCohort).forEach((cohort, i) => {
      const lg = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
      
      lg.append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", colorScale(i));
      
      lg.append("text")
          .attr("x", 15)
          .attr("y", 10)
          .text(`${cohort} (n=${survivalCurvesByCohort[cohort].length-1})`)
          .style("font-size", "12px");
  });
  
};

/**
* Creates the partition selector for survival curves
*
* @param {string} partitionDivId - the html id passed over for the partitions div
* @param {Array} clinicalData - Clinical data array
* @returns {string[]} list of choices for the partition box
*/
const createSurvivalPartitionBox = function(partitionDivId, clinicalData) {
  // Get the div to place the partition selector
  var div_box = d3.select(`#${partitionDivId}`);
  
  // Set up the header
  div_box
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Select stratification variables')
      .style("margin-top", "20px")
      .style("margin-left", "10px");
  
  div_box.append('br');
  
  // Create scrollable container for radio buttons
  div_box.append('div')
      .attr('class', 'viewport')
      .attr("id", "partitionSelectSurvivalPlot")
      .style('overflow-y', 'auto')
      .style('height', '365px')
      .style('width', '280px')
      .style('text-align', 'left')
      .style("font-size", "14px")
      .style("margin-top", "10px")
      .append('div')
      .attr('class', 'body');
  
  let div_body = div_box.select('.body');
  var choices = [];
  
  // Function to update the selected choices array
  function update() {
      choices = [];
      d3.selectAll(".mySurvivalRadio").each(function(d) {
          let cb = d3.select(this);
          if(cb.property('checked')) { 
              choices.push(cb.property('value')); 
          }
      });
  }
  
  // Function to rebuild survival curves based on selected partitions
  function rebuildSurvivalCurves() {
      update();
      
      // Don't stratify if no variables are selected
      if (choices.length === 0) {
          // Use regular all patients survival curves
          const formatted_survival_data = formatSurvivalDate(clinicalData);
          const survival_curve = calculateSurvivalValuesByCohort(formatted_survival_data);
          createSurvivalPlotByCohort(survival_curve);
          return;
      }
      
      // Otherwise, stratify by the selected variables
      const stratifiedGroups = formatSurvivalDateByStrata(clinicalData, choices);
      const survivalCurvesByStrata = calculateSurvivalValuesByCohort(stratifiedGroups);
      createSurvivalPlotByCohort(survivalCurvesByStrata);
  }
  
  // Function to create a radio button and label
  function renderRadioButton(div_obj, data) {
      const label = div_obj.append('div');
      const label2 = label.append("label");
      
      label2.append("input")
          .attr('id', data)
          .attr("class", "mySurvivalRadio")
          .attr("value", data)
          .attr("type", "radio")
          .attr("name", "stratification")
          .on('change', function() {
              rebuildSurvivalCurves();
          });
      
      label2.append("span")
          .text(' ' + data)
          .style('font-weight', 'normal')
          .style("color", "#5f5f5f");
  }
  
  // Get potential stratification variables
  // We need to filter to clinical variables that are suitable for stratification
  let stratificationVars = [];
  
  if (clinicalData && clinicalData.length > 0) {
      // Get all keys from the clinical data
      const allKeys = Object.keys(clinicalData[0]);
      
      // Filter to variables that make sense for stratification
      stratificationVars = allKeys.filter(key => {
          // Skip technical IDs and dates
          if (key.includes('barcode') || key.includes('date') || 
              key === 'tool') {
              return false;
          }
          
          // Count distinct values for this key
          const distinctValues = new Set();
          clinicalData.forEach(patient => {
              if (patient[key] !== 'NA' && patient[key] !== null && patient[key] !== undefined) {
                  distinctValues.add(patient[key]);
              }
          });
          
          // Only use variables with 2-10 distinct values (categorical)
          return distinctValues.size >= 2 && distinctValues.size <= 10;
      });
  }
  
  // Sort variables alphabetically
  stratificationVars.sort();
  
  // Create radio button for each stratification variable
  stratificationVars.forEach(el => renderRadioButton(div_body, el));
  
  // Initialize choices array
  update();
  
  return choices;
};

/**
* Format survival data by selected stratification variables
* @param {Array} clinicalData - Clinical data array
* @param {Array} stratificationVars - Array of variable names to stratify by
* @returns {Object} Object with strata names as keys and arrays of survival data as values
*/
const formatSurvivalDateByStrata = function(clinicalData, stratificationVars) {
  // If no stratification variables, fall back to all patients
  if (!stratificationVars || stratificationVars.length === 0) {
      return formatSurvivalDate(clinicalData);
  }
  
  // Create strata
  const strataGroups = {};
  
  // Process each patient
  clinicalData.forEach(patient => {
      // Create a strata label based on selected variables
      const strataValues = [];
      
      stratificationVars.forEach(variable => {
          let value = patient[variable];
          
          // Skip patients with missing values for stratification variables
          if (value === 'NA' || value === null || value === undefined) {
              return;
          }
          
          // Clean up value for display
          value = value.toString().toLowerCase().replace(/na/i, 'NA');
          if (value === '0') value = 'No';
          if (value === '1') value = 'Yes';
          
          strataValues.push(`${variable}-${value}`); // Using dash instead of colon for CSS safety
      });
      
      // Skip if we couldn't create a proper strata label
      if (strataValues.length !== stratificationVars.length) {
          return;
      }
      
      const strataLabel = strataValues.join('_'); // Using underscore instead of comma for CSS safety
      
      // Initialize strata group if not exists
      if (!strataGroups[strataLabel]) {
          strataGroups[strataLabel] = [];
      }
      
      // Process survival data
      let daysValue, status;
      
      // Parse days_to_death or days_to_last_followup
      if (patient.days_to_death !== "NA" && patient.vital_status === "1") {
          daysValue = parseInt(patient.days_to_death);
          status = 1; // Death event occurred
      } else if (patient.days_to_last_followup !== "NA") {
          daysValue = parseInt(patient.days_to_last_followup);
          status = 0; // Censored (no death event)
      } else {
          // Skip patients with no valid survival data
          return;
      }
      
      // Add patient to strata group
      strataGroups[strataLabel].push({
          barcode: patient.tcga_participant_barcode,
          days: daysValue,
          status: status
      });
  });
  
  // Remove strata with too few samples (need at least 3 patients)
  const filteredGroups = {};
  for (const stratum in strataGroups) {
      if (strataGroups[stratum].length >= 3) {
          filteredGroups[stratum] = strataGroups[stratum];
      }
  }
  
  // If all strata were filtered out, return all patients instead
  if (Object.keys(filteredGroups).length === 0) {
      console.warn("All strata had fewer than 3 patients. Falling back to all patients.");
      return formatSurvivalDate(clinicalData);
  }
  
  return filteredGroups;
};

/**
* Modified buildSurvivalCurves function to include partition selector
* @param {Array} clinicalData - Clinical data array
*/
const buildSurvivalCurvesByStrata = function(clinicalData) {
  // Clear contents of survival curve loader div
  d3.select("#survivalLoaderDiv").html("");
  
  // Clear and set up the survival plot container
  const loaderDiv = d3.select("#survivalLoaderDiv");
  
  // Create a flex container to place elements side by side
  loaderDiv.append("div")
      .attr("id", "survivalGridRow")
      .attr("class", "row")
      .style("display", "flex")
      .style("flex-direction", "row")
      .style("align-items", "flex-start")
      .style("width", "100%");
  
  // Add div for the partition selector (fixed width)
  loaderDiv.select("#survivalGridRow")
      .append("div")
      .attr("id", "survivalPartition")
      .attr("class", "col s3")
      .style("flex", "0 0 300px");
  
  // Add div for the survival plot (flexible width)
  loaderDiv.select("#survivalGridRow")
      .append("div")
      .attr("id", "survivalPlot")
      .attr("class", "col s9")
      .style("flex", "1");
  
  // Create the partition selection box
  createSurvivalPartitionBox("survivalPartition", clinicalData);
  
  // Create initial plot for all patients (default)
  const formatted_survival_data = formatSurvivalDate(clinicalData)
  const survival_curve_all_patients = calculateSurvivalValuesByCohort(formatted_survival_data);
  
  // Only create plot if we have valid data
  if (Object.keys(survival_curve_all_patients).length > 0) {
      createSurvivalPlotByCohort(survival_curve_all_patients);
  } else {
      d3.select("#survivalPlot")
          .append("p")
          .text("No valid survival data available");
  }
};