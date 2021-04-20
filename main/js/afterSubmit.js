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

//Useful or adding div inside a div.
//Currently being used for violins
addDivInside = function (newDivID, parentDivID) {
    let newDiv = document.createElement("div");
    newDiv.setAttribute("id", newDivID);
    newDiv.setAttribute("style", "margin-top:25px");
    document.getElementById(parentDivID).appendChild(newDiv);
    return newDiv;
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
      for (; ;) {
        svgToRemove = document.getElementById(svgElementsArray[i] + ctr++);
        if (svgToRemove) $(svgToRemove).remove();
        else break;
      }
    }
  }
};

removeViolinButtons = function () {
    var BTNElementArray = document.getElementsByClassName("BTNViolinPlots");
    for (let i = 0, len = BTNElementArray.length || 0; i < len; i = i + 1) {
        BTNElementArray[0].remove();
    }
};

// Function to remove the tooltip div elements if they exist:
removeTooltipElements = function () {
    let collection = document.getElementsByClassName("tooltip");
    for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
        collection[0].remove();
    }
};

removeHeatmapsAndViolins = function () {
    let heatmapDiv = document.getElementById("heatmapRef");
    heatmapDiv.innerHTML = "";
    let violinDiv = document.getElementById("violinPlotRef");
    violinDiv.innerHTML = "";
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
  if (document.getElementById("violinDiv0") != null) document.getElementById("violinDiv0").outerHTML = "";
  
  let heatDiv = addDivInside("heatmapDiv0", "heatmapRef");
  var violinDiv = addDivInside("violinDiv0", "violinPlotRef");
  violinDiv.setAttribute("align", "center");

  // Remove existing div and svg elements if they're there:
  // removeDiv();
  // removeSVGelements();
  // removeTooltipElements();
  // removeViolinButtons();

  // Display loader:
  document.getElementById("heatmapDiv0").className = "loader"; // Create the loader.
  document.getElementById("svgViolinDiv0").className = "loader"; // Create the loader.

  let cohortQuery = $(".cancerTypeMultipleSelection")
    .select2("data").map((cohortInfo) => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let mutationQuery = $(".geneOneMultipleSelection")
    .select2("data").map((gene) => gene.text);
  let clinicalQuery = $(".clinicalMultipleSelection")
    .select2("data").map((el) => el.text);
  let expressionQuery = $(".geneTwoMultipleSelection")
    .select2("data").map((gene) => gene.text);
  
  // Fetch RNA sequencing data for selected cancer cohort(s) and gene(s)
  let expressionData_1 = await getExpressionDataJSONarray_cg(cohortQuery, mutationQuery);

  // Find intersecting barcodes based on Mutation/Clinical Pie Chart selections
  let intersectedBarcodes = await getBarcodesFromSelectedPieSectors(expressionData_1);

  // Extract expression data only at intersectedBarcodes
  let expressionData = await getExpressionDataFromIntersectedBarcodes(intersectedBarcodes,cohortQuery);

  // Get clinical data for all clinical fields
  let clinicalData;
  if (intersectedBarcodes && intersectedBarcodes.length) { // query clinical data at selected barcodes
    //clinicalData = (await firebrowse.getClinical_FH_bf(intersectedBarcodes,clinicalQuery)).Clinical_FH;
    clinicalData = await getClinicalDataJSONarray_b(intersectedBarcodes); // call function which pulls all clinical data for barcodes
  } else { // if no barcodes, query entire cohort for clinical data
    //clinicalData = await getClinicalDataJSONarray_cc(cohortQuery,clinicalQuery);
    clinicalData = await getClinicalDataJSONarray_c(cohortQuery); // call function which pulls all clinical data for cohort
  }
  
  //Store clinical data in localStorage
  localStorage.setItem("clinicalData", JSON.stringify(clinicalData));
  //Store clinical data keys in localStorage
  localStorage.setItem("clinicalFeatureKeys", Object.keys(clinicalData[0]));

  expressionData = expressionData.filter((el) => el.sample_type === "TP"); // quick fix. queried data includes normal samples ("NT"), this needs to be fixed in "getExpressionDataFromIntersectedBarcodes"
  //Add expression data as a field in localStorage
  localStorage.setItem("expressionData", JSON.stringify(expressionData));

  let genesFromPathways = await getGenesByPathway();
  if(genesFromPathways.length > 0) {
    for(let i = 0; i < genesFromPathways.length; i++) {
      expressionQuery = expressionQuery.concat(genesFromPathways[i].genes);
    }
    let removedDuplicates = [];
    $.each(expressionQuery, function(i, element){
      if($.inArray(element, removedDuplicates) === -1) removedDuplicates.push(element);
    });
    expressionQuery = removedDuplicates;
  }

  //Remove the 'violinPlots' div should it exist
  if (document.getElementById("violinPlots") != null) document.getElementById("violinPlots").outerHTML = "";
  //Create checkbox to toggle between gene vs. cohort for violin plots
  var toggleSwitch =
      "<label class='switch'>" +
      "<b>Toggle between: Expression vs. Gene OR Expression vs. Cohort</b>" +
      "<input type='checkbox' id= 'toggleSwitch'>" +
      "<span class='slider round'></span>" +
      "</label>";
  //Append toggle switch to the top of violin plots section
  document.getElementById("violinDiv0").innerHTML = "";
  document.getElementById("violinDiv0").innerHTML += toggleSwitch;
  addDiv("violinPlots", "violinDiv0");

  //Checkbox for toggling between gene vs. cohort for violin plots
  toggleSwitch = document.getElementById("toggleSwitch");
  toggleSwitch.addEventListener("change", function (e) {
    var violinsDiv = document.getElementById("violinPlots");
    violinsDiv.innerHTML = "";

    //Call buildViolinPlot with a different parameter based on the status of the toggle switch
    if (toggleSwitch.checked) {
        buildViolinPlot(expressionQuery, expressionData, "gene");
    } else {
        buildViolinPlot(cohortQuery, expressionData, "cohort");
    }
  });

  buildDownloadData(cohortQuery, expressionQuery, clinicalQuery, expressionData, clinicalData);
  buildHeatmap(expressionData, clinicalData);
  buildViolinPlot(cohortQuery, expressionData, "cohort");
};

buildHeatmap = async function (expData, clinData) {
  // Remove the loader
  document.getElementById("heatmapDiv0").classList.remove("loader");

  // Create div object for heatmap and clear
  let divHeatMap = d3.select("#heatmapDiv0").html("");

  // Create the heatmap
  createHeatmap(expData, clinData, divHeatMap);
};

buildViolinPlot = async function (cohortORGeneQuery, data, independantVarType) {
    // Remove the loader
    document.getElementById("svgViolinDiv0").classList.remove("loader");
    //Clear HTML content ov violinPlots div
    var violinsDiv = document.getElementById("violinPlots");
    violinsDiv.innerHTML = "";

    //Create partition selector
    var partitionDivId = "violinPartition";
    addDivInside(partitionDivId, "violinPlots");
    //Create partition selector
    createViolinPartitionBox("violinPlots", cohortORGeneQuery);
    // Set up the figure dimensions:
    /*
    let margin = { top: 80, right: 30, bottom: 30, left: 60 },
        width = 1250 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    */

    // Define the number of cohorts to create a plot for
    let numOfIndependantVars = cohortORGeneQuery.length;

    // Spacing between plots
    //let ySpacing = margin.top;

    // Append an svg object for each cohort to create a violin plot for
    for (var index = 0; index < numOfIndependantVars; index++) {
        // Define the current cohort to create the violin plot for and create a new div for each cohort
        let curCohort = cohortORGeneQuery[index];
        addDivInside(`violinPlot${index}`, "violinPlots");

        addDivInside(`svgViolin${index}`, `violinPlot${index}`);

        var violinDiv = document.getElementById(`violinPlot${index}`);

        createViolinPlot(independantVarType, data, violinDiv, curCohort, []);
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

buildDownloadData = async function (cohortID, genes, clin_vars, expressionData, clinicalData) {
    let timestamp = new Date().toUTCString();

    let barcodes_exp = d3
        .map(expressionData, (d) => {
            if (d) return d.tcga_participant_barcode;
            else return d;
        })
        .keys()
        .sort();
    let barcodes_clin = d3
        .map(clinicalData, (d) => {
            if (d) return d.tcga_participant_barcode;
            else return d;
        })
        .keys()
        .sort();
    let barcodes_all = [...new Set([...barcodes_exp, ...barcodes_clin])]; // unique union of expression + clinical barcodes

    // define the firebrowse query strings (to include in header)
    // add barcodes else cohort ?
    let fb_str_exp = jQuery.param({
        format: "json",
        cohort: cohortID,
        tcga_participant_barcode: barcodes_all,
        gene: genes,
        page: 1,
        page_size: 2000,
        sort_by: "tcga_participant_barcode",
        sample_type: "TP",
    });
    let fb_str_clin = jQuery.param({
        format: "json",
        cohort: cohortID,
        tcga_participant_barcode: barcodes_all,
        fh_cde_name: clin_vars,
        page: 1,
        page_size: 2000,
        sort_by: "tcga_participant_barcode",
    });

    // create header for json (describes dataset)
    let headerObject = {
        cohort: cohortID,
        barcodes: barcodes_all,
        //filter: "no filter", // put in what pie chart slices are selected
        genes_query: genes,
        clinical_features: clin_vars,
        firebrowse_expression_query_string: fb_str_exp,
        firebrowse_clinical_query_string: fb_str_clin,
        timestamp: timestamp,
    };

    // make saveObject for json download
    let saveObject = {
        header: headerObject,
        expression_data: expressionData,
        clinical_data: clinicalData,
    };

    // Make Expression CSV string
    // make z-score and log2 csv's at once
    let csv_string_expZscore = "Z-scored Gene Expression,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,"+timestamp+",TCGA Cohort(s):," + cohortID + "\n"; // header for zscore csv
    let csv_string_expLog2 = "Log2 Gene Expression,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,"+timestamp+",TCGA Cohort(s):," + cohortID + "\n"; // header for expression_log2 csv
    csv_string_expZscore += "Gene," + barcodes_exp.join(","); // row is column names
    csv_string_expLog2 += "Gene," + barcodes_exp.join(","); // row is column names
    // for each gene, add a row to csv, each comma-separated element is the gene expression for that barcode
    genes.sort().forEach((g) => {
        csv_string_expZscore += "\n" + g; // add newline and name of gene g in first column
        csv_string_expLog2 += "\n" + g; // add newline and name of gene g in first column
        barcodes_exp.forEach((b) => {
            csv_string_expZscore += ",";
            csv_string_expLog2 += ",";
            // filter out one barcode/gene combination
            let valZ = expressionData 
                .filter((el) => el.tcga_participant_barcode === b && el.gene === g)
                .map((el) => el["z-score"]); // zscore value to add to zscore csv
            if (!valZ.length) { csv_string_expZscore += "NA"; } else { csv_string_expZscore += valZ; }; // add to string
            let valL = expressionData 
                .filter((el) => el.tcga_participant_barcode === b && el.gene === g)
                .map((el) => el.expression_log2); // log2 value to add to log2 csv
            if (!valL.length) { csv_string_expLog2 += "NA"; } else { csv_string_expLog2 += valL; }; // add to string
        });
    });

    // Make Clinical CSV string
    let csv_string_clin = "Clinical Metadata,Generated By WebGen: https://web4bio.github.io/webgen/,Time-Stamp:,"+timestamp+",TCGA Cohort(s):," + cohortID + "\n"; // header for clinical csv
    csv_string_clin += "Clinical Feature," + barcodes_clin.join(","); // first row is column names
    // for each clinical feature, add a row to csv, each comma-separated element is the feature value for that barcode
    clin_vars.sort().forEach((f) => {
        csv_string_clin += "\n" + f; // add newline and name of feature f in first column
        barcodes_clin.forEach((b) => {
            csv_string_clin += ",";
            // filter out barcode b, get field of feature f
            let val = clinicalData.filter((el) => el.tcga_participant_barcode === b).map((el) => el[f]);
            if (!val.length) {
                csv_string_clin += "NA";
            } else {
                csv_string_clin += val;
            } // add to string
        });
    });

    // clear div and add new button for json, csv_exp, csv_clin
    $("#downloadAllButton")
        .on("click", function () {
            saveFile(JSON.stringify(saveObject), "WebGen_data.json"); // use saveFile function
        });
    if (typeof expressionData !== 'undefined' && expressionData.length > 0) {
        $("#downloadExpressionZscoreButton")
            .on("click", function () {
                saveFile(csv_string_expZscore, "WebGen_expression_Zscore.csv"); // use saveFile function
            });
        $("#downloadExpressionLog2Button")
            .on("click", function () {
                saveFile(csv_string_expLog2, "WebGen_expression_log2.csv"); // use saveFile function
            });
    } else {
        $("#downloadExpressionZscoreButton")
            .on("click", function () {alert("Expression data is empty. Please select genes to save.")});
        $("#downloadExpressionLog2Button")
            .on("click", function () {alert("Expression data is empty. Please select genes to save.")});
    };
    if (typeof clinicalData !== 'undefined' && clinicalData.length > 0) {
        $("#downloadClinicalButton")
            .on("click", function () {
                saveFile(csv_string_clin, "WebGen_clinical.csv"); // use saveFile function
        });
    } else {
        $("#downloadClinicalButton")
            .on("click", function () {alert("Clinical data is empty. Please select clinical features to save.")});
    };
    $("#downloadDataButtons")
        .show()
};

