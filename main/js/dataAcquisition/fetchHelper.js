const _fetchFromFireBrowse = async function(endpoint, params) {
  const base = "https://firebrowse.herokuapp.com";
  // Remove a leading / in the endpoint so we don't have duplicate / in
  // the url. Using // in a url is valid but it feels dirty.
  if (endpoint.startsWith("/")) {
    endpoint = endpoint.substring(1);
  }
  endpoint = `http://firebrowse.org/api/v1/${endpoint}`;
  params = new URLSearchParams(params);
  const url = `${base}?${endpoint}?${params.toString()}`;

  // We could use Array.at(-1) to get the last item, but that does not have broad
  // browser support at this time.
  const splits = endpoint.split("/");
  const expectedKey = splits[splits.length - 1];
  const minimal_json = { [expectedKey]: [] };

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Fetching ${expectedKey} data was unsuccessful.`);
    return minimal_json;
  }
  const json = await response.json();
  if (!json) {
    console.log(`${expectedKey} is empty, returning an object with empty ${expectedKey} `);
    return minimal_json;
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
 * @template T
 * @param {T} params - Parameters.
 * @param {Array.<{key: string, length: number}>} groupBy - Groupby info.
 *
 * @returns {T[]} Array of parameters.
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


/** Perform a fetch from the FireBrowse API.
 *
 * @param {string} endpoint - API endpoint to query.
 * @param {{}} params - Parameters of the query.
 * @param {Array.<{key: string, length: number}>} [groupBy] - Groupby info.
 *
 * @returns {Promise<Object>} The fetched data.
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
const fetchFromFireBrowse = async function(endpoint, params, groupBy) {
  if (groupBy == null) {
    return await _fetchFromFireBrowse(endpoint, params);
  } else {
    const paramsMatrix = _paramsToParamsMatrix(params, groupBy);
    const calls = [];
    for (let i=0; i<paramsMatrix.length; i++) {
      const call = _fetchFromFireBrowse(endpoint, paramsMatrix[i]);
      calls.push(call);
    }
    const data = await Promise.all(calls);
    // TODO: merge the data together.
  }
};
