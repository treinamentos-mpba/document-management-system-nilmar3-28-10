const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');
const { storageDirectory } = require('../src/config/storage');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('a API envia, lista e baixa documentos', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedId;

  try {
    const missingFile = await fetch(`${baseUrl}/upload`, { method: 'POST' });
    assert.strictEqual(missingFile.status, 400);
    assert.strictEqual((await missingFile.json()).error.code, 'FILE_REQUIRED');

    const invalidFormData = new FormData();
    invalidFormData.append('attachment', new Blob(['arquivo']), 'arquivo.txt');
    const invalidUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: invalidFormData,
    });
    assert.strictEqual(invalidUpload.status, 400);
    assert.strictEqual((await invalidUpload.json()).error.code, 'INVALID_UPLOAD');

    const formData = new FormData();
    formData.append('file', new Blob(['conteudo de teste']), 'relatorio.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: formData });
    assert.strictEqual(uploadResponse.status, 201);

    const uploadedDocument = await uploadResponse.json();
    uploadedId = uploadedDocument.id;
    assert.deepStrictEqual(Object.keys(uploadedDocument).sort(), [
      'id', 'originalName', 'owner', 'size', 'uploadedAt',
    ]);
    assert.strictEqual(uploadedDocument.originalName, 'relatorio.txt');
    assert.strictEqual(uploadedDocument.owner, null);
    assert.strictEqual(uploadedDocument.size, Buffer.byteLength('conteudo de teste'));

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(listResponse.status, 200);
    assert.deepStrictEqual((await listResponse.json()).documents, [uploadedDocument]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
    assert.strictEqual(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');

    await fs.rm(path.join(storageDirectory, uploadedId));
    const missingStoredFile = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
    assert.strictEqual(missingStoredFile.status, 404);
    assert.strictEqual((await missingStoredFile.json()).error.code, 'DOCUMENT_NOT_FOUND');

    const unknownDocument = await fetch(`${baseUrl}/documents/not-found/download`);
    assert.strictEqual(unknownDocument.status, 404);
    assert.strictEqual((await unknownDocument.json()).error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    if (uploadedId) {
      await fs.rm(path.join(storageDirectory, uploadedId), { force: true });
    }
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
