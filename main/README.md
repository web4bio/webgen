# Documentation

index.html and style.css set up the web app, which is hosted by GitHub.

The .js files are modulated as described below:

1) **master.js** contains the master function communicating the user input from the HTML file to the helper JS functions to fetch the correct mRNA-Seq data from the GDC using FireBrowse and Jonas' herokuapp. This function then returns the data to build the Plotly Plots in the HTML Doc.

2) **getAllExpressionData.js** contains the getAllExpressionData() function, which returns the following mRNASeq-associated data from Firebrowse as a 1-D array, where each element of the array is associated with a particular cohort-gene pair:
* cohort
* expression_log2
* gene
* geneID
* protocol
* sample_type
* tcga_participant_barcode
* z-score

3) **getExpressionValuesOnly.js** contains the getExpressionValuesOnly() function, which utlizes the getAllExpressionData() function to return a 2-D array, where each element in the first (outer) level of the array is a cohort-gene pair, and each element in the second (inner) level of the array is an expression_log2 value. Information about genes that have missing mRNA-Seq data is also returned.

3) **mRNASeq_heatmaps.js** contains the functions for building both the regular and the normalized average heatmaps for the mRNA-Seq data that is returned from getExpressionArray().

4) **mRNASeq_histogram.js** contains the function for building the histograms for the mRNA-Seq data that is returned from getExpressionArray().

5) **docManipulation.js** contains the functions for manipulating the HTML Doc via JS. This includes tha ability to  add/remove DIV elements, the warning/error message functionality, and a function for varifying the validity of user inputted cancer cohorts.

6) **getExpressionJSONarray.js** is a contains the function: ethan_getExpressionJSONarray(). This function is useful for inputing a list of cancer cohorts and a list of genes to get back an array of JSONs where each JSON contains the cohort, the gene, and RNA Sequencing data pulled from the GDC for that cohort & gene.
*NOTE:* This function is not involved in the current web app process and is not incorporated into the HTML file. This script was solely developed to share. Also, this functions process for fetching the GDC data is not as optimized as the getAllExpressionData() function is and will thus have lower performance for a larger number of cohorts & genes.
