// Function to append div elemnts to an HTML document with an existing div element with id='oldDivID'.
// Useful for when you have a variable amount of plots to display on the page:
addElement = function(newDivID, oldDivID) { 
  // create a new div element 
  var newDiv = document.createElement("div"); 
  newDiv.setAttribute('id',newDivID);
  newDiv.setAttribute("style","margin-top:25px"); 
  
  // add the newly created element and its content into the DOM 
  document.getElementById(oldDivID).after(newDiv); 
}


// Function to remove the current div elements if they exist:
removeDIVelements = function() {
  var i = 1;
  var continueBool = true;
  while (continueBool == true) {
    divToRemove = document.getElementById("div" + i);
    if(divToRemove) {
      $(divToRemove).remove();
      i++;
    } else {
      var continueBool = false;
    };
  };
};

// Function to remove the current svg elements if they exist:
removeSVGelements = function() {
  var i = 0;
  var continueBool = true;
  while (continueBool == true) {
    svgToRemove = document.getElementById("svg" + i);
    if(svgToRemove) {
      $(svgToRemove).remove();
      i++;
    } else {
      var continueBool = false;
    };
  };
};


// Function to display the error message:
showError = function(errorType) {
  // Create div1 and set it to be alert class:
  addElement('div1','div0');
  var divElement = document.getElementById('div1');
  divElement.className = 'alert';

  // Creates span clone from span0 to add to div1:
  var span = document.getElementById('span0');
  var spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Adds the error message to the div:
  if (errorType == 'geneError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Gene Fields for Query";
  } else if (errorType == 'cohortError') {
    divElement.innerHTML += "Error: ".bold() + "Invalid Cohort Fields for Query";
  };
};


// Function to display a warning for genes that don't have mRNA-Seq data:
showWarning = function(emptyGeneArray_arg) {
  // Create div1 and set it to be warning class:
  //addElement('div1','div0');
  var divElement = document.getElementById('div0');
  divElement.className = 'warning';

  // Create span clone from span0 to add to div1:
  var span = document.getElementById('span0');
  var spanElement = span.cloneNode(true);
  spanElement.setAttribute('id','span1');
  divElement.appendChild(spanElement);

  // Add the warning message to the div:
  if (emptyGeneArray_arg.length == 1) {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " is an Invalid Gene for Query";
  } else {
    divElement.innerHTML += "Warning: ".bold() +emptyGeneArray_arg.join(', ')+ " are Invalid Genes for Query";
  };
}


// Function to check that the user input cohort list is valid:
checkCohortList = function(cohortQuery) {
  // List of valid cohorts:
  var validCohortList = ['ACC','BLCA','BRCA','CESC','CHOL','COAD','COADREAD','DLBC','ESCA','FPPP','GBM','GBMLGG','HNSC',
                         'KICH','KIPAN','KIRC','KIRP','LAML','LGG','LIHC','LUAD','LUSC','MESO','OV','PAAD','PCPG','PRAD',
                         'READ','SARC','SKCM','STAD','STES','TGCT','THCA','THYM','UCEC','UCS','UVM'];

  // Check the cohort list:
  numCohorts = cohortQuery.length;
  for (var i = 0; i < numCohorts; i++) {
    var statusTemp = validCohortList.includes(cohortQuery[i]);
    if (statusTemp == false) {
      return false;
    };
  };

  return true;
};

// Function to count the amount of genes
amount = function(cohortQuery) {
  var total = 0;
  numCohorts = cohortQuery.length;
  for (var i = 0; i < numCohorts; i++) {
      total++;
  };
  return total;
};