/**
 * State of the WebGen app.
 */
const state = {

  /** @type {?Array.<Object.<string, any>>} */
  allClinicalData: null,

  /** @type {?Array.<{isSelected: boolean, name: string, type: string}>} */
  clinicalType: null,

  /** @type {string[]} */
  validPathways: null,

  /** heatmap / violin plots */
  tabs: {
    options: {},
    instance: null,
  },
};

/**
 * tooltipNum (NOT USED)
 * validPathwaysList
 *
 * results
 * i, j
 * locationX
 * locationY
 *
 * sampTrackVars
 * sortToggleDiv
 *
 * toggleClust
 *
 * input
 * density
 * allBins
 * lengths
 * longest
 *
 * TAB STUFF
 * options
 * instance
 */
