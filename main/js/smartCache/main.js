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

  //   this.executeQueriesMU = function (interface) {
  //     let promises = []
  //     // Loop through each cancer type in interface
  //     // {
  //     //     "ACC": {
  //     //         "ABI1": [
  //     //             "TCGA-OR-A5J1", "TCGA-OR-A5J2", "TCGA-OR-A5J3"
  //     //         ],
  //     //          "ABI2": [
  //     //             "XCGA-OR-A5J1", "XCGA-OR-A5J2", "XCGA-OR-A5J3"
  //     //         ]
  //     //     }
  //     // }
  //     for (let cohort in interface) {
  //       for (let expr in interface[cohort]) {
  //         promises.push(
  //           new Promise((resolve, reject) =>
  //             resolve({
  //               cohort: 'ACC',
  //               mutation_label: 'Missense',
  //               patient_barcode: 'TCGA-asdf',
  //             })
  //           )
  //           //   firebrowse
  //           // .fetchmRNASeq({
  //           //   cohorts: [cohort],
  //           //   genes: [expr],
  //           //   barcodes: interface[cohort][expr],
  //           // })
  //           // .then((res) => {
  //           //   console.log(res)
  //           //   return res.map((obj) => {
  //           //     // Store the entire obj into the interface
  //           //     this.add(obj.cohort, obj.tcga_participant_barcode, expr, obj)
  //           //     this.saveToDB(
  //           //       obj.cohort,
  //           //       obj.tcga_participant_barcode,
  //           //       expr,
  //           //       obj
  //           //     )
  //           //     return obj
  //           //   })
  //           // })
  //           // .catch((error) => {
  //           //   console.error('Failed, skipping.', error)
  //           //   return undefined
  //           // })
  //         )
  //       }
  //     }
  //     return promises
  //   }

  this.executeQueriesGE = function (interface) {
    let promises = []
    for (let cohort in interface) {
      for (let expr in interface[cohort]) {
        promises.push(
          firebrowse
            .fetchmRNASeq({
              cohorts: [cohort],
              genes: [expr],
              barcodes: interface[cohort][expr],
            })
            .then((res) => {
              console.log(res)
              return res.map((obj) => {
                // Store the entire obj into the interface
                this.add(obj.cohort, obj.tcga_participant_barcode, expr, obj)
                this.saveToDB(
                  obj.cohort,
                  obj.tcga_participant_barcode,
                  expr,
                  obj
                )
                return obj
              })
            })
            .catch((error) => {
              console.error('Failed, skipping.', error)
              return undefined
            })
        )
      }
    }
    return promises
  }

  this.fetchWrapperGE = async function (
    listOfCohorts,
    listOfExpressions,
    listOfBarcodes
  ) {
    let [missingInterface, hasInterface] = this.constructQueries(
      listOfCohorts,
      listOfExpressions,
      listOfBarcodes
    )
    let promises = this.executeQueriesGE(missingInterface)
    // console.log(hasInterface)
    // RETURNS A 2-D ARRAY of size COHORT.len * GENE.len, each index contains an array for that combo
    return (
      await Promise.all(promises).then((allData) => {
        this.db.saveDatabase((err) => {
          if (err) {
            console.error(err)
          } else {
            console.log('Saved to.', nameOfDb)
          }
        })
        let tmp = []
        // OPT 1: Fetches from DB.
        // for (let cohort in hasInterface) {
        //     let foundCohortCollection = this.db.getCollection(cohort)
        //     let dynamicView = foundCohortCollection.addDynamicView('findExistingGenes')
        //     let existingGenes = Object.keys(hasInterface[cohort])
        //     // doc._id is the GENE_EXPR
        //     dynamicView.applyWhere(function (doc) { return existingGenes.includes(doc._id) })
        //     // REAL data is dv.data().map(data => data.barcodes)
        //     tmp.push(dynamicView.data().map(data => Object.values(data.barcodes)))
        // }
        // OPT 2: Fetches from interface.
        for (let cohort in hasInterface) {
          let interfaceData = this.interface.get(cohort) // Map([])
          for (let gene of Object.keys(hasInterface[cohort])) {
            hasListOfBarcodes = hasInterface[cohort][gene]
            for (let barCode of hasListOfBarcodes) {
              tmp.push(interfaceData.get(gene).get(barCode))
            }
          }
        }
        return allData.filter((lst) => lst.length !== 0).concat(...tmp)
      })
    ).flat()
  }

  // Retrieves what is found in the cache, also returns what isn't found in the cache
  this.fetchWrapperMU = async function (listOfCohorts, listOfExpressions) {
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

    let [missingInterface, hasInterface] = constructQueriesMU(
      listOfCohorts,
      listOfExpressions,
      this.interface
    )

    let tmp = []
    // It wants all the barcodes
    for (let cohort in hasInterface) {
      let interfaceData = this.interface.get(cohort) // Map([])
      for (let gene of hasInterface[cohort]) {
        let emptyTmp = []
        for (let [k, v] of interfaceData.get(gene)) {
          emptyTmp.push({ barcode: k, mutation_label: v})//, gene: gene })
        }
        tmp.push({gene:gene, cohort:cohort, mutation_data: emptyTmp})
      }
    }

    return [missingInterface, tmp.flat()]
  }

