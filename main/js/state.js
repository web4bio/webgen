/* global M */

/**
 * State of the WebGen app.
 */
const state = {

  /** @type {?Array.<Object.<string, any>>} */
  allClinicalData: null,

  /** @type {?Array.<{isSelected: boolean, name: string, type: string}>} */
  clinicalType: null,

  /** Array of valid pathways.
   * @type {?Object.<string, string[]>}
   */
  validPathways: null,

  /**
   * Initialize the state object.
   * @returns {undefined}
   */
  async init() {
    this.validPathways = await fetch(
      "https://raw.githubusercontent.com/web4bio/webgen/development/main/genePathwaysList.json"
    ).then(response => response.json());
  },

  /** tabs for heatmap / violin plots */
  tabs: {
    instance: null,

    /** Element containing the tabs.
     * @type {?HTMLElement}
     */
    element: null,

    /**
     * Initialize the tabs with materialize.
     * @returns {undefined}
     */
    init() {
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
     * state.query.cohort
     * // Expected result if one selected BRCA and PAAD: ["BRCA", "PAAD"]
     */
    get cohorts() {
      return $(".cancerTypeMultipleSelection").select2("data").map(cohort => cohort.id);
    },

    /**
     * Get array of genes queried for mutations.
     * @returns {string[]} Array of selected genes.
     * @example
     * state.query.mutation
     * // Expected result if one selected TP53: ["TP53"]
     */
    get mutations() {
      return $(".geneOneMultipleSelection").select2("data").map(gene => gene.text);
    },

    /**
     * Get array of selected clinical features.
     * @returns {string[]} Array of selected clinical features.
     * state.query.clinicalFeatures
     * // ["days_to_lst_followup"]
     */
    get clinicalFeatures() {
      return $(".clinicalMultipleSelection").select2("data").map(el => el.text);
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

    /**
     * Get array of genes associated with the pathways.
     * @typedef {Object} GenesByPathway
     * @property {Array<string>} genes
     * @property {string} pathway
     * @returns {Promise<GenesByPathway[]>} Array of JSONs, the genes associated with pathways.
     */
    get genesForPathways() {
      if (state.validPathways === null) {
        console.warn("validPathways is null. Did you forget to initialize state?");
        return [];
      }
      /** @type {GenesByPathway[]} */
      const genes = [];
      for (const pathway of this.pathways) {
        genes.push({pathway: pathway, genes: state.validPathways[pathway]});
      }
      return genes;
    }
  },

};

Object.seal(state.tabs);
Object.seal(state.query);
Object.seal(state);
