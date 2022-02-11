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
      if (M === undefined || M === null) {
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

  /**
   * Object to allow us to interact with the select boxes on the page.
   */
  selectBoxes: {

    /**
     * Object for setting the options in the select boxes. In other words, this is
     * where we set the options of each select box.
     */
    options: {
      /**
       * Fill in options for cohorts.
       * @param {Array<{cohort: string, description: string}>} cohorts Cohort info.
       * @returns {undefined}
       */
      setCohorts(cohorts) {
        const selectBox = document.getElementById("cancerTypeMultipleSelection");
        // Clear the original options.
        selectBox.options.forEach(option => option.remove());
        // Add the new options.
        for (const cohort of cohorts) {
          const newOption = document.createElement("option");
          newOption.id = cohort["cohort"];
          newOption.value = cohort["cohort"];
          newOption.text = `(${cohort["cohort"]}) ${cohort["description"]}`;
          selectBox.appendChild(newOption);
        }
      },

      /**
       * Fill in options for gene mutations.
       * @returns {undefined}
       */
      setGeneMutations() {
        console.warn("not implemented");
      },

      /**
       * Fill in options for clinical features.
       * @returns {undefined}
       */
      setClinicalFeatures() {
        console.warn("not implemented");
      },

      /**
       * Fill in options for gene expressions.
       * @returns {undefined}
       */
      setGeneExpressions() {
        console.warn("not implemented");
      },

      /**
       * Fill in options for pathways.
       * @returns {undefined}
       */
      setPathways() {
        console.warn("not implemented");
      },
    },

    /**
     * Get array of selected cohorts.
     * @returns {string[]} Array of selected cohorts.
     * @example
     * state.query.cohort
     * // Expected result if one selected BRCA and PAAD: ["BRCA", "PAAD"]
     */
    getCohorts() {
      return $(".cancerTypeMultipleSelection").select2("data").map(cohort => cohort.id);
    },

    /**
     * Set the selected cohorts.
     * @param {string[]} cohorts Array of cohort names
     * @returns {undefined}
     */
    setCohorts(cohorts) {
      $(".cancerTypeMultipleSelection").select2("val", cohorts).trigger("change");
    },

    /**
     * Get array of genes queried for mutations.
     * @returns {string[]} Array of selected genes.
     * @example
     * state.query.mutation
     * // Expected result if one selected TP53: ["TP53"]
     */
    getMutations() {
      return $(".geneOneMultipleSelection").select2("data").map(gene => gene.text);
    },

    /**
     * Get array of selected clinical features.
     * @returns {string[]} Array of selected clinical features.
     * state.query.clinicalFeatures
     * // ["days_to_lst_followup"]
     */
    getClinicalFeatures() {
      return $(".clinicalMultipleSelection").select2("data").map(el => el.text);
    },

    /**
     * Get array of genes queried for expression.
     * @returns {string[]} Array of selected genes.
     */
    getExpressions() {
      return $(".geneTwoMultipleSelection").select2("data").map(gene => gene.text);
    },

    /**
     * Get array of pathways queried for expression.
     * @returns {string[]} Array of selected pathways.
     */
    getPathways() {
      return $(".pathwayMultipleSelection").select2("data").map(pathway => pathway.id);
    },

    /**
     * Get array of genes associated with the pathways.
     * @typedef {Object} GenesByPathway
     * @property {Array<string>} genes
     * @property {string} pathway
     * @returns {Promise<GenesByPathway[]>} Array of JSONs, the genes associated with pathways.
     */
    getGenesForPathways() {
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
Object.seal(state.selectBoxes);
Object.seal(state.selectBoxes.options);
Object.seal(state.query);
Object.seal(state);
