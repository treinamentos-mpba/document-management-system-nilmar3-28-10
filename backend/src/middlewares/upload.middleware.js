const crypto = require('node:crypto');
const multer = require('multer');
const { storageDirectory } = require('../config/storage');

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, storageDirectory),
  filename: (_req, _file, callback) => callback(null, crypto.randomUUID()),
});

const uploadFile = multer({ storage }).single('file');

function handleUpload(req, res, next) {
  uploadFile(req, res, (error) => {
    if (!error) return next();

    const isStorageError = typeof error.code === 'string' && error.code.startsWith('E');
    return res.status(isStorageError ? 500 : 400).json({
      error: {
        code: isStorageError ? 'UPLOAD_FAILED' : 'INVALID_UPLOAD',
        message: isStorageError
          ? 'Não foi possível armazenar o documento.'
          : 'Não foi possível processar o arquivo enviado.',
      },
    });
  });
}

module.exports = handleUpload;