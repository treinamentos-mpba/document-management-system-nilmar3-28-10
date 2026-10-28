import { useState } from 'react';
import { uploadDocument } from '../services/documents.js';

export default function UploadComponent({ onUploadComplete, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function chooseFile(file) {
    if (file) setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      await onUploadComplete();
    } catch (error) {
      onError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
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
          aria-disabled={isUploading}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!isUploading) chooseFile(event.dataTransfer.files[0]);
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
            disabled={isUploading}
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
  );
}