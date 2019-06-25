import 'fake-indexeddb/auto';
import {EasyIndexedDb} from '../src';

type TestEntity = {id: string, name: string};

describe('testing creation of entities', () => {
    let db: EasyIndexedDb;
    let addToStore2, editStore2, getFromStore2;
    const STORE_NAME = 'store-2';

    beforeAll(() => {
        db = EasyIndexedDb.of({
            indexedDbInst: window.indexedDB,
            storeNames: [STORE_NAME],
            dbName: 'database-name'
        });

        addToStore2 = db.add<TestEntity>(STORE_NAME);
        editStore2 = db.put<TestEntity>(STORE_NAME);
        getFromStore2 = db.get<TestEntity>(STORE_NAME);
    });

    beforeAll(async (done) => {
        try{
            await addToStore2('id1', {id: 'id1', name: 'entity 1'});
            await addToStore2('id2', {id: 'id2', name: 'entity 2'});
            done();
        }
        catch (e) {
            expect(e.message).toMatch('error');
            done();
        }
    });

    afterAll(async (done) => {
        try {
            await db.clear(STORE_NAME);
            done()
        }
        catch (e) {
            expect(e.message).toMatch('error');
            done();
        }
    });

    test('entity #2 should be edited', async () => {
        await editStore2('id2', {id: 'id2', name: 'entity 2 edited'});
        const editedEntity: TestEntity = await getFromStore2('id2');

        expect(editedEntity.name).toEqual('entity 2 edited');
    });
});
