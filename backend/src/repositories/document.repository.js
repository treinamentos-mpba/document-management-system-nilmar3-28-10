const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');
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

function removeStoredFile(storageName) {
  return fs.unlink(path.join(storageDirectory, storageName));
}

module.exports = { create, findAll, findById, getFilePath, removeStoredFile };