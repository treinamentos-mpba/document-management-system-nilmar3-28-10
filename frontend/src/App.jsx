import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documents.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  async function handleUploadComplete() {
    setNotice('Documento enviado.');
    await refreshDocuments();
  }

  function handleError(message) {
    setNotice('');
    setLoadError(message);
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

        <UploadComponent onUploadComplete={handleUploadComplete} onError={handleError} />

        {(loadError || notice) && (
          <div className={`feedback${loadError ? ' feedback-error' : ' feedback-success'}`} role="status" aria-live="polite">
            {loadError || notice}
          </div>
        )}

        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onRefresh={refreshDocuments}
          onError={handleError}
        />
      </main>

      <footer className="footer">
        <span>DMS <span className="footer-dot">/</span> Documentos</span>
        <span>Os metadados são mantidos durante a execução do servidor.</span>
      </footer>
    </div>
  );
}
