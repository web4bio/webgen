# Documentation

index.html and style.css set up the web app, which is hosted by GitHub.

The .js files are modulated as described below:

1) **fetchExpressionData.js** contains the fetchExpressionData() function, which returns the following mRNASeq-associated data from Firebrowse as a 1-D array, where each element of the array is a JSON associated with a particular cohort-gene pair of the form:
* cohort
* expression_log2
* gene
* geneID
* protocol
* sample_type
* tcga_participant_barcode
* z-score

2) **getExpressionDataJSONarray.js** contains the function: getExpressionDataJSONarray(). This function calls the fetchExpressionData() function and returns the fetched array described above under the fetchExpressionData.js file.

3) **getExpressionValuesOnly.js** contains the getExpressionValuesOnly() function, which utlizes the fetchExpressionData() function to return a 2-D array, where each element in the first (outer) level of the array is a cohort-gene pair, and each element in the second (inner) level of the array is an expression_log2 value. Information about genes that have missing mRNA-Seq data is also returned. This file will likely not have many uses going forward and the getExpressionDataJSONarray.js file is preferable.

4) **createHeatmap.js** contains the functions for building the gene expression heatmap using the mRNA-Seq data that is returned from getExpressionDataJSONarray().

5) **docManipulation.js** contains the functions for manipulating the HTML Doc via JS. This includes tha ability to add/remove DIV elements, the warning/error message functionality, and a function for varifying the validity of user inputted cancer cohorts.
