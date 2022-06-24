/** Perform a petch on a firebrowse endpoint. This function is not meant to be used
 * on its own. Please use `firebrowse.fetch`.
 *
 * @param {string} endpoint - FireBrowse endpoint to use.
 * @param {object} params - Parameters to the query.
 * @param {string} expectedKey - The key that is expected in the returned object.
 * @returns {Promise<Object.<string, Array>>} Fetched data.
 */
const _fetchFromFireBrowse = async function(endpoint, params, expectedKey) {
  const base = "https://firebrowse.jonasalmeida.repl.co";
  // Remove a leading / in the endpoint so we don't have duplicate / in
  // the url. Using // in a url is valid but it feels dirty.
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.substring(1);
  }
  endpoint = `http://firebrowse.org/api/v1/${endpoint}`;
  params = new URLSearchParams(params);
  const url = `${base}?${endpoint}?${params.toString()}`;
  const minimalJson = { [expectedKey]: [] };

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Fetching ${expectedKey} data was unsuccessful.`);
    return minimalJson;
  }
  const json = await response.json();
  if (!json) {
    console.log(`${expectedKey} is empty, returning an object with empty ${expectedKey} `);
    return minimalJson;
  }
  return json;
};


/** Make a deep clone of an object.
 *
 * @template T
 * @param {T} obj - Object to clone.
 * @returns {T} Deeply cloned object.
 */
const _deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};


/** Transform object of parameters to a list of grouped parameters.
 *
 * @param {Object.<string, any>} params - Parameters.
 * @param {Array.<{key: string, length: number}>} groupBy - Groupby info.
 *
 * @returns {Array.<Object.<string, any>>} Array of parameters.
 *
 * @example
 * const params = {
 *  "foo": ["a", "b", "c", "d"],
 *  "bar": ["w", "x", "y", "z"],
 *  "cat": "dog",
 * };
 * const groupBy = [{key: "foo", length: 4}, {key: "bar", length: 3}];
 * _paramsToParamsMatrix(params, groupBy);
 * // [{
 * //   bar: ["w", "x", "y"],
 * //   cat: "dog",
 * //   foo: ["a", "b", "c", "d"]
 * //  }, {
 * //   bar: ["z"],
 * //   cat: "dog",
 * //   foo: ["a", "b", "c", "d"]
 * //  }]
 */
const _paramsToParamsMatrix = function(params, groupBy) {

  const newParams = [];

  const addSlices = (slices) => {
    // Copy params so we can keep the data we are not grouping by, and then update
    // with the sliced objects.
    let paramsCopy = _deepClone(params);
    paramsCopy = Object.assign(paramsCopy, slices);
    newParams.push(paramsCopy);
  };

  if (groupBy.length === 1) {
    const groupByA = groupBy[0];
    for (let i=0; i<params[groupByA.key].length; i+=groupByA.length) {
      const slicedObject = {
        [groupByA.key]: params[groupByA.key].slice(i, i+groupByA.length),
      };
      addSlices(slicedObject);
    }
  } else if (groupBy.length === 2) {
    const groupByA = groupBy[0], groupByB = groupBy[1];
    for (let i=0; i<params[groupByA.key].length; i+=groupByA.length) {
      for (let j=0; j<params[groupByB.key].length; j+=groupByB.length) {
        const slicedObject = {
          [groupByA.key]: params[groupByA.key].slice(i, i+groupByA.length),
          [groupByB.key]: params[groupByB.key].slice(j, j+groupByB.length),
        };
        addSlices(slicedObject);
      }
    }
  } else if (groupBy.length === 3) {
    const groupByA = groupBy[0], groupByB = groupBy[1], groupByC = groupBy[2];
    for (let i=0; i<params[groupByA.key].length; i+=groupByA.length) {
      for (let j=0; j<params[groupByB.key].length; j+=groupByB.length) {
        for (let k=0; k<params[groupByC.key].length; k+=groupByC.length) {
          const slicedObject = {
            [groupByA.key]: params[groupByA.key].slice(i, i+groupByA.length),
            [groupByB.key]: params[groupByB.key].slice(j, j+groupByB.length),
            [groupByC.key]: params[groupByC.key].slice(k, k+groupByC.length),
          };
          addSlices(slicedObject);
        }
      }
    }
  } else {
    console.error("too many groupBy objects");
  }
  return newParams;
};

// Namespace within which we keep fetch functions.
const firebrowse = {};


/** Perform a fetch from the FireBrowse API.
 *
 * @param {string} endpoint - API endpoint to query.
 * @param {Object.<string, any>} params - Parameters of the query.
 * @param {Array.<{key: string, length: number}>} [groupBy] - Groupby info.
 *
 * @returns {Promise<Object.<string, Array>>} Fetched data.
 *
 * @example
 *  await fetchFromFireBrowse("/Samples/mRNASeq", {
 *      format: "json",
 *      gene: geneQuery,
 *      cohort: cohortQuery,
 *      protocol: "RSEM",
 *      page: "1",
 *      page_size: 2001,
 *      sort_by: "tcga_participant_barcode",
 *    });
 */
firebrowse.fetch = async function(endpoint, params, groupBy) {
  // We could use Array.at(-1) to get the last item, but that does not have broad
  // browser support at this time.
  const splits = endpoint.split("/");
  const expectedKey = splits[splits.length - 1];
  let pageSize = 2000;
  if(params.page_size) {
    pageSize = params.page_size;
  }

  if (groupBy == null || groupBy.length === 0) {
    return await _fetchFromFireBrowse(endpoint, params, expectedKey);
  } else {
    const results = {[expectedKey]: []};
    const paramsMatrix = _paramsToParamsMatrix(params, groupBy);
    /** @type {Array.<Promise<number>>} */
    //const calls = [];
    for (let i=0; i<paramsMatrix.length; i++) {
      const paramsForThisCall = paramsMatrix[i];
      // i/paramsMatrix.length for progress bar
      ProgressBar.setPercentage(i/paramsMatrix.length*100, "Fetching " + expectedKey);
      // Run a fetch and then collect the data into one common object.
      await _fetchFromFireBrowse(endpoint, paramsForThisCall, expectedKey)
        .then(x => {results[expectedKey].push(...x[expectedKey])});
    }
    ProgressBar.cleanUp();
    return results;
  }
};


/** Fetch Clinical_FH data from FireBrowse.
  *
  * @param {object} obj - Object with named arguments.
  * @param {string|string[]} obj.cohorts - Cohort(s) to fetch.
  * @param {string|string[]} obj.genes - Gene(s) to fetch.
  * @param {string|string[]} obj.barcodes - TCGA participant barcodes to fetch.
  *
  * @returns {Array} Clinical data.
  */
firebrowse.fetchClinicalFH = async function({cohorts, genes, barcodes, pageNum}) {
  if(!pageNum)
    pageNum = "1";
  if (!cohorts && !genes && !barcodes) {
    console.error("no arguments provided to function");
  }
  const params = {
    format: "json",
    sort_by: "tcga_participant_barcode",
    page: pageNum,
  };
  if (cohorts) {
    params.cohort = cohorts;
  }
  /** @type Array.<{key: string, length: number}> */
  const groupBy = [];
  if (genes) {
    params.gene = genes;
    groupBy.push({key: "gene", length: 20});
  }
  if (barcodes) {
    params.tcga_participant_barcode = barcodes;
    groupBy.push({key: "tcga_participant_barcode", length: 50});
  }
  const data = await firebrowse.fetch("/Samples/Clinical_FH", params, groupBy);
  return data.Clinical_FH;
};


/** Returns an array of objects, where each object has keys cohort and description.
 *
 * @returns {Array.<{cohort: string, description: string}>} Array of cohort information.
 *
 * @example
 * await firebrowse.cohorts()
 * // [{cohort: "ACC", description: "Adrenocortical carcinoma"}, ...]
 */
firebrowse.fetchCohorts = async function() {
  const params = { format: "json" };
  const data = await firebrowse.fetch("/Metadata/Cohorts", params);
  return data.Cohorts;
};

/** Get the number of mRNASeq samples per cohort.
 *
 * @param {string[]} cohorts - TCGA cohorts to query.
 * @returns {Array.<{cohort: string, mrnaseq: string}>} mRNASeq counts per cohort.
 *
 * @example
 * await firebrowse.counts(["ACC", "BRCA"])
 * // [{cohort: "ACC-TP", mrnaseq: "79"}, {cohort: "BRCA-TP", mrnaseq: "1093"}]
 */
firebrowse.fetchCounts = async function(cohorts) {
  if (!cohorts) {
    console.error("no cohorts given");
  }
  const params = {
    cohort: cohorts,
    sample_type: ["TP", "TB"],
    data_type: "mrnaseq",
    totals: "true",
  };
  const data = await firebrowse.fetch("/Metadata/Counts", params);
  return data.Counts;
};

firebrowse.fetchMutationMAF = async function ({cohorts, genes}) {
  const params = {
    format: "json",
    cohort: cohorts,
    tool: "MutSig2CV",
    gene: genes,
    page: "1",
    page_size: 2000,
    sort_by: "cohort",
  };
  //Initialize groupBy to an empty array and add the proper parameters if we specify genes or cohorts
  const groupBy = [];
  if (typeof(genes) == "object") {
    params.gene = genes;
    groupBy.push({key: "gene", length: 1});
  }
  if (typeof(cohorts) == "object") {
    params.cohort = cohorts;
    groupBy.push({key: "cohort", length: 1});
  }
  //Initialize data as an empty array and populate it with firebrowse.fetch data
  let data = [];
  //if-else statement accounts for whether there are sections of the firebrowse query to group by
  if(groupBy.length == 0) {
    data = await firebrowse.fetch("/Analyses/Mutation/MAF", params);
  }
  else {
    data = await firebrowse.fetch("/Analyses/Mutation/MAF", params, groupBy);
  }
  return data.MAF;
};


/** Fetch mRNA expression data.
 *
 * @param {object} obj - Object with named arguments.
 * @param {string|string[]} obj.cohorts - Cohort(s) to fetch.
 * @param {string|string[]} obj.genes - Gene(s) to fetch.
 * @param {string|string[]} obj.barcodes - TCGA participant barcodes to fetch. Optional.
 *
 * @typedef {Object} mRNASeqItem
 * @property {string} cohort
 * @property {number} expression_log2
 * @property {string} gene
 * @property {number} geneID
 * @property {string} protocol
 * @property {string} sample_type
 * @property {string} tcga_participant_barcode
 * @property {number} z-score
 *
 * @returns {Promise<{mRNASeq: mRNASeqItem[]}>} Object with fetched data.
 **/
firebrowse.fetchmRNASeq = async function({cohorts, genes, barcodes}) {
  if (!cohorts && !genes && !barcodes) {
    console.error("no arguments provided to function");
  }
  const params = {
    format: "json",
    sample_type: ["TP", "TB"],
    protocol: "RSEM",
    page: "1",
    page_size: 2001,
    sort_by: "tcga_participant_barcode"
  };
  if (cohorts) {
    params.cohort = cohorts;
  }
  /** @type Array.<{key: string, length: number}> */
  const groupBy = [];
  if (genes) {
    params.gene = genes;
    groupBy.push({key: "gene", length: 1});
  }
  if (barcodes) {
    params.tcga_participant_barcode = barcodes;
    groupBy.push({key: "tcga_participant_barcode", length: 400});
  }
  const data = await firebrowse.fetch("/Samples/mRNASeq", params, groupBy);
  return data.mRNASeq;
};

// Prevent any changes to this object.
Object.freeze(firebrowse);
