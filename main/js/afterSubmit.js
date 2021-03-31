/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Div/SVG Manipulation (below) ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// Useful for when you have a variable amount of plots to display on the page:
addDiv = function (newDivID, oldDivID) {
  // create a new div element
  let newDiv = document.createElement("div");
  newDiv.setAttribute("id", newDivID);
  newDiv.setAttribute("style", "margin-top:25px");
  // add the newly created element and its content into the DOM
  document.getElementById(oldDivID).after(newDiv);
};

// Function to remove the current div elements if they exist:
removeDiv = function () {
  let i = 1;
  let continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div" + i);
    if (divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      continueBool = false;
    }
  }
};

// Function to remove the current svg elements if they exist:
removeSVGelements = function () {
  svgElementsArray = ["svgHeatMap", "svgViolinPlot"];
  for (let i = 0; i < svgElementsArray.length; i++) {
    svgToRemove = document.getElementById(svgElementsArray[i]);

    if (svgToRemove) $(svgToRemove).remove();
    else {
      let ctr = 0;
      for (;;) {
        svgToRemove = document.getElementById(svgElementsArray[i] + ctr++);
        if (svgToRemove) $(svgToRemove).remove();
        else break;
      }
    }
  }
};

// Function to remove the tooltip div elements if they exist:
removeTooltipElements = function () {
  let collection = document.getElementsByClassName("tooltip");
  for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
    collection[0].remove();
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Div/SVG Manipulation (above) ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                               //                                                                        //

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Set Values for Example Button (below) ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Setting the cohort and gene list examples if the user clicks the use example button:
function setExampleVars() {
  // Select example values:
  $(".cancerTypeMultipleSelection").val(["PAAD"]);
  $(".geneOneMultipleSelection").val(["ethnicity", "KRAS", "EGFR", "TP53"]);

  // Trigger the change:
  $(".cancerTypeMultipleSelection").trigger("change");
  $(".geneOneMultipleSelection").trigger("change");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Set Values for Example Button (above) ///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                               //                                                                        //

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Build Plots on Page (below) /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The JS code for building the plots to display:
// Wait for user input to build plots:

let buildPlots = async function () {
  // Reset page formatting:
  document.getElementById("heatmapDiv0").innerHTML = "";
  document.getElementById("svgViolinDiv0").innerHTML = "";

  // Remove existing div and svg elements if they're there:
  removeDiv();
  removeSVGelements();
  removeTooltipElements();

  // Display loader:
  document.getElementById("heatmapDiv0").className = "loader"; // Create the loader.
  document.getElementById("svgViolinDiv0").className = "loader"; // Create the loader.

  let cohortQuery = $(".cancerTypeMultipleSelection")
    .select2("data")
    .map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let geneQuery = $(".geneOneMultipleSelection")
    .select2("data")
    .map((gene) => gene.text);
  let clinicalQuery = $(".clinicalMultipleSelection")
    .select2("data")
    .map((el) => el.text);

  // Fetch RNA sequencing data for selected cancer cohort(s) and gene(s)
  let expressionData = await getExpressionDataJSONarray_cg(
    cohortQuery,
    geneQuery
  );

  // Find intersecting barcodes based on Mutation/Clinical Pie Chart selections
  let intersectedBarcodes = await getBarcodesFromSelectedPieSectors(
    expressionData
  );

  // Extract expression data only at intersectedBarcodes
  let data = await getExpressionDataFromIntersectedBarcodes(
    intersectedBarcodes,
    cohortQuery
  );

  // Get clinical data for specified clinical fields
  let clinicalData;
  if (intersectedBarcodes && intersectedBarcodes.length) {
    // query clinical data at selected barcodes
    clinicalData = (await firebrowse.getClinical_FH_bf(
      intersectedBarcodes,
      clinicalQuery
    )).Clinical_FH;
  } else {
    // if no barcodes, query entire cohort for clinical data
    clinicalData = await getClinicalDataJSONarray_cc(
      cohortQuery,
      clinicalQuery
    );
  }

  //Add expression data as a field in localStorage
  localStorage.setItem("expressionData", JSON.stringify(data));

  buildDownloadData(cohortQuery, geneQuery, clinicalQuery, data, clinicalData);
  buildHeatmap(data, clinicalData);
  buildViolinPlot(cohortQuery, data);
};

buildHeatmap = async function (expData, clinData) {
  // Remove the loader
  document.getElementById("heatmapDiv0").classList.remove("loader");

  // Create div object for heatmap and clear
  let divHeatMap = d3.select("#heatmapDiv0").html("");

  // Create the heatmap
  createHeatmap(expData, clinData, divHeatMap);
};

buildViolinPlot = async function (cohortQuery, data) {
  // Remove the loader
  document.getElementById("svgViolinDiv0").classList.remove("loader");

  // Set up the figure dimensions:
  let margin = { top: 80, right: 30, bottom: 30, left: 60 },
    width = 1250 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // Appending multiple g elements to svg object for violin plot
  let myCohorts = d3
    .map(data, function (d) {
      return d.cohort;
    })
    .keys();

  // Define the number of cohorts to create a plot for
  let numCohorts = myCohorts.length;

  // Spacing between plots
  let ySpacing = margin.top;

  // Append an svg object for each cohort to create a violin plot for
  for (var index = 0; index < numCohorts; index++) {
    // Define the current cohort to create the violin plot for
    let curCohort = myCohorts[index];

    let svgViolinPlot = d3
      .select("#violinPlotRef")
      .append("svg")
      .attr("viewBox", `0 0 1250 500`) // This line makes the svg responsive
      .attr("id", `svgViolinPlot${index}`)
      .append("g")
      .attr(
        "transform",
        "translate(" +
          (margin.left - 20) +
          "," +
          (margin.top + ySpacing * index * 0.25) +
          ")"
      );

    // Create the violin plot:
    createViolinPlot("cohort", cohortQuery, data, svgViolinPlot, curCohort);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Build Plots on Page (above) /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Downloading data functions
saveFile = function (x, fileName) {
  // x is the content of the file
  var bb = new Blob([x]);
  var url = URL.createObjectURL(bb);
  var a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click(); // then download it automatically
  return a;
};

buildDownloadData = async function (
  cohortID,
  genes,
  clin_vars,
  expressionData,
  clinicalData
) {
  let barcodes_exp = d3
    .map(expressionData, (d) => d.tcga_participant_barcode)
    .keys();
  let barcodes_clin = d3
    .map(clinicalData, (d) => d.tcga_participant_barcode)
    .keys();
  let barcodes = [...new Set([...barcodes_exp, ...barcodes_clin])]; // unique union of expression + clinical barcodes

  // define the firebrowse query strings (for header)
  // add barcodes else cohort
  let fb_str_exp = jQuery.param({
    format: "json",
    cohort: cohortID,
    tcga_participant_barcode: barcodes,
    gene: genes,
    page: 1,
    page_size: 2000,
    sort_by: "tcga_participant_barcode",
    sample_type: "TP",
  });
  let fb_str_clin = jQuery.param({
    format: "json",
    cohort: cohortID,
    tcga_participant_barcode: barcodes,
    fh_cde_name: clin_vars,
    page: 1,
    page_size: 2000,
    sort_by: "tcga_participant_barcode",
  });

  // create header for json (describes dataset)
  let headerObject = {
    cohort: cohortID,
    barcodes: barcodes,
    //filter: "no filter", // put in what pie chart slices are selected
    genes_query: genes,
    clinical_features: clin_vars,
    firebrowse_expression_query_string: fb_str_exp,
    firebrowse_clinical_query_string: fb_str_clin,
  };

  console.log(["header", headerObject]);

  // make saveObject for json download
  let saveObject = {
    header: headerObject,
    expression_data: expressionData,
    clinical_data: clinicalData,
  };

  // clear div and add new buttons for json and csv
  d3.select("#downloadDataButtons").html("");
  d3.select("#downloadDataButtons")
    .append("button")
    .attr("type", "button")
    .attr("class", "col s3 btn waves-effect waves-light")
    .on("click", function () {
      saveFile(JSON.stringify(saveObject), "WebGen_data.json");
    })
    .text("Download (JSON)");
};
