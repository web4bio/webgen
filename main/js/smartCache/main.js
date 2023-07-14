/**
 * 1) Call fetchWrapper
 * 2) It will then look into the interface member
 * 3) Process a diff between what exists in the interface already and what needs to be fetched
 * 4) Constructs a series of new queries which will use Jakub's fetch to then obtain the data
 * 5) Combines the queries results and existing data in our database (interface) into one and returns 1-D array
 */

/**
 * Improvements:
 * Abstraction: Data acquisition, interface for type of 'data' storable
 * Web workers
 */

// Test commands:
// cacheMe = await getCacheGE()
// cacheMe.fetchWrapper(['ACC'], ['ABI1'], ['TCGA-OR-A5J1','TCGA-OR-A5J2','TCGA-OR-A5J3'])
// cacheMe.fetchWrapper(['ACC'], ['ABI1'], ['TCGA-OR-A5J1','TCGA-OR-A5J2','TCGA-OR-A5J3', 'TCGA-OR-A5JO'])

// Note: You may create multiple new loki() objects, if they share the same name, they are essentially the same.
// You must also call db.loadDatabase(...) to populate the loki object with data from IndexedDB.
// Data existing in IndexedDB != present in loki(), remember loki() is "middle-man".

// Bugs(?):
// The data might sometimes not get saved

var cacheGE = undefined
var cacheMU = undefined
//Create undefined cache object for bardcode data
var cacheBAR = undefined

async function getCacheGE() {
  if (cacheGE) {
    return cacheGE
  } else {
    return new Promise((resolve, reject) => {
      const db = new loki('smart-cache-ge.db', {
        adapter: new LokiIndexedAdapter(),
      })
      db.loadDatabase({}, (err) => {
        if (err) reject(err)
        if (!db.getCollection('cohorts')) {
          console.warn('db re-initialized')
          db.addCollection('cohorts', { unique: '_id' })
          db.saveDatabase()
        }
        cacheGE = new CacheInterface('smart-cache-ge.db')
        //Including setTimeout() for cacheGE
        setTimeout(() => resolve(cacheGE), 500)
        //resolve(cacheGE)
      })
    })
  }
}

async function getCacheMU() {
  if (cacheMU) {
    return cacheMU
  } else {
    return new Promise((resolve, reject) => {
      const db = new loki('smart-cache-mu.db', {
        adapter: new LokiIndexedAdapter(),
      })
      db.loadDatabase({}, (err) => {
        if (err) reject(err)
        if (!db.getCollection('cohorts')) {
          console.warn('db re-initialized')
          db.addCollection('cohorts', { unique: '_id' })
          db.saveDatabase()
        }
        cacheMU = new CacheInterface('smart-cache-mu.db')
        setTimeout(() => resolve(cacheMU), 500)
      })
    })
  }
}

/**
 * If barcode cache database exists, return interface to interact with database.
 * Otherwise create database and then return interface.
 * @returns CacheInterface object for barcode caching
 */
async function getCacheBAR() {
  if(cacheBAR) {
    return cacheBAR
  }
  else {
    return new Promise((resolve, reject) => {
      const db = new loki('smart-cache-bar.db', {
        adapter: new LokiIndexedAdapter(),
      })
      db.loadDatabase({}, (err) => {
        if (err) reject(err)
        if (!db.getCollection('cohorts')) {
          console.warn('db re-initialized')
          db.addCollection('cohorts', { unique: '_id' })
          db.saveDatabase()
        }
        cacheBAR = new CacheInterface('smart-cache-bar.db')
        setTimeout(() => resolve(cacheBAR), 500)
      })
    })
  }
}

