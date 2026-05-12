/**
 * Conversion via route API serveur (qpdf).
 * qpdf retire le chiffrement et le XFA tout en preservant les champs AcroForm.
 */

export async function convertToCompatiblePdf(
  buffer: ArrayBuffer,
  onProgress?: (step: string) => void
): Promise<ArrayBuffer> {
  onProgress?.('Conversion du PDF…');

  const res = await fetch('/api/convert-pdf', {
    method: 'POST',
    body: buffer,
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  if (res.ok) {
    onProgress?.('PDF compatible — chargement…');
    return res.arrayBuffer();
  }

  const body = await res.json().catch(() => ({}));
  throw new Error(body.error || 'Ce PDF ne peut pas être converti.');
}
