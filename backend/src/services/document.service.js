const path = require('node:path');
const documentRepository = require('../repositories/document.repository');

function createDocument(file) {
  const originalName = path.basename(path.win32.basename(file.originalname)) || 'document';

  return documentRepository.create({
    id: file.filename,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: null,
    storageName: file.filename,
  });
}

function listDocuments() {
  return documentRepository.findAll();
}

function findDocument(id) {
  return documentRepository.findById(id);
}

function getDocumentPath(document) {
  return documentRepository.getFilePath(document);
}

function removeStoredFile(storageName) {
  return documentRepository.removeStoredFile(storageName);
}

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

module.exports = {
  createDocument,
  listDocuments,
  findDocument,
  getDocumentPath,
  removeStoredFile,
  toPublicDocument,
};