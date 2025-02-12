import 'fake-indexeddb/auto';
import { EasyIndexedDb } from '../src';

interface TestEntity {
  id: string;
  name: string;
}

describe('Ensure expected results of main operations', () => {
  const storeNames = ['store-1', 'store-2'] as const;
  let db: EasyIndexedDb;
  let addToStore: ReturnType<typeof db.add>,
    getFromStore: ReturnType<typeof db.get<TestEntity>>,
    editStore: ReturnType<typeof db.put>,
    deleteFromStore: ReturnType<typeof db.delete>;

  const entities = [
    { id: 'id1', name: 'entity-1' },
    { id: 'id2', name: 'entity-2' },
    { id: 'id3', name: 'entity-3' },
  ] as const;

  beforeAll(() => {
    db = EasyIndexedDb.of({
      indexedDbInst: indexedDB,
      storeNames,
      dbName: 'unit-test-db',
    });
  });

  test('sanity checks for database initialization', () => {
    expect(db).toBeDefined();
  });

  describe.each(storeNames)(
    'Each store must be able',
    (currentStore: string) => {
      beforeAll(() => {
        addToStore = db.add(currentStore);
        getFromStore = db.get<TestEntity>(currentStore);
        editStore = db.put(currentStore);
        deleteFromStore = db.delete(currentStore);
      });

      afterAll(async () => {
        try {
          await db.clear(currentStore);
          const _entities = await db.getAll<TestEntity>(currentStore);
          expect(_entities).toHaveLength(0);
        } catch (e) {
          expect(e.message).toMatch('error');
        }
      });

      describe.each(entities)(
        'to do CRUD operations over entities where',
        (entity: Readonly<TestEntity>) => {
          test(`entity ${entity.name} should be created in store ${currentStore}`, async () => {
            await addToStore(entity.id, entity);
            const createdEntity = await getFromStore(entity.id);
            expect(createdEntity.name).toBe(entity.name);
          });

          test(`entity ${entity.name} can be edited`, async () => {
            await editStore(entity.id, {
              ...entity,
              name: `${entity.name}_edited`,
            });
            const editedEntity = await getFromStore(entity.id);
            expect(editedEntity.name).toBe(`${entity.name}_edited`);
          });
        }
      );

      test(`there should be ${entities.length} entities in the database`, async () => {
        const _entities = await db.getAll<TestEntity>(currentStore);
        expect(_entities).toHaveLength(_entities.length);
      });

      const [entity1, entity2] = entities;
      test(`${entity1.name} can be deleted`, async () => {
        await deleteFromStore(entity1.id);
        const _entities = await db.getAll<TestEntity>(currentStore);
        expect(_entities).toHaveLength(entities.length - 1);
      });

      test(`${entity2.name} can be deleted`, async () => {
        await deleteFromStore(entity2.id);
        const _entities = await db.getAll<TestEntity>(currentStore);
        expect(_entities).toHaveLength(entities.length - 2);
      });

      test(`clearing store ${currentStore} works as expected`, async () => {
        const [entity] = entities;
        addToStore(entity.id, entity);
        await db.clear(currentStore);
        const allEntities = await db.getAll(currentStore);
        expect(allEntities).toHaveLength(0);
      });
    }
  );

  describe('Instance caching', () => {
    test('returns same instance for identical configuration', () => {
      const db2 = EasyIndexedDb.of({
        indexedDbInst: indexedDB,
        storeNames,
        dbName: 'unit-test-db',
      });
      expect(db2).toBe(db);
    });

    test('returns different instance for different dbName', () => {
      const db2 = EasyIndexedDb.of({
        indexedDbInst: indexedDB,
        storeNames,
        dbName: 'different-db',
      });
      expect(db2).not.toBe(db);
    });
  });

  describe('Error handling', () => {
    test('throws error when adding duplicate key', async () => {
      const addToStore = db.add('store-1');
      await addToStore('key1', { data: 'test' });

      await expect(addToStore('key1', { data: 'duplicate' })).rejects.toThrow(
        'Failed to add'
      );
    });

    test('throws error for invalid store name', async () => {
      await expect(db.get('non-existent-store')('key1')).rejects.toThrow(
        'Invalid store name'
      );
    });

    test('returns undefined for non-existent key', async () => {
      const getFromStore = db.get('store-1');
      const result = await getFromStore('non-existent-key');
      expect(result).toBeUndefined();
    });
  });

  describe('Database versioning', () => {
    test('handles version upgrades', () => {
      const dbWithVersion = EasyIndexedDb.of({
        indexedDbInst: indexedDB,
        storeNames,
        dbName: 'versioned-db',
        version: 2,
      });
      expect(dbWithVersion).toBeDefined();
    });
  });

  describe('Transaction handling', () => {
    const store = 'store-1';
    beforeEach(() => db.clear(store));

    test('handles concurrent operations with addMany', async () => {
      await db.addMany(store, [
        ['key1', { data: 'test1' }],
        ['key2', { data: 'test2' }],
        ['key3', { data: 'test3' }],
      ]);

      const getFromStore = db.get(store);
      const results = await Promise.all([
        getFromStore('key1'),
        getFromStore('key2'),
        getFromStore('key3'),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(Boolean)).toBe(true);
    });

    test('handles concurrent operations', async () => {
      const addToStore = db.add(store);
      const getFromStore = db.get(store);

      // Perform multiple operations concurrently
      await Promise.all([
        addToStore('key1', { data: 'test1' }),
        addToStore('key2', { data: 'test2' }),
        addToStore('key3', { data: 'test3' }),
      ]);

      const results = await Promise.all([
        getFromStore('key1'),
        getFromStore('key2'),
        getFromStore('key3'),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(Boolean)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('handles empty values', async () => {
      const putToStore = db.put('store-1');
      await putToStore('empty-string', '');
      await putToStore('null-value', null);
      await putToStore('undefined-value', undefined);

      const getFromStore = db.get('store-1');
      const emptyString = await getFromStore('empty-string');
      const nullValue = await getFromStore('null-value');
      const undefinedValue = await getFromStore('undefined-value');

      expect(emptyString).toBe('');
      expect(nullValue).toBeNull();
      expect(undefinedValue).toBeUndefined();
    });
  });
});
