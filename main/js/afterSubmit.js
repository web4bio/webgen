/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Div/SVG Manipulation (below) ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// Useful for when you have a variable amount of plots to display on the page:
addDiv = function(newDivID, oldDivID) { 
  // create a new div element 
  let newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:25px"); 
  // add the newly created element and its content into the DOM 
  document.getElementById(oldDivID).after(newDiv); 
}

//Useful or adding div inside a div.
//Currently being used for violins
addDivInside = function(newDivID, parentDivID){
  let newDiv = document.createElement("div");
  newDiv.setAttribute('id', newDivID);
  newDiv.setAttribute("style", "margin-top:25px");
  document.getElementById(parentDivID).appendChild(newDiv); 
  return newDiv;
}

// Function to remove the current div elements if they exist:
removeDiv = function() {
  let i = 1;
  let continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div" + i);
    if(divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      continueBool = false;
    }
  }
}

// Function to remove the current svg elements if they exist:
removeSVGelements = function() {
  svgElementsArray = ["svgHeatMap", "svgViolinPlot"];
  for(let i = 0; i < svgElementsArray.length; i++) {
    svgToRemove = document.getElementById(svgElementsArray[i]);

    if (svgToRemove)
      $(svgToRemove).remove();
    else {
      let ctr = 0
      for (;;) {
        svgToRemove = document.getElementById(svgElementsArray[i] + ctr++)
        if (svgToRemove)
          $(svgToRemove).remove();
        else
          break;  
      }
    }  
  }
}

removeViolinButtons = function(){
  var BTNElementArray = document.getElementsByClassName('BTNViolinPlots');
  for(let i = 0, len = BTNElementArray.length || 0; i < len; i = i+1){
    BTNElementArray[0].remove();
  }
}

// Function to remove the tooltip div elements if they exist:
removeTooltipElements = function () {
  let collection = document.getElementsByClassName('tooltip');
  for (let i = 0, len = collection.length || 0; i < len; i = i + 1) {
    collection[0].remove();
  }
}

removeHeatmapsAndViolins = function(){
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
  $('.cancerTypeMultipleSelection').val(['PAAD']);
  $('.mutationMultipleSelection').val(['ethnicity', 'KRAS', 'EGFR', 'TP53']);

  // Trigger the change:
  $('.cancerTypeMultipleSelection').trigger('change');
  $('.mutationMultipleSelection').trigger('change');
};

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

let buildPlots = async function() {
  
  // Reset page formatting:
  // document.getElementById('heatmapDiv0').innerHTML = "";
  // document.getElementById('svgViolinDiv0').innerHTML = "";

  let heatDiv = addDivInside("heatmapDiv0", "heatmapRef");
  var violinDiv = addDivInside("svgViolinDiv0", "violinPlotRef");
  violinDiv.setAttribute('align', 'center');

  // Remove existing div and svg elements if they're there:
  // removeDiv();
  // removeSVGelements();
  // removeTooltipElements();
  // removeViolinButtons();

  // Display loader:
  heatDiv.className = 'loader';                       // Create the loader.
  violinDiv.className = 'loader';                     // Create the loader.

  let cohortQuery = $('.cancerTypeMultipleSelection').select2('data').map(
                    cohortInfo => cohortInfo.text.match(/\(([^)]+)\)/)[1]);
  let geneQuery = $('.mutationMultipleSelection').select2('data').map(
                    clinicalInfo => clinicalInfo.text);

  // Fetch RNA sequence data for selected cancer type(s) and gene(s)
  let expressionData = await getExpressionDataJSONarray_cg(cohortQuery, geneQuery);

  // Fetch clinical data for cohort and specified clinical fields (temporarily hard-coded)
  let clinicalQuery = ["gender", "race", "vital_status", "histological_type", "tumor_tissue_site"];
  let clinicalData = await getClinicalDataJSONarray_cc(cohortQuery, clinicalQuery);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  let data = await getDataFromSelectedPieSectors(expressionData);

  buildHeatmap(data, clinicalData);
  buildViolinPlot(cohortQuery, data);

};

buildHeatmap = async function(expData, clinData){
  // Remove the loader
  document.getElementById('heatmapDiv0').classList.remove('loader');

  // Create div object for heatmap and clear
  let divHeatMap = d3.select('#heatmapDiv0').html("");

  // Create the heatmap
  createHeatmap(expData, clinData, divHeatMap);

};

