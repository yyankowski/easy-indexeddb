# easy-indexeddb
This no-dependencies library provides an easy promise-like access to the indexedDB API as well as a simple key-value based storage and retrieval functionality.

## Example ##

**Install**
```bash
npm install --save git+https://github.com/yyankowski/easy-indexeddb.git#v1.0.0
```

**Import the library**
```typescript
import {EasyIndexedDb} from 'easy-indexeddb/src';
```

**Instantiate**
```typescript
const db = EasyIndexedDb.of({
            indexedDbInst: window.indexedDB,
            storeNames: ['store-1', 'store-2', 'store-3'],
            dbName: 'database-name'
        });
```
_The second argument is a set containing store names to be created, the third is the name of the database to be created._

**Get operations**
```typescript
const myCachedEntities: Promise<ReadonlyArray<MyEntity>> = db.getAll<MyEntity>('store-1');
const singleEntity: Promise<MyEntity> = db.get<MyEntity>('store-1')('some-unique-id');
```

**Set operations**
```typescript
const result: Promise<void> = db.put('store-1')(entity.id, entity);

// adding multiple entities
const addToStore2 = db.add('store-2');
db.clear('store-2')
      .then(() => Promise.all(entitiesList.map(entity => addToStore2(entity.id, entity))));

```
