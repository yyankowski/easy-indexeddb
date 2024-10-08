# easy-indexeddb

This lightweight library offers a hassle-free way to work with indexedDB API without any dependencies. It provides a simple and intuitive promise-based interface for storing and retrieving data, as well as a key-value based storage mechanism for easy data management. With this library, developers can efficiently access and manipulate data in indexedDB, without having to deal with the complexities of the underlying API.

## Example

**Install**

Using **npm**
```console
npm install --save git+https://github.com/yyankowski/easy-indexeddb.git#v1.0.2
```

Using **yarn**

```console
yarn add git+https://github.com/yyankowski/easy-indexeddb.git#v1.0.2
```

Using **pnpm**

```console
pnpm add git+https://github.com/yyankowski/easy-indexeddb.git#v1.0.2
```

**Import the library**

```typescript
import { EasyIndexedDb } from 'easy-indexeddb/src';
```

**Instantiate**

```typescript
const db = EasyIndexedDb.of({
  indexedDbInst: window.indexedDB,
  storeNames: ['store-1', 'store-2', 'store-3'],
  dbName: 'database-name',
});
```

_The **storeNames** argument is an array containing store names to be created, and **dbName** is the name of the database to be created.._

**Get operations**

```typescript
const myCachedEntities: Promise<readonly MyEntity[]> = db.getAll<MyEntity>('store-1');
const singleEntity: Promise<MyEntity> = db.get<MyEntity>('store-1')('some-unique-id');
```

**Set operations**

```typescript
const result: Promise<void> = db.put('store-1')(entity.id, entity);

// adding multiple entities
const addToStore2 = db.add('store-2');
db.clear('store-2').then(() =>
  Promise.all(entitiesList.map((entity) => addToStore2(entity.id, entity)))
);
```