buildViolinPlot = async function(cohortQuery, data){

  // Remove the loader
  document.getElementById('svgViolinDiv0').classList.remove('loader');               

  // Set up the figure dimensions:
  let margin = {top: 80, right: 30, bottom: 30, left: 60},
  width = 1250 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  // Appending multiple g elements to svg object for violin plot
  let myCohorts = d3.map(data, function(d){return d.cohort;}).keys();

  // Define the number of cohorts to create a plot for
  let numCohorts = myCohorts.length;

  // Spacing between plots
  let ySpacing = margin.top;

  //Toggle switch for user to specify whether they want to view Expression vs. Gene (the default option) or Expression vs. Cohort
  var toggleSwtitch = "<label class='switch'>" + 
  "<b>Toggle between: Expression vs. Gene OR Expression vs. Cohort</b>" +
  "<input type='checkbox'>" +
  "<span class='slider round'></span>" +
  "</label>";
  document.getElementById("violinPlotRef").innerHTML += (toggleSwtitch);

  //Code to get the set of clinical data features to include the option
  //to facet by goes here. For now, gender will be a hardcoded field 
  //to facet by.

  // Append an svg object for each cohort to create a violin plot for
  for(var index = 0; index < numCohorts; index++) {
    console.log("Violin Plot " + index);
    // Define the current cohort to create the violin plot for
    let curCohort = myCohorts[index];
    
    //Create a new div for each cohort
    var violinDivName = "ViolinDiv"+index;
    var violinDiv = addDivInside(violinDivName, "violinPlotRef");
    console.log(violinDivName + " created");


    var partitionSelectDivName = "violinPartitionSelect"+index;
    addDivInside(partitionSelectDivName, violinDivName);
    console.log(partitionSelectDivName + "added");
    fillViolinPartitionBox(partitionSelectDivName);
    console.log("Partition select box selected");

    //Building the selector for each violin plot for faceting
    /*
    $('.clinicalMultipleSelection').select2({
      placeholder: "Clinical feature(s) to partition by"
    });
    */

  /*
   var selectBoxClassName = "clinicalPartitionSelection";
   var selectBoxId = "clinicalPartitionSelection";
   var selectObj = document.createElement("SELECT");
   selectObj.className = selectBoxClassName;
   selectObj.id = selectBoxId;

   violinDiv.appendChild(selectObj);
*/



   /*
    var clinicalFeaturesSelector = "<div id='clinicalPartitionSelectBox" + index + "'>"+
      "<p style='text-align: center;'><b>Clinical feature(s) to partition by</b></p>"+
      "<select class='" + `clinicalMultipleSelectionViolin${index}` + "' multiple='multiple' id= '" + `violinPlot${index}` + "Partition'>"+
      "</select>" +
    "</div>";
    
    violinDiv.innerHTML += (clinicalFeaturesSelector);    
   */ 
    
    var rebuildButton = "<button id = " + `BTNViolinPlot${index}` + " class = 'BTNViolinPlots col s3 btn waves-effect waves-light' onclick = 'rebuildPlot(" + violinDivName + ")'>Rebuild Violin Plot</button>"
    //var rebuildButton = document.createElement("button");
    //rebuildButton.id = `BTNViolinPlot${index}`;
    //rebuildButton.className = "BTNViolinPlots col s3 btn waves-effect waves-light";
    //rebuildButton.innerHTML = "Rebuild Violin Plot";
    
    //rebuildPlot(violinDiv);};
    //var vDiv = document.getElementById(violinDivName);
    //rebuildButton.addEventListener("click", console.log("Hello world!"));
    //{
      //Change function call to add the parameter of the values specified in the partition select box
      //rebuildPlot(violinDiv);
    //});
    
    violinDiv.innerHTML += rebuildButton;
    //violinDiv.appendChild(rebuildButton);
    // Create the violin plot:
    createViolinPlot('cohort', cohortQuery, data, violinDiv, curCohort, []);

    // For Clinical Select2 Drop down:
    $(".clinicalMultipleSelectionViolin" + index).select2({
      placeholder: "Clinical Feature(s)"
    });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// Build Plots on Page (above) /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////