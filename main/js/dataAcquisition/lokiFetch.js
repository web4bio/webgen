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
        let res = await users.findOne({ _id: key })
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