function CacheInterface(nameOfDb) {
  this.interface = new Map([])
  this.db = new loki(nameOfDb, {
    adapter: new LokiIndexedAdapter(),
  })
  this.db.loadDatabase({}, () => {
    let dv = this.db.getCollection('cohorts').addDynamicView('dv')
    let results = dv.data()
    for (let r of results) {
      this.interface.set(r._id, new Map([]))
      let cohortData = this.db.getCollection(r._id).data
      for (let gene of cohortData) {
        this.interface
          .get(r._id)
          .set(gene._id, new Map(Object.entries(gene.barcodes)))
      }
    }
  })

  // cohort = primary key
  // barcode = ternary key (only purpose is to index the payload, any unique field in payload works)
  // expression = secondary key
  this.saveToDB = function (cohort, barcode, /*gene,*/ expression, payload) {
    let dv = this.db
      .getCollection('cohorts')
      //.getCollection('mutations')
      .addDynamicView('dv')
      .applyFind({ _id: cohort }) // Check if _cohort exists
      //.applyFind({_id: gene})
    if (dv.data().length <= 0) {
      // Not found, create the collection named _cohort
      this.db.getCollection('cohorts').insert({ _id: cohort })
      let newCohortCollection = this.db.addCollection(cohort, {
        unique: '_id',
        ttl: 604800000,
      })
      newCohortCollection.insert({
        _id: expression,
        barcodes: {
          [barcode]: payload,
        },
      })
    } else {
      // _cohort collection exists
      let foundCohortCollection = this.db.getCollection(cohort)
      let existingExpr = foundCohortCollection.by('_id', expression)
      if (existingExpr) {
        existingExpr.barcodes = {
          ...existingExpr.barcodes,
          [barcode]: payload,
        }
        foundCohortCollection.update(existingExpr)
      } else {
        foundCohortCollection.insert({
          _id: expression,
          barcodes: {
            [barcode]: payload,
          },
        })
      }
    }
    // this.db.saveDatabase()
  }

  this.getFromDB = function (cohort, barcode, expression) {
    this.db
      .getCollection(cohort)
      .data.map((expr) => Object.values(expr.barcodes))
  }

  this.add = function (cohort, barcode, expression, payload) {
    let interface = this.interface
    //Added if logic for if the barcode is present (ie. caching anything but barcodes)
    if (!interface.get(cohort) && payload) {
      interface.set(cohort, new Map([]))
    }
    else if(!interface.get(cohort) && !payload) {
      interface.set(cohort, [])
    }

    //Add edge case for saving only barcodes
    if(!expression && !payload) {
      if(interface.get(cohort)) {
        let temp = interface.get(cohort)
        if (typeof(temp) === 'undefined' || temp.length == 0) {
          interface.set(cohort, [barcode])
        }
        else {
          temp.push(barcode)
          interface.set(cohort, temp)
        } 
      }   
    }

    else if (interface.get(cohort).get(expression)) {
      let temp = interface.get(cohort).get(expression).get(barcode)
      if (typeof temp === 'undefined') {
        interface.get(cohort).get(expression).set(barcode, payload)
      }
    } else {
      interface.get(cohort).set(expression, new Map([[barcode, payload]]))
    }
  }

  this.findDiff = function (listOfBarcodes, cohort, expression) {
    let s = new Set()
    let foundS = new Set()
    let interface = this.interface
    if (interface.has(cohort) && interface.get(cohort).has(expression)) {
      let map = interface.get(cohort).get(expression)
      for (let barcode of listOfBarcodes) {
        if (!map.has(barcode)) {
          s.add(barcode)
        } else {
          foundS.add(barcode)
        }
      }
    } else {
      return [new Set(listOfBarcodes), foundS]
    }
    return [s, foundS]
  }

  this.constructQueries = function (
    listOfCohorts,
    listOfExpressions,
    listOfBarcodes
  ) {
    let res = {}
    let foundRes = {}
    for (let cohort of listOfCohorts) {
      if (!(cohort in res)) {
        res[cohort] = {}
      }
      if (!(cohort in foundRes)) {
        foundRes[cohort] = {}
      }
      for (let expr of listOfExpressions) {
        if (!(expr in res[cohort])) {
          res[cohort][expr] = []
        }
        if (!(expr in foundRes[cohort])) {
          foundRes[cohort][expr] = []
        }
        let [diff, alreadyHave] = this.findDiff(listOfBarcodes, cohort, expr)
        if (diff.size > 0) {
          diff.forEach((val) => res[cohort][expr].push(val))
        }
        if (alreadyHave.size > 0) {
          alreadyHave.forEach((val) => foundRes[cohort][expr].push(val))
        }
      }
    }
    for (let k in foundRes) {
      for (let k2 in foundRes[k]) {
        if (foundRes[k][k2].length === 0) {
          delete foundRes[k][k2]
        }
      }
    }
    return [res, foundRes]
  }

  this.fetchWrapperGE = async function (listOfCohorts, listOfGenes, listOfBarcodes) {
    findDiff = function (listOfBarcodes, cohort, expression, interface) {
      let s = new Set()
      let foundS = new Set()
      if (interface.has(cohort) && interface.get(cohort).has(expression)) {
        let map = interface.get(cohort).get(expression)
        for (let barcode of listOfBarcodes) {
          if (!map.has(barcode)) {
            s.add(barcode)
          } else {
            foundS.add(barcode)
          }
        }
      } else {
        return [new Set(listOfBarcodes), foundS]
      }
      return [s, foundS]
    }

    /**
     * 
     * @param {Array} listOfCohorts 
     * @param {Array} listOfGenes 
     * @param {Array} listOfBarcodes 
     * @param {Map} interface 
     * @returns 
     */
    function constructQueriesGE(listOfCohorts, listOfGenes, listOfBarcodes = [], interface) {
      /*There is no scenario in which a subset of a cohort's gene expression data gets cached before the entire
      cohort's gene expression data is cached.*/
      let res = {}
      let foundRes = {}
      //Iterate over list of cohorts
      for (let cohort of listOfCohorts) {
        //Set cohort field for res, foundRes to shorten future logic
        res[cohort] = {}
        foundRes[cohort] = {}
        //Iterate over list of genes (recall that the objects returned will be doubly-indexed)
        for (let gene of listOfGenes) {
          /*There is no instance where only a subset of a cohort has its gene expression cached, so we don't factor
          in barcodes here*/
          if (interface.has(cohort) && interface.get(cohort).has(gene)) {
            //Within the empty JSON referenced by foundRes[cohort], append gene as a property that points to empty array
            foundRes[cohort][gene] = [];
          }
          /*If cached data does not have a specific gene's expression data or has not cached the cohort,
          then include this gene, cohort combination in res*/
          else {
            //Within the empty JSON referenced by res[cohort], append gene as a property that points to empty array
            res[cohort][gene] = [];
          }
          /*If a listOfBarcodes contains data, then identify the barcodes that are not cached for a cohort, gene
          combination and identify the barcodes that are cached for a cohort, gene combination. */
          let [diff, alreadyHave] = findDiff(listOfBarcodes, cohort, gene, interface)
          if (diff.size > 0) {
            diff.forEach((val) => res[cohort][gene].push(val))
          }
          if (alreadyHave.size > 0) {
            alreadyHave.forEach((val) => foundRes[cohort][gene].push(val))
          }
        }
      }
      //Remove the instances of empty array values from foundRes, res
      for (let cohort in foundRes) {
        //If no genes are cached for a certain cohort at all, then delete the JSON field for cohort from res
        if(Object.keys(foundRes[cohort]).length === 0)
          delete foundRes[cohort]
      }
      for (let cohort in res) {
        //If no genes are cached for a certain cohort at all, then delete the JSON field for cohort from res
        if(Object.keys(res[cohort]).length === 0)
          delete res[cohort]
      }
      return [res, foundRes]
    }

    /**
     * 
     * @param {Array} interface 
     * @returns 
     */
    async function executeQueriesGE(interface) {
      //Iterate over each cohort, gene combination
      for (let cohort in interface) {
        for (let gene in interface[cohort]) {
          //Fetch expression data for requested cohort, gene, and barcodes with Firebrowse fetch call
          let expressionData = await firebrowse.fetchmRNASeq({cohorts: [cohort], genes: [gene]})  
          for(let index = 0; index < expressionData.length; index++) {
            let obj = expressionData[index];
            try {
              //Call add() and saveToDB() to cache the fetched data
              await cacheGE.add(obj.cohort, obj.tcga_participant_barcode, gene, obj);
              await cacheGE.saveToDB(obj.cohort, obj.tcga_participant_barcode, gene, obj);
            } catch(err) {
              //If an error occurred, print an error message and end execution
              console.error('Failed, skipping for cohort.', err);
              return undefined
            }
          }
        }
      }
    }

    //Identify missing gene expression records and retrieve currently-cached gene expression records
    let [missingInterface, hasInterface] = constructQueriesGE(listOfCohorts, listOfGenes, listOfBarcodes, this.interface)    
    //tmp will store an array of JSONs
    let tmp = []

    //Iterate over each cohort in hasInterface
    for (let cohort in hasInterface) {
      //Obtain Map object of gene expression data for cohort
      let interfaceData = await this.interface.get(cohort) 
      //Obtain list of barcodes with cacheBAR
      let cacheBAR = await getCacheBAR();
      //Retrieve an array of Maps linking cohorts to their set of TCGA barcodes
      let currentListOfBarcodes = await cacheBAR.fetchWrapperBAR(listOfCohorts = [cohort]);
      //Since we are only requesting one barcode at a time, we can index the first element to retrieve the desired barcodes array
      currentListOfBarcodes = currentListOfBarcodes[0].barcodes;
      //Within a cohort, iterate over each gene that the caching interface has stored mRNA_Seq data for 
      for (let gene of Object.keys(hasInterface[cohort])) {
        //Iterate over the complete set of barcodes for the cohort we are on
        for (let curBarcode of currentListOfBarcodes) {
          //If there are specific barcodes we are requesting, then return only those barcodes' gene expression data
          if(listOfBarcodes && listOfBarcodes.includes(curBarcode))
              tmp.push(interfaceData.get(gene).get(curBarcode));
          //If there are no specific barcodes we are requesting, then do not use filter 
          else if(!listOfBarcodes)
            tmp.push(interfaceData.get(gene).get(curBarcode));
        }
      }
    }
    //Retrieve non-cached gene expression data with Firebrowse methods and store in cache
    await executeQueriesGE(missingInterface);

    //Iterate over each cohort in missingInterface
    for (let cohort in missingInterface) {
      let interfaceData = await this.interface.get(cohort) // Obtain Map object of gene expression data for cohort
      let cacheBAR = await getCacheBAR(); // Obtain list of barcodes with cacheBAR
      let currentListOfBarcodes = await cacheBAR.fetchWrapperBAR([cohort]); // Retrieve an array of Maps linking cohorts to their set of TCGA barcodes
      currentListOfBarcodes = currentListOfBarcodes[0].barcodes; // Since we are only requesting one barcode at a time, we can index the first element to retrieve the desired barcodes array
      //Within a cohort, iterate over each gene that the caching interface retrieved mRNA_Seq data for with executeQueriesGE()
      for (let gene of Object.keys(missingInterface[cohort])) {
        for (let curBarcode of currentListOfBarcodes) {
          //If there are specific barcodes we are requesting, then return only those barcodes' gene expression data
          if(listOfBarcodes && listOfBarcodes.includes(curBarcode))
            tmp.push(interfaceData.get(gene).get(curBarcode));
          //If there are no specific barcodes we are requesting, then do not use filter 
          else if(!listOfBarcodes)
            tmp.push(interfaceData.get(gene).get(curBarcode));
        }
      }
    }
    //Returned flattened result of tmp
    return tmp.flat()
  }

  /**
   * Retrieves requested mutation data from cache.
   * If requested data is missing from cache, it is fetched via Firebrowse and cached.
   * @param {Array} listOfCohorts An array of Strings representing the cohort(s) to fetch
   * mutation data for
   * @param {Array} listOfGenes An array of Strings representing the gene(s) to fetch
   * mutation data for
   * @param {Array} listOfMutationTypes An array of Strings representing the mutation types to retrieve data for
   * @returns Properly-categorized mutation data for specified cohorts, genes.
   */
  this.fetchWrapperMU = async function (listOfCohorts, listOfGenes, listOfMutationTypes) {
    function constructQueriesMU(listOfCohorts, listOfExpressions, interface) {
      let res = {}
      let foundRes = {}
      for (let cohort of listOfCohorts) {
        if (!(cohort in res)) {
          res[cohort] = []
        }
        if (!(cohort in foundRes)) {
          foundRes[cohort] = []
        }
        for (let expression of listOfExpressions) {
          if (interface.has(cohort) && interface.get(cohort).has(expression)) {
            foundRes[cohort].push(expression)
          } else {
            res[cohort].push(expression)
          }
        }
      }
      for (let k in foundRes) {
        if (foundRes[k].length === 0) {
          delete foundRes[k]
        }
      }
      //Clean up on res?
      return [res, foundRes]
    }

    /**
     * 
     * @param {*} cohort 
     * @param {*} gene 
     * @param {*} mutationData 
     * @returns 
     */
    async function formatMutationData(cohort, gene, mutationData) {
      //Instantiate barcode caching interface
      let cacheBar = await getCacheBAR();
      //Obtain barcodes for cohorts of interest
      let barcodesByCohort = await cacheBar.fetchWrapperBAR([cohort]);
      //Since we are only fetching one cohort's worth of barcodes, our result will be an array with a single JSON, from which we want the barcodes property
      let cohortBarcodes = barcodesByCohort[0].barcodes;
      let barcodeMutations = new Map();
      // If mutations DO exist for this gene (i.e., if the gene is NOT wild-type)
      if(mutationData != undefined) {
        // Substring barcodes to get TCGA Participant ID and save barcodes
        for(let index = 0; index < mutationData.length; index++) {
          // Loop over  to filter out barcodes unique to the mutation data
          mutationData[index].Tumor_Sample_Barcode = mutationData[index].Tumor_Sample_Barcode.substring(0, 12); // Get substring of tumor sample barcode to match TCGA participant barcode format
          let barcodeInCohort = cohortBarcodes.includes(mutationData[index].Tumor_Sample_Barcode); // Track whether current mutation data barcode is present in cohort's barcodes
          if(!barcodeInCohort) {
            mutationData.splice(index, 1); // If current mutation data barcode is not present in cohort's barcodes, remove corresponding entry from mutationData
            index--; //Decrement index by 1 for indexing purposes
          }
          else {
            if(barcodeMutations.has(mutationData[index].Tumor_Sample_Barcode)) {
              let mutationsArr = barcodeMutations.get(mutationData[index].Tumor_Sample_Barcode); // Get current array of mutations for current barcode
              mutationsArr.push(mutationData[index].Variant_Classification); // If current mutation data barcode is present, then append the variant classification to variants set
              barcodeMutations.set(mutationData[index].Tumor_Sample_Barcode, mutationsArr); // Set current barcode's value to updated array of mutations 
            }
            else
              barcodeMutations.set(mutationData[index].Tumor_Sample_Barcode, [mutationData[index].Variant_Classification]); // Initialize the array of mutations for current barcode
          }
        }
        let mutationDataToReturn = []; // Array of JSONs to return from this function
        //Concatenate the mutations associated with each patient into a single String
        barcodeMutations.forEach((mutations, barcode) => {
          let mutationLabel = mutations[0];
          if(mutations.length > 1) {
            for(let index = 1; index < mutations.length; index++)
              mutationLabel += "_&_" + mutations[index]; 
          }
          mutationDataToReturn.push({"tcga_participant_barcode":barcode, "cohort":cohort, "gene":gene, "mutation_label":mutationLabel});
        });

        //Designate all barcodes without mutation data as "Wild_Type"
        for(barcode of cohortBarcodes) {
          if(!barcodeMutations.has(barcode)) {
            mutationDataToReturn.push({"tcga_participant_barcode":barcode, "cohort":cohort, "gene":gene, "mutation_label":"Wild_Type"});
          }
        }
        return mutationDataToReturn; // Return formatted data
      }
      // If mutations do NOT exist for this gene (i.e., if the gene is wild-type)
      else {
        //No mutation data means that we have only "Wild_Type" mutation values
        let mutationDataToReturn = [];
        //Loop over cohortBarcodes and create JSON element for each patient with "Wild_Type" mutation value
        for(barcode of cohortBarcodes)
            mutationDataToReturn.push({"tcga_participant_barcode":barcode, "cohort":cohort, "gene":gene, "mutation_label":"Wild_Type"});
        return mutationDataToReturn; // Return formatted data
      }
    }

    /**
     * 
     * @param {Array} interface 
     * @returns 
     */
    async function executeQueriesMU(interface) {
      //Iterate over each cohort, gene combination
      for (let cohort in interface) {
        for (let gene of interface[cohort]) {
          //Fetch expression data for requested cohort, gene, and barcodes with Firebrowse fetch call
          let rawMutationData = await firebrowse.fetchMutationMAF({cohorts: [cohort], genes: [gene]});
          let mutationData = await formatMutationData(cohort, gene, rawMutationData);
          for(let index = 0; index < mutationData.length; index++) {
            let obj = mutationData[index];
            try {
              //Call add() and saveToDB() to cache the fetched data
              await cacheMU.add(obj.cohort, obj.tcga_participant_barcode, gene, obj);
              await cacheMU.saveToDB(obj.cohort, obj.tcga_participant_barcode, gene, obj);
            } catch(err) {
              //If an error occurred, print an error message and end execution
              console.error('Failed, skipping for cohort.', err);
              return undefined
            }
          }
        }
      }
    }

    let [missingInterface, hasInterface] = constructQueriesMU(
      listOfCohorts,
      listOfGenes,
      this.interface
    )

    let tmp = []
    // It wants all the barcodes
    for (let cohort in hasInterface) {
      let interfaceData = await this.interface.get(cohort) // Obtain Map object of mutation data for cohort
      // Within a cohort, iterate over each gene that the caching interface has stored mutation data for
      for (let gene of hasInterface[cohort]) {
        let mutationData = Array.from(interfaceData.get(gene).values()); // Use values() to get mutation data from Map
        for (let index = 0; index < mutationData.length; index++) {
          // If no mutation types to filter by have been specified, then append patient
          if(!listOfMutationTypes) {
            tmp.push(mutationData[index]); // Append patient to mutationData
          }
          else {
            if(listOfMutationTypes.includes(mutationData[index].mutation_label))
              tmp.push(mutationData[index]); // Append patient to mutationData
          }
        }
      }
    }

    await executeQueriesMU(missingInterface); // Query mutation data that is not cached

    //Iterate over each cohort in missingInterface
    for (let cohort in missingInterface) {
      let interfaceData = await this.interface.get(cohort) // Obtain Map object of mutation data for cohort
      //Within a cohort, iterate over each gene that the caching interface retrieved mutation data for with executeQueriesMU()
      for (let gene of missingInterface[cohort]) {
        let mutationData = Array.from(interfaceData.get(gene).values()); // Use values() to get mutation data from Map
        for(let index = 0; index < mutationData.length; index++) {
          // If no mutation types to filter by have been specified, then append patient
          if(!listOfMutationTypes)
            tmp.push(mutationData[index]); // Append patient to mutationData
          else {          
            if(listOfMutationTypes.includes(mutationData[index].mutation_label))
              tmp.push(mutationData[index]); // Append patient to mutationData
          }
        }
      }
    }
    return tmp.flat();
  }

  /**
   * Creates interface for barcode data that is indexed by cohort
   * @param {Array} listOfCohorts 
   * @returns A flattened array of JSON objects indexed by cohort containing barcode data
   */
  this.fetchWrapperBAR = async function(listOfCohorts) {
    /**
     * Returns two lists of cohorts whose barcodes are and are not cached in database
     * @param {Array} listOfCohorts is an array of cohorts to determine if their barcodes
     * are cached or not
     * @param {CacheInterface} interface for caching data
     * @returns Two lists of cohorts corresponding to either cached or not cached barcodes
     */
    function constructQueriesBAR(listOfCohorts, interface) {
      let res = {}
      let foundRes = {}
      for (let cohort of listOfCohorts) {
        if (!(interface.has(cohort))) {
          res[cohort] = []
        }
        else {
          foundRes[cohort] = []
        }
      }
      return [res, foundRes]
    }
    /**
     * Fetches the barcodes that are missing in the cache and stores them in the cache
     * @param {Array} interface is an array of strings representing each cohort of interest
     * @returns No data is returned
     */
    async function executeQueriesBAR(interface) {
      //Harcode gene to query mRNASeq data for
      let expr = "TP53"
      //For each cohort, query the mRNASeq data for that cohort
      for (let cohort in interface) {
        //Get mRNASeq data with hardcoded gene
        /*Currently uses low-level firebrowse function to fetch mRNASeq data;
        replace with appropriate gene expression caching method!*/
        let expressionData = await firebrowse.fetchmRNASeq({
          cohorts: [cohort],
          genes: [expr],
        })
        //Iterate over each JSON object in fetched expression data and save to cache
        for(let index = 0; index < expressionData.length; index++) {
          let obj = expressionData[index];
          try {
            //Call add() and saveToDB() to cache the fetched data
            await cacheBAR.add(obj.cohort, obj.tcga_participant_barcode);
            await cacheBAR.saveToDB(obj.cohort, obj.tcga_participant_barcode, obj);
          } catch(err) {
            //If an error occurred, print an error message and end execution
            console.error('Failed, skipping for cohort.', err);
            return undefined
          }
        }
      }
    }

    //missingInterface is an array of cohorts whose barcodes have not yet been cached
    //hasInterface is an array of barcodes whose barcodes have been cached
    let [missingInterface, hasInterface] = constructQueriesBAR(
      listOfCohorts,
      this.interface
    )
    //tmp will be the aray that contains the requested barcodes and gets returned
    let tmp = []
    // Iterate through the cohorts whose barcodes have already been cached and retrieve those barcodes
    for (let cohort in hasInterface) {
      let cachedBarcodes = await this.interface.get(cohort)
      let emptyTmp = []
      for (let k of cachedBarcodes) {
        emptyTmp.push(k)
      }
      tmp.push({cohort:cohort, barcodes: emptyTmp})
    }
    //Execute queries for missing cohort barcodes
    await executeQueriesBAR(missingInterface);
    //Append missing data that was just queried to tmp
    for(let cohort in missingInterface) {
      let newBarcodes = await this.interface.get(cohort)
      let emptyTmp = []
      for (let k of newBarcodes) {
        emptyTmp.push(k)
      }
      tmp.push({cohort:cohort, barcodes: emptyTmp})
    }  
    //Return the data pushed to tmp
    return tmp.flat();
  }
}

CacheInterface.prototype.pprint = function () {
  function f(entries) {
    let o = Object.fromEntries(entries)
    for (let [key, val] of Object.entries(o)) {
      if (val instanceof Map) {
        o[key] = f(val)
      }
    }
    return o
  }
  return (this.interface)
}