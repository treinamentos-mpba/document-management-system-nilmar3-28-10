const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');
const { storageDirectory } = require('../repositories/document.repository');

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, storageDirectory),
  filename: (_req, _file, callback) => callback(null, crypto.randomUUID()),
});

const uploadFile = multer({ storage }).single('file');
const router = express.Router();

router.post('/upload', (req, res, next) => {
  uploadFile(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: 'Não foi possível processar o arquivo enviado.' },
      });
    }
    return next();
  });
}, documentController.upload);

router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;