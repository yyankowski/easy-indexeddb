import uuid = require('uuid');

export const STORE_NAME = 'example-store';
export const DB_NAME = 'example-db';

export interface IEntity {
    id: string;
    name: string;
}

const getDisplayAllElm = () => document.getElementById('display-all-list');

export const setUpdatedAttribute = () => {
    const allList = getDisplayAllElm();
    allList.dataset.updated = uuid();
};

export const showQuery = (query: string) => {
    const display = document.querySelector('.query-tableau');
    display.innerHTML = query;
};
