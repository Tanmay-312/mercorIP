import { NextRequest, NextResponse } from 'next/server';
// Use the legacy build for better Node.js compatibility
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pdf = await pdfjs.getDocument({ data: uint8Array }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((s: any) => s.str).join(' ') + '\n';
    }

    return NextResponse.json({ text, pages: pdf.numPages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}