//Create interface for barcode data (data structure is indexed by cohort)
this.fetchWrapperBAR = async function(listOfCohorts) {
  /**
   * Returns two list of cohorts whose barcodes are and are not cached in database
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
 * For each missing cohort contianed in interface array, fetch the barcodes with 
 * Firebrowse and save barcodes to caching database
 */
  function executeQueriesBAR(interface) {
    let promises = []
    let expr = "TP53"
    //Harcode gene to replace expr
    for (let cohort in interface) {
  //    for (let expr in interface[cohort]) {
      promises.push(
        firebrowse
          .fetchmRNASeq({
            cohorts: [cohort],
            genes: [expr],
  //We don't know the barcodes              barcodes: interface[cohort][expr],
          })
          .then((res) => {
            return res.map((obj) => {
            // Store the entire obj into the interface
              cacheBAR.add(obj.cohort, obj.tcga_participant_barcode)
              cacheBAR.saveToDB(
                obj.cohort,
                obj.tcga_participant_barcode,
  //                  expr,
                obj
              )
              return obj
            })
          })
          .catch((error) => {
            console.error('Failed, skipping.', error)
            return undefined
          })
      )
  //      }
    }
    return promises
  }

  async function saveMissingBarcodes(promises) {
    await Promise.all(promises).then((allData) => {
      this.db.saveDatabase((err) => {
        if (err) {
          console.error(err)
        } else {
          console.log('Saved to.', nameOfDb)
        }
      })
      let tmp = []
      for (let cohort in hasInterface) {
        let interfaceData = this.interface.get(cohort) // Map([])
        for (let gene of Object.keys(hasInterface[cohort])) {
          hasListOfBarcodes = hasInterface[cohort][gene]
          for (let barCode of hasListOfBarcodes) {
            tmp.push(interfaceData.get(gene).get(barCode))
          }
        }
      }
      return allData.filter((lst) => lst.length !== 0).concat(...tmp)
    })
  }

  let [missingInterface, hasInterface] = constructQueriesBAR(
    listOfCohorts,
    this.interface
  )
  let tmp = []
  // It wants all the barcodes
  for (let cohort in hasInterface) {
    let cachedBarcodes = await this.interface.get(cohort)
    let emptyTmp = []
    for (let k of cachedBarcodes) {
      emptyTmp.push(k)
    }
    tmp.push({cohort:cohort, barcodes: emptyTmp})
  }



  //
  executeQueriesBAR(missingInterface);

  //Append missing data that was just queried to tmp
  for(let cohort in missingInterface) {
    let newBarcodes = await this.interface.get(cohort)
    let emptyTmp = []
    for (let k of newBarcodes) {
      emptyTmp.push(k)
    }
    tmp.push({cohort:cohort, barcodes: emptyTmp})
  }

  //DEBUG
  //What promises are returned
  //Will this save the missingInterface cohorts by default?
  //let results = await promises;
  console.log("cacheBAR object:")
  console.log(cacheBAR);
  //DEBUG

  //Retrieve all data of interest from cache
  

  //Return missingInterface obj and the data pushed to tmp
  return tmp.flat();
  //return [missingInterface, tmp.flat()]
}

/**
 * For each missing cohort contianed in interface array, fetch the barcodes with 
 * Firebrowse and save barcodes to caching database
 */
/*
this.executeQueriesBAR(interface) = function() {
  let promises = []
  let expr = "TP53"
  //Harcode gene to replace expr
  for (let cohort in interface) {
//    for (let expr in interface[cohort]) {
    promises.push(
      firebrowse
        .fetchmRNASeq({
          cohorts: [cohort],
          genes: [expr],
//We don't know the barcodes              barcodes: interface[cohort][expr],
        })
        .then((res) => {
          return res.map((obj) => {
          // Store the entire obj into the interface
            //this.add(obj.cohort, obj.tcga_participant_barcode, expr, obj)
            this.add(obj.cohort, obj.tcga_participant_barcode, obj)
            this.saveToDB(
              obj.cohort,
              obj.tcga_participant_barcode,
//                  expr,
              obj
            )
            return obj
          })
        })
        .catch((error) => {
          console.error('Failed, skipping.', error)
          return undefined
        })
    )
//      }
  }
  return promises
}
*/

  // Manually save it to interface/db, call in computeGeneMutationAndFreq
this.saveToDBAndSaveToInterface = async function (sanitizedData) {
  if (nameOfDb === 'smart-cache-ge.db') {
    this.fetchWrapper = this.fetchWrapperGE
  } else if (nameOfDb === 'smart-cache-mu.db') {
    this.fetchWrapper = this.fetchWrapperMU
    //Call saveToDB() for mutation data
    const { gene, mutation_data } = sanitizedData
    for (let data of mutation_data) {
      this.add(data.cohort, data.patient_barcode, gene, data.mutation_label)
      this.saveToDB(data.cohort, data.patient_barcode, gene, data.mutation_label)
    }
  }
  else if (nameOfDb === 'smart-cache-bar.db') {
    this.fetchWrapper = this.fetchWrapperBAR
    const {cohorts, barcodesArr} = sanitizedData
    for(let i = 0; i < cohorts.length; i++) {
      this.add(cohorts[i], barcodesArr[i]);
      this.saveToDB(cohorts[i], barcodesArr[i]);
    }
  }
  return this.db.saveDatabase((err) => {
    if (err) {
      throw err
    } else {
      console.log('Saved to.', nameOfDb)
    }
  })
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