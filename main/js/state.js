/* global M */

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

  query: {

    /**
     * Get array of selected cohorts.
     * @returns {string[]} Array of selected cohorts.
     * @example
     * state.cohortQuery
     * // Expected result if one selected BRCA and PAAD: ["BRCA", "PAAD"]
     */
    get cohorts() {
      return $(".cancerTypeMultipleSelection").select2("data").map(cohort => cohort.text.match(/\(([^)]+)\)/)[1]);
    },

    /**
     * Get array of genes queried for mutations.
     * @returns {string[]} Array of selected genes.
     * @example
     * state.mutationQuery
     * // Expected result if one selected TP53: ["TP53"]
     */
    get mutations() {
      return $(".geneOneMultipleSelection").select2("data").map(gene => gene.text);
    },

    /**
     * Get array of genes queried for expression.
     * @returns {string[]} Array of selected genes.
     */
    get expressions() {
      return $(".geneTwoMultipleSelection").select2("data").map(gene => gene.text);
    },

    /**
     * Get array of pathways queried for expression.
     * @returns {string[]} Array of selected pathways.
     */
    get pathways() {
      return $(".pathwayMultipleSelection").select2("data").map(pathway => pathway.id);
    },
  },

};

Object.seal(state.tabs);
Object.seal(state.query);
Object.seal(state);
