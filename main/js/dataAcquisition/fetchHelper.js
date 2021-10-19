/** Perform a fetch from the FireBrowse API.
 *
 * @param {string} endpoint - API endpoint to query.
 * @param {Object} params - Parameters of the query.
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
const fetchFromFireBrowse = async function(endpoint, params) {
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

/** Return cartesian product of arrays.
 *
 * @param  {...[]} a - Arrays for which to compute cartesian product.
 * @returns {[][]} - Nested array with cartesian product of inputs.
 *
 * See https://stackoverflow.com/a/43053803/5666087.
 */
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

/** Perform multiple fetches from the FireBrowse API.
 *
 * @param {endpoint} endpoint - API endpoint to query.
 * @param {params} params - Parameters of the query.
 * @param {groupBy} [groupBy] - Use multiple concurrent fetches by this parameter.
 *
 * @returns {Promise<Object>} The fetched data.
 */
const multiFetchFromFireBrowse = async function(endpoint, params, groupBy = null) {

  const allCombinations = cartesian(groupBy);
  await fetchFromFireBrowse(endpoint, params);
};
