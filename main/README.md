The HTML file along with the CSS file set up the web app hosted by GitHub.

The JS files are now more modulated:

1) ethan_master.js contains the master function communicating the user input from the HTML file to the helper JS functions to    fetch the correct mRNA-Seq data from the GDC using FireBrowse and Jonas' herokuapp. This function then returns the data to    build the Plotly Plots in the HTML Doc.

2) ethan_data_import.js contains the fetchmRNASeqData() function which is a function optimized for fetching mRNA-Seq data from    the GDC for the visualization processes to come later. This file also contains the getExpressionArray() function which        utlizes the fetchmRNASeqData() function to fetch data from the GDC and returns an array containing the expression arrays      for each cohort/gene combination, as well as information about genes that have missing mRNA-Seq data.

3) ethan_mRNASeq_histogram.js contains the function for building the histograms for the mRNA-Seq data that is returned from      getExpressionArray().

4) ethan_mRNASeq_heatmaps.js contains the functions for building both the regular and the normalized average heatmaps for the    mRNA-Seq data that is returned from getExpressionArray().

5) ethan_doc_manipulation.js contains the functions for manipulating the HTML Doc via JS. This includes tha ability to            add/remove DIV elements, the warning/error message functionality, and a function for varifying the validity of user            inputted cancer cohorts.

6) ethan_getExpressionJSONarray.js is a contains the function: ethan_getExpressionJSONarray(). This function
   is useful for inputing a list of cancer cohorts and a list of genes to get back an array of JSONs where each JSON
   contains the cohort, the gene, and RNA Sequencing data pulled from the GDC for that cohort & gene.
   NOTE: This function is not involved in the current web app process and is not incorporated into the HTML file. This script          was solely developed to share. Also, this functions process for fetching the GDC data is not as optimized as the              fetchmRNASeqData() function is and will thus have lower performance for a larger number of cohorts & genes.
