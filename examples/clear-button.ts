import {EasyIndexedDb} from '../src';
import {DB_NAME, setUpdatedAttribute, STORE_NAME} from './common';

const db = EasyIndexedDb.of({
    indexedDbInst: window.indexedDB,
    dbName: DB_NAME,
    storeNames: [STORE_NAME]
});

const notifyCleaned = () => console.log('Store cleaned');

class ClearButton extends HTMLButtonElement {
    constructor() {
        super();
    }

    private static clear() {
        return db.clear(STORE_NAME);
    }

    static onClick(){
        ClearButton.clear().then(setUpdatedAttribute).then(notifyCleaned);
    }

    connectedCallback() {
        this.addEventListener('click', ClearButton.onClick);
    }

    disconnectedCallback() {
        this.removeEventListener('click', ClearButton.onClick);
    }
}

customElements.define('clear-button', ClearButton, {extends: 'button'});