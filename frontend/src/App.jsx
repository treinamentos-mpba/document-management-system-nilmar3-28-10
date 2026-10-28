import { useEffect, useState } from 'react';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './services/documents.js';
import './App.css';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setLoadError('');
    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setNotice('');
    setLoadError('');
    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      setNotice('Documento enviado.');
      await refreshDocuments();
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  function chooseFile(file) {
    if (file) {
      setSelectedFile(file);
      setNotice('');
      setLoadError('');
    }
  }

  async function handleDownload(document) {
    setLoadError('');
    try {
      await downloadDocument(document.id, document.originalName);
    } catch (error) {
      setLoadError(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>DMS</span>
        </a>
        <span className="topbar-context">Biblioteca local</span>
      </header>

      <main className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <p className="eyebrow">DOCUMENTOS <span>/</span> BIBLIOTECA</p>
          <div className="heading-row">
            <div>
              <h1 id="page-title">Sua biblioteca.</h1>
              <p className="page-description">Arquivos disponíveis nesta sessão.</p>
            </div>
            <span className="local-indicator"><span /> Armazenamento local</span>
          </div>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2 id="upload-title">Enviar documento</h2>
            </div>
            <span className="section-index">01</span>
          </div>

          <form onSubmit={handleUpload}>
            <label
              className={`upload-zone${isDragging ? ' is-dragging' : ''}${selectedFile ? ' has-file' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                chooseFile(event.dataTransfer.files[0]);
              }}
            >
              <span className="upload-symbol" aria-hidden="true">+</span>
              <span className="upload-copy">
                <strong>{selectedFile ? 'Arquivo selecionado' : 'Solte um arquivo aqui'}</strong>
                <span>{selectedFile ? selectedFile.name : 'ou escolha no seu dispositivo'}</span>
              </span>
              <span className="browse-action">Selecionar arquivo</span>
              <input
                key={selectedFile ? `${selectedFile.name}-${selectedFile.size}` : 'empty'}
                className="visually-hidden"
                type="file"
                onChange={(event) => chooseFile(event.target.files[0])}
              />
            </label>
            <div className="upload-controls">
              <span className="upload-note">Um arquivo por envio</span>
              <div className="button-group">
                {selectedFile && (
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    Remover
                  </button>
                )}
                <button className="button button-primary" type="submit" disabled={!selectedFile || isUploading}>
                  {isUploading ? 'Enviando...' : 'Enviar documento'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {(loadError || notice) && (
          <div className={`feedback${loadError ? ' feedback-error' : ' feedback-success'}`} role="status" aria-live="polite">
            {loadError || notice}
          </div>
        )}

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading library-heading">
            <div>
              <p className="eyebrow">ARQUIVOS</p>
              <h2 id="documents-title">Documentos enviados <span className="document-count">{documents.length}</span></h2>
            </div>
            <button className="button button-quiet refresh-button" type="button" onClick={refreshDocuments} disabled={isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="document-list" aria-live="polite">
            <div className="document-header" aria-hidden="true">
              <span>Documento</span>
              <span>Tamanho</span>
              <span>Enviado em</span>
              <span />
            </div>
            {isLoading ? (
              <p className="list-message">Carregando documentos...</p>
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">—</span>
                <p>Nenhum documento nesta sessão.</p>
              </div>
            ) : (
              documents.map((document) => (
                <article className="document-row" key={document.id}>
                  <div className="document-name">
                    <span className="file-mark" aria-hidden="true">DOC</span>
                    <span title={document.originalName}>{document.originalName}</span>
                  </div>
                  <span className="document-size">{formatSize(document.size)}</span>
                  <time className="document-date" dateTime={document.uploadedAt}>{formatDate(document.uploadedAt)}</time>
                  <button className="download-button" type="button" onClick={() => handleDownload(document)}>
                    Baixar <span aria-hidden="true">↓</span>
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>DMS <span className="footer-dot">/</span> Documentos</span>
        <span>Os metadados são mantidos durante a execução do servidor.</span>
      </footer>
    </div>
  );
}
