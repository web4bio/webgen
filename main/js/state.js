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

  /** tabs for heatmap / violin plots */
  tabs: {
    instance: null,
    /** @type {?HTMLElement} Element containing the tabs. */
    element: null,

    /**
     * Initialize the tabs with materialize.
     * @returns {undefined}
     */
    initialize() {
      this.element = document.querySelector(".tabs");
      // M comes from materialize.
      if (!M) {
        console.error("materialize not loaded, cannot configure tabs");
      } else{
        this.instance = M.Tabs.init(this.element, {});
      }
    },

    /**
     * Make the tabs visible.
     * @returns {undefined}
     */
    show() {
      if (this.instance == null) {
        console.error("tabs not initialized, call state.tabs.initialize()");
      } else {
        this.instance.updateTabIndicator();
        $(this.element).show();}
    },
  },
};

Object.seal(state);

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
