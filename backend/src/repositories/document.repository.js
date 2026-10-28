const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function create(document) {
  documents.set(document.id, document);
  return document;
}

function findAll() {
  return [...documents.values()].sort(
    (first, second) => Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt)
  );
}

function findById(id) {
  return documents.get(id) || null;
}

function getFilePath(document) {
  return path.join(storageDirectory, document.storageName);
}

module.exports = { create, findAll, findById, getFilePath, storageDirectory };