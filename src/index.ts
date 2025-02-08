interface IDBMixin {
  target: { result: IDBDatabase };
}

interface IDataInit {
  indexedDbInst: IDBFactory;
  storeNames: readonly string[];
  dbName: string;
  version: number;
}

interface IRequestParams<T> {
  request: IDBRequest<T>;
  actionType: string;
  storeName: string;
}

type TransactionMode = 'readonly' | 'readwrite';

export class EasyIndexedDb {
  private readonly db: Promise<IDBDatabase>;
  private static readonly instanceCache = new Map<string, EasyIndexedDb>();
  private readonly storeNames: readonly string[];

  private constructor(
    indexedDbInst: IDataInit['indexedDbInst'],
    storeNames: IDataInit['storeNames'],
    dbName: IDataInit['dbName'],
    version: IDataInit['version']
  ) {
    if (!indexedDbInst) {
      throw new Error(
        'No indexedDb instance available. Check your browser support.'
      );
    }

    this.storeNames = storeNames;
    const openRequest = indexedDbInst.open(dbName, version);

    this.db = new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = (e: Event & IDBMixin) => {
        const db = e.target.result;
        if (!db) {
          reject(new Error('Failed to open IndexedDB database'));
          return;
        }

        // Validate all stores exist
        const missingStores = storeNames.filter(
          (store) => !db.objectStoreNames.contains(store)
        );
        if (missingStores.length > 0) {
          reject(new Error(`Missing stores: ${missingStores.join(', ')}`));
          return;
        }

        resolve(db);
      };

      openRequest.onerror = () => {
        reject(
          new Error(`Failed to open IndexedDB: ${openRequest.error?.message}`)
        );
      };
    });

    openRequest.onupgradeneeded = (e: IDBVersionChangeEvent & IDBMixin) => {
      const db = e.target.result;
      storeNames.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };
  }

  /**
   * Returns a cached instance or creates a new one.
   * @throws {Error} If required parameters are invalid
   */
  static of({
    indexedDbInst,
    storeNames,
    dbName,
    version = 1,
  }: IDataInit): EasyIndexedDb {
    if (!dbName?.trim()) {
      throw new Error('Database name is required');
    }
    if (!storeNames?.length) {
      throw new Error('At least one store name is required');
    }

    const cacheKey = `${dbName}_${[...storeNames].sort().join('-')}`;
    const cached = this.instanceCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const instance = new EasyIndexedDb(
      indexedDbInst,
      storeNames,
      dbName,
      version
    );
    this.instanceCache.set(cacheKey, instance);
    return instance;
  }

  private async getTransaction(
    storeName: string,
    mode: TransactionMode
  ): Promise<IDBTransaction> {
    if (!this.storeNames.includes(storeName)) {
      throw new Error(`Invalid store name: ${storeName}`);
    }
    const db = await this.db;
    return db.transaction([storeName], mode);
  }

  private getStore(
    transaction: IDBTransaction,
    storeName: string
  ): IDBObjectStore {
    return transaction.objectStore(storeName);
  }

  private createRequestPromise<T>({
    request,
    actionType,
    storeName,
  }: IRequestParams<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        reject(
          new Error(
            `Failed to ${actionType} in store ${storeName}: ${request.error?.message}`
          )
        );
      };
    });
  }

  /**
   * Adds a value to the store. Fails if key already exists.
   * @throws {Error} If store name is invalid or operation fails
   */
  add<T>(storeName: string): (key: string, value: T) => Promise<void> {
    return async (key: string, value: T): Promise<void> => {
      const transaction = await this.getTransaction(storeName, 'readwrite');
      const store = this.getStore(transaction, storeName);
      await this.createRequestPromise({
        request: store.add(value, key),
        actionType: 'add',
        storeName,
      });
    };
  }

  /**
   * Removes all data from the specified store.
   * @throws {Error} If store name is invalid or operation fails
   */
  async clear(storeName: string): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite');
    const store = this.getStore(transaction, storeName);
    await this.createRequestPromise({
      request: store.clear(),
      actionType: 'clear',
      storeName,
    });
  }

  /**
   * Deletes a record from the specified store.
   * @throws {Error} If store name is invalid or operation fails
   */
  delete(storeName: string): (key: string) => Promise<void> {
    return async (key: string): Promise<void> => {
      const transaction = await this.getTransaction(storeName, 'readwrite');
      const store = this.getStore(transaction, storeName);
      await this.createRequestPromise({
        request: store.delete(key),
        actionType: 'delete',
        storeName,
      });
    };
  }

  /**
   * Retrieves a value by its unique ID.
   * @throws {Error} If store name is invalid or operation fails
   */
  get<T>(storeName: string): (key: string) => Promise<T | undefined> {
    return async (key: string): Promise<T | undefined> => {
      const transaction = await this.getTransaction(storeName, 'readonly');
      const store = this.getStore(transaction, storeName);
      return this.createRequestPromise({
        request: store.get(key),
        actionType: 'get',
        storeName,
      });
    };
  }

  /**
   * Retrieves all values from the specified store.
   * @throws {Error} If store name is invalid or operation fails
   */
  async getAll<T>(storeName: string): Promise<readonly T[]> {
    const transaction = await this.getTransaction(storeName, 'readonly');
    const store = this.getStore(transaction, storeName);

    return new Promise<readonly T[]>((resolve, reject) => {
      const results: T[] = [];
      const cursor = store.openCursor();

      cursor.onsuccess = () => {
        const currentCursor = cursor.result;
        if (currentCursor) {
          results.push(currentCursor.value);
          currentCursor.continue();
        }
      };

      cursor.onerror = (e) => {
        reject(new Error(`Cursor error: ${e}`));
      };

      transaction.oncomplete = () => resolve(results);

      transaction.onerror = () => {
        reject(
          new Error(
            `Failed to get all records from ${storeName}: ${transaction.error?.message}`
          )
        );
      };
    });
  }

  /**
   * Updates or adds a record in the specified store.
   * @throws {Error} If store name is invalid or operation fails
   */
  put<T>(storeName: string): (key: string, value: T) => Promise<void> {
    return async (key: string, value: T): Promise<void> => {
      const transaction = await this.getTransaction(storeName, 'readwrite');
      const store = this.getStore(transaction, storeName);
      await this.createRequestPromise({
        request: store.put(value, key),
        actionType: 'put',
        storeName,
      });
    };
  }
}
