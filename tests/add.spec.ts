import 'fake-indexeddb/auto';
import {EasyIndexedDb} from '../src';

type TestEntity = {id: string, name: string};

describe('testing creation of entities', () => {
    let db: EasyIndexedDb;
    let addToStore1, getFromStore1;

    beforeAll(() => {
        db = EasyIndexedDb.of({
            indexedDbInst: window.indexedDB,
            storeNames: ['store-1'],
            dbName: 'database-name'
        });

        addToStore1 = db.add('store-1');
        getFromStore1 = db.get<TestEntity>('store-1');
    });

    afterAll(async (done) => {
        try {
            await db.clear('store-1');
            done();
        }
        catch (e) {
            expect(e.message).toMatch('error');
            done();
        }
    });

    test('sanity checks for database initialization', () => {
        expect(db).toBeDefined();
    });

    test('entity #1 should be created', async () => {
        await addToStore1('id1', {name: 'entity 1'});
        const createdEntity: TestEntity = await getFromStore1('id1');

        expect(createdEntity.name).toBe('entity 1');
    });

    test('entity #2 should be created', async () => {
        await addToStore1('id2', {name: 'entity 2'});
        const createdEntity: TestEntity = await getFromStore1('id2');
        expect(createdEntity.name).toBe('entity 2');
    });

    test('there should be 2 entities in the database', async () => {
        const entities = await db.getAll<TestEntity>('store-1');
        expect(entities).toHaveLength(2);
    });
});
