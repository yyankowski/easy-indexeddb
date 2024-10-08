import 'fake-indexeddb/auto';
import { EasyIndexedDb } from '../src';

interface TestEntity {
  id: string;
  name: string;
}
const storeNames = ['store-1', 'store-2'] as const;

describe('Ensure expected results of main operations', () => {
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
});
