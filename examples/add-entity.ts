import {EasyIndexedDb} from '../src';
import {DB_NAME, setUpdatedAttribute, showQuery, STORE_NAME} from './common';
import uuid = require('uuid');

const db = EasyIndexedDb.of({
    indexedDbInst: window.indexedDB,
    dbName: DB_NAME,
    storeNames: [STORE_NAME]
});

const onClick = () => {
    const id = uuid();
    db.add(STORE_NAME)(id, {id, name: `Entity ${id}`})
        .then(() => setUpdatedAttribute())
        .then(() => showQuery(`db.<span class="code-yellow">add</span>
                (<span class="code-red">'${STORE_NAME}'</span>) 
                (<span class="code-red">'${id}'</span>,
                {id: <span class="code-red">'${id}'</span>, name:  <span class="code-red">'Entity ${id}'</span>}`));
};

class AddEntity extends HTMLButtonElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.addEventListener('click', onClick);
    }

    disconnectedCallback() {
        this.removeEventListener('click', onClick);
    }
}

customElements.define('add-entity', AddEntity, {extends: 'button'});