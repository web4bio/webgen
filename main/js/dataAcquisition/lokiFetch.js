createDb = (name = 'api-cache.db') => {
    if (loki !== 'undefined') {
        return new loki(name, {
            adapter: new LokiIndexedAdapter(),
        })
    } else {
        console.error('Loki library is not loaded in properly.')
        return null
    }
}

databaseInitialize = () => {
    if (db) {
        let queries = db.getCollection('queries')
        if (!queries) {
            db.addCollection('queries')
        }
        let pathways = db.getCollection('pathways')
        if (!pathways) {
            db.addCollection('pathways', { unique: '_id' })
        }
    } else {
        throw 'Loki library is not loaded in properly.'
    }
}

lokiFetch = async (url) => {
    if (db) {
        let queries = db.getCollection('queries')
        if (queries) {
            let apiCall = await queries.findOne({
                url
            })
            if (apiCall && !(Math.floor(new Date().getTime() / 1000.0) - apiCall.dt >= 1209600)) {
                return apiCall.data
            } else {
                return lokiRefetch(url)
            }
        }
    } else {
        console.warn('Loki library is not loaded in properly, no caching available.')
        try {
            let response = await fetch(url)
            if (response.ok)
                return await response.json()
            else if (fetchedClinicalData.status === 404) {
                return Promise.reject({})
            } else {
                throw new Error('Failed to fetch.')
            }
        } catch (e) {
            console.error(e)
            return Promise.reject({})
        }
    }
}

lokiRefetch = async (url) => {
    let queries = db.getCollection("queries")
    try {
        let result = await fetch(url)
        if (result.ok) {
            let json = await result.json()
            queries.insert({
                url,
                data: json,
                dt: Math.floor(new Date().getTime() / 1000.0)
            })
            db.saveDatabase((err) => {
                if (err) {
                    console.error(err)
                }
            })
            return json
        } else if (result.status === 404) {
            return Promise.reject({}) // obtain result via await
        } else {
            throw new Error('Failed to fetch.')
        }
    } catch (e) {
        console.error(e)
        return Promise.reject({})
    }
}

lokiTest = () => {
    let queries = db.getCollection("queries")
    let queriesCount = queries.count()

    queries.insert({ url: 'localhost', data: [{ asdf: 'asdf' }], dt: Math.floor(new Date().getTime() / 1000.0) })
    queriesCount = queries.count()

    console.log("old number of entries in database : " + queriesCount)
    db.saveDatabase((err) => {
        if (err) {
            console.error(err)
        } else {
            console.log('Saved')
        }
    })
}

lokiSet = async (key = 'expressionData', data) => {
    let users = db.getCollection('pathways')
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
    db.saveDatabase((err) => {
        if (err) {
            console.error(err)
        } else {
            console.log('Saved.')
        }
    })
}

lokiGet = async (key = 'expressionData') => {
    let users = db.getCollection('pathways')
    let res = await users.findOne({ key })
    return typeof res === 'string' ? JSON.parse(res) : res
}

db = createDb()

if (db) {
    db.loadDatabase({}, () => {
        try {
            databaseInitialize()
        } catch (_) {
            console.error(_)
        }
    })
} else {
    console.error('Loki library is not loaded in properly.')
}

