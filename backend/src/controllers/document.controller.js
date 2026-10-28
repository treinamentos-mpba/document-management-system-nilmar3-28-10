const documentService = require('../services/document.service');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

async function upload(req, res) {
  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  try {
    const document = documentService.createDocument(req.file);
    return res.status(201).json(documentService.toPublicDocument(document));
  } catch {
    await documentService.removeStoredFile(req.file.filename).catch(() => {});
    return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível armazenar o documento.');
  }
}

function list(_req, res) {
  try {
    const documents = documentService.listDocuments();
    return res.json({
      documents: documents.map(documentService.toPublicDocument),
    });
  } catch {
    return sendError(res, 500, 'DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.');
  }
}

function download(req, res) {
  try {
    const document = documentService.findDocument(req.params.id);
    if (!document) {
      return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    const filePath = documentService.getDocumentPath(document);
    return res.download(
      filePath,
      document.originalName,
      { headers: { 'Content-Type': 'application/octet-stream' } },
      (error) => {
        if (!error) return;
        if (res.headersSent) return res.destroy(error);

        const notFound = error.code === 'ENOENT';
        return sendError(
          res,
          notFound ? 404 : 500,
          notFound ? 'DOCUMENT_NOT_FOUND' : 'DOWNLOAD_FAILED',
          notFound ? 'Documento não encontrado.' : 'Não foi possível baixar o documento.'
        );
      }
    );
  } catch (error) {
    return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }
}

module.exports = { upload, list, download };