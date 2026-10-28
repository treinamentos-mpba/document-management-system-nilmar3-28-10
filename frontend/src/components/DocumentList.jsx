import DownloadButton from './DownloadButton.jsx';

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

export default function DocumentList({ documents, isLoading, onRefresh, onError }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-heading library-heading">
        <div>
          <p className="eyebrow">ARQUIVOS</p>
          <h2 id="documents-title">Documentos enviados <span className="document-count">{documents.length}</span></h2>
        </div>
        <button className="button button-quiet refresh-button" type="button" onClick={onRefresh} disabled={isLoading}>
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
              <DownloadButton document={document} onError={onError} />
            </article>
          ))
        )}
      </div>
    </section>
  );
}