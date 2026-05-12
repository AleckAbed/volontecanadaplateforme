import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';
export const maxDuration = 30;

const execFileAsync = promisify(execFile);

const QPDF_CANDIDATES = [
  'C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe',
  'C:\\Program Files\\qpdf\\bin\\qpdf.exe',
  'qpdf',
];

async function getQpdfPath(): Promise<string | null> {
  for (const p of QPDF_CANDIDATES) {
    try { await execFileAsync(p, ['--version']); return p; } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  const buffer = await req.arrayBuffer();
  const bytes = Buffer.from(buffer);

  if (bytes.length === 0) {
    return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
  }

  const tmpId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath  = path.join(os.tmpdir(), `${tmpId}-input.pdf`);
  const decryptedPath = path.join(os.tmpdir(), `${tmpId}-decrypted.pdf`);

  await fs.writeFile(inputPath, bytes);

  const steps: string[] = [];

  try {
    // Étape 1 : qpdf retire le chiffrement et la protection
    const qpdf = await getQpdfPath();
    let sourceForPdfLib = inputPath;

    if (qpdf) {
      steps.push('qpdf-found');
      try {
        await execFileAsync(qpdf, ['--decrypt', '--no-warn', inputPath, decryptedPath]);
        sourceForPdfLib = decryptedPath;
        steps.push('qpdf-decrypt-ok');
      } catch (qerr: any) {
        steps.push(`qpdf-decrypt-fail:${String(qerr?.message || qerr).slice(0, 80)}`);
      }
    } else {
      steps.push('qpdf-not-found');
    }

    // Étape 2 : pdf-lib retire le XFA en gardant les champs AcroForm intacts
    const { PDFDocument, PDFName, PDFDict } = await import('pdf-lib');
    const srcBytes = await fs.readFile(sourceForPdfLib);
    steps.push(`pdflib-load-size:${srcBytes.length}`);

    const doc = await PDFDocument.load(srcBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
    steps.push('pdflib-loaded');

    // Retirer /XFA de /AcroForm — les champs AcroForm restent intacts
    let xfaRemoved = false;
    try {
      const acroFormRef = doc.catalog.get(PDFName.of('AcroForm'));
      if (acroFormRef) {
        const acroForm = doc.context.lookup(acroFormRef);
        if (acroForm instanceof PDFDict) {
          const hasXfa = acroForm.has(PDFName.of('XFA'));
          if (hasXfa) {
            acroForm.delete(PDFName.of('XFA'));
            // Also clear NeedsRendering flag if present
            acroForm.delete(PDFName.of('NeedsRendering'));
            xfaRemoved = true;
          }
          steps.push(`xfa:${hasXfa ? 'removed' : 'not-found'}`);
        } else {
          steps.push('xfa:acroform-not-pdfdict');
        }
      } else {
        steps.push('xfa:no-acroform');
      }
    } catch (xfaErr: any) {
      steps.push(`xfa:error:${String(xfaErr?.message || xfaErr).slice(0, 80)}`);
    }

    const out = await doc.save({
      useObjectStreams: false,
      updateFieldAppearances: false,
    });
    steps.push('save-ok');

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'X-Conversion-Steps': steps.join('|'),
        'X-Xfa-Removed': String(xfaRemoved),
      },
    });
  } catch (e: any) {
    const errMsg = e.message || 'Conversion impossible';
    steps.push(`error:${errMsg.slice(0, 120)}`);
    console.error('[convert-pdf]', steps.join(' | '));
    return NextResponse.json(
      { error: errMsg, steps },
      {
        status: 422,
        headers: { 'X-Conversion-Steps': steps.join('|') },
      }
    );
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(decryptedPath).catch(() => {});
  }
}
