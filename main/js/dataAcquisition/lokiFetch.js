cache = {
    db: undefined,
    createDb: function (name = 'api-cache.db') {
        if (typeof loki !== 'undefined') {
            this.db = new loki(name, {
                adapter: new LokiIndexedAdapter(),
            })
        } else {
            console.error('Loki library is not loaded in properly.')
        }
    },
    addCollection: function (collection, options = {}) {
        if (this.db) {
            let c = this.db.getCollection(collection)
            if (!c) {
                this.db.addCollection(collection, options)
            } else {
                console.warn('Collection already exists.')
            }
        }
    },
    databaseInitialize: function () {
        if (this.db) {
            this.addCollection('queries')
            this.addCollection('rnaSeq', { unique: '_id' })
        } else {
            throw 'Loki library is not loaded in properly.'
        }
    },
    set: async function (collection, key = 'expressionData', data) {
        let users = this.db.getCollection(collection)
        let res = await users.findOne({ _id: key })
        if (res) {
            users.update({
                ...res,
                [key]: typeof data === 'string' ? JSON.parse(data) : data
            })
        } else {
            users.insert({
                _id: key,
                [key]: typeof data === 'string' ? JSON.parse(data) : data
            })
        }
        this.db.saveDatabase((err) => {
            if (err) {
                console.error(err)
            } else {
                console.log('Saved.')
            }
        })
    },
    get: async function (collection, key = 'expressionData') {
        let users = this.db.getCollection(collection)
        if (!users) {
            console.error('Specified collection is not found.')
            return null
        }
        let res = await users.findOne({ key })
        return typeof res === 'string' ? JSON.parse(res) : res
    },
    init: function () {
        this.createDb()
        if (this.db) {
            this.db.loadDatabase({}, () => {
                try {
                    this.databaseInitialize()
                } catch (_) {
                    console.error(_)
                }
            })
        } else {
            console.error('Loki library is not loaded in properly.')
        }
    }
}

cache.init()


// lokiFetch = async (url) => {
//     if (db) {
//         let queries = db.getCollection('queries')
//         if (queries) {
//             let apiCall = await queries.findOne({
//                 url
//             })
//             if (apiCall && !(Math.floor(new Date().getTime() / 1000.0) - apiCall.dt >= 1209600)) {
//                 return apiCall.data
//             } else {
//                 return lokiRefetch(url)
//             }
//         }
//     } else {
//         console.warn('Loki library is not loaded in properly, no caching available.')
//         try {
//             let response = await fetch(url)
//             if (response.ok)
//                 return await response.json()
//             else if (fetchedClinicalData.status === 404) {
//                 return Promise.reject({})
//             } else {
//                 throw new Error('Failed to fetch.')
//             }
//         } catch (e) {
//             console.error(e)
//             return Promise.reject({})
//         }
//     }
// }

// lokiRefetch = async (url) => {
//     let queries = db.getCollection("queries")
//     try {
//         let result = await fetch(url)
//         if (result.ok) {
//             let json = await result.json()
//             queries.insert({
//                 url,
//                 data: json,
//                 dt: Math.floor(new Date().getTime() / 1000.0)
//             })
//             db.saveDatabase((err) => {
//                 if (err) {
//                     console.error(err)
//                 }
//             })
//             return json
//         } else if (result.status === 404) {
//             return Promise.reject({}) // obtain result via await
//         } else {
//             throw new Error('Failed to fetch.')
//         }
//     } catch (e) {
//         console.error(e)
//         return Promise.reject({})
//     }
// }

// lokiTest = () => {
//     let queries = db.getCollection("queries")
//     let queriesCount = queries.count()

//     queries.insert({ url: 'localhost', data: [{ asdf: 'asdf' }], dt: Math.floor(new Date().getTime() / 1000.0) })
//     queriesCount = queries.count()

//     console.log("old number of entries in database : " + queriesCount)
//     db.saveDatabase((err) => {
//         if (err) {
//             console.error(err)
//         } else {
//             console.log('Saved')
//         }
//     })
// }

