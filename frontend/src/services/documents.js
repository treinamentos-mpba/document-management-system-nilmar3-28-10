async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || 'Não foi possível concluir a solicitação.');
  }
  return body;
}

export async function listDocuments() {
  const response = await fetch('/api/documents');
  const body = await readResponse(response);
  return body.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body: formData });
  return readResponse(response);
}

export async function downloadDocument(id, originalName) {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    return readResponse(response);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = originalName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}