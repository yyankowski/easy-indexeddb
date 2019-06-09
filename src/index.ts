type DBMixin = { target: { result: IDBDatabase } };
type InitData = {indexedDbInst: IDBFactory, storeNames: ReadonlyArray<string>, dbName: string};

export class EasyIndexedDb {
    private readonly db: Promise<IDBDatabase>;
    private static instanceCache: {[key: string]: EasyIndexedDb} = {};

    private constructor(indexedDbInst: IDBFactory, storeNames: ReadonlyArray<string>, dbName: string) {
        if(!indexedDbInst){
            throw new Error('No indexedDb instance available. Check your browser support.');
        }

        const openRequest = indexedDbInst.open(dbName, 1);

        this.db = new Promise<IDBDatabase>((resolve, reject) => {
            openRequest.onsuccess = (e: Event & DBMixin) => {
                resolve(e.target.result);
            };

            openRequest.onerror = (e) => {
                reject(new Error(`Failed accessing the IndexedDb database: ${e}`));
            };
        });

        openRequest.onupgradeneeded = (e: IDBVersionChangeEvent & DBMixin) => {
            const thisDB = e.target.result;

            // create all required stores
            storeNames.forEach(storeName => {
                !thisDB.objectStoreNames.contains(storeName) &&
                thisDB.createObjectStore(storeName);
            });
        };
    }

    /**
     * Returns the cached instance if available. Otherwise creates a new one and caches it.
     * @param {IDBFactory} indexedDbInst
     * @param {ReadonlyArray<string>} storeNames
     * @param {string} dbName
     * @returns {EasyIndexedDb}
     */
    static of({indexedDbInst, storeNames, dbName}: InitData): EasyIndexedDb {
        // returned the cached version if present
        const cacheKey =  `${dbName}_${storeNames.join('-')}`;
        if(!this.instanceCache.hasOwnProperty(cacheKey)){
            this.instanceCache[cacheKey] = new EasyIndexedDb(indexedDbInst, storeNames, dbName);
        }

        return this.instanceCache[cacheKey];
    }

    private getStoreFromDb = (storeName: string, db: IDBDatabase): IDBObjectStore => {
        const transaction = db.transaction([storeName],'readwrite');
        return transaction.objectStore(storeName);
    };

    private getRequestPromise = <T>({req, actionType, storeName}: {req: IDBRequest, actionType: string, storeName: string}): Promise<T> => {
        return new Promise<T>((resolve, reject)=> {
            req.onsuccess = (e: Event & {target: {result:T}}) => resolve(e.target.result);
            req.onerror = (e: Event) =>
                reject(new Error(`Failed to ${actionType} to ${storeName}: ${e}`));
        });
    };

    /**
     * Adds a value to the store.
     * @param {string} storeName
     * @returns {(key: string, value: T) => Promise<void | never>}
     */
    add = <T>(storeName: string) => (key: string, value: T): Promise<void> => {
        return this.db
            .then(db => this.getStoreFromDb(storeName, db))
            .then(store => store.add(value, key))
            .then(req => this.getRequestPromise<void>({req, storeName, actionType: 'add'}));
    };

    /**
     * Removes all data from the specified store.
     * @param {string} storeName
     * @returns {Promise<void>}
     */
    clear = (storeName: string): Promise<void> => {
        return this.db
            .then(db => this.getStoreFromDb(storeName, db))
            .then(store => store.clear())
            .then(req => this.getRequestPromise<void>({req, storeName, actionType: 'clear'}));
    };

    /**
     * Deletes a record in the specified store.
     * @param {string} storeName
     * @returns {(key: string) => Promise<void | never>}
     */
    delete = (storeName: string) => (key: string): Promise<void> => {
        return this.db
            .then(db => this.getStoreFromDb(storeName, db))
            .then(store => store.delete(key))
            .then(req => this.getRequestPromise<void>({req, storeName, actionType: 'delete'}));
    };

    /**
     * Retrieves a value specified by its unique ID
     * @param {string} storeName
     * @returns {(key: string) => Promise<T>}
     */
    get = <T>(storeName: string) => (key: string): Promise<T> => {
        return this.db
            .then(db => this.getStoreFromDb(storeName, db))
            .then(store => store.get(key))
            .then(req => this.getRequestPromise<T>({req, storeName, actionType: 'get'}));
    };

    /**
     * Updates a record in the specified store.
     * @param {string} storeName
     * @returns {(key: string, value: T) => Promise<void | never>}
     */
    put = <T>(storeName: string) => (key: string, value: T): Promise<void> => {
        return this.db
            .then(db => this.getStoreFromDb(storeName, db))
            .then(store => store.put(value, key))
            .then(req => this.getRequestPromise<void>({req, storeName, actionType: 'put'}));
    };
}
