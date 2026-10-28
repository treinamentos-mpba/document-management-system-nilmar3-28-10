import { downloadDocument } from '../services/documents.js';

export default function DownloadButton({ document, onError }) {
  async function handleDownload() {
    try {
      await downloadDocument(document.id, document.originalName);
    } catch (error) {
      onError(error.message);
    }
  }

  return (
    <button className="download-button" type="button" onClick={handleDownload}>
      Baixar <span aria-hidden="true">↓</span>
    </button>
  );
}