import './styles.scss';
import {EasyIndexedDb} from '../src';
import {DB_NAME, IEntity, setUpdatedAttribute, STORE_NAME} from './common';

const db = EasyIndexedDb.of({
    indexedDbInst: window.indexedDB,
    dbName: DB_NAME,
    storeNames: [STORE_NAME]
});

/**
 * The element first adds 2 entities into the indexedDB and then reads them back.
 */
class DisplayAll extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add('display-all');
        this.addEventListener('click', DisplayAll.onClick);
    }

    static get observedAttributes() {
        return ['data-updated'];
    }

    static onClick(e: Event) {
        const targetElm = e.target as HTMLElement;
        if(targetElm.tagName !== 'BUTTON'){
            return;
        }

        db.delete(STORE_NAME)((targetElm as HTMLButtonElement).value)
            .then(setUpdatedAttribute);
    }

    /**
     * Add two entities to the indexedDB
     * @returns {Promise<[void]>}
     */
    private displayEntities = (entities: ReadonlyArray<IEntity>) => {
        this.innerHTML = '';
        const frag = document.createDocumentFragment();

        for (const entity of entities) {
            const label = document.createElement('span');
            const button = document.createElement('button');
            button.style.marginLeft = '5px';

            label.textContent = `${entity.name}`;
            button.textContent = ' Delete ';
            button.value = entity.id;
            frag.appendChild(label);
            frag.appendChild(button);
        }

        this.appendChild(frag);
    };


    attributeChangedCallback() {
        // retrieve and display the two entities
        db.getAll<IEntity>(STORE_NAME).then(this.displayEntities);
    }

    connectedCallback() {
        db.getAll<IEntity>(STORE_NAME).then(this.displayEntities);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.click);
    }
}

customElements.define('display-all', DisplayAll, {extends: 'div'});