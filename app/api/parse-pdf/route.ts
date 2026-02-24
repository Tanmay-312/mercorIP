import { NextRequest, NextResponse } from 'next/server';

// Polyfill Promise.withResolvers for Node 18/20 compatibility with pdfjs-dist v4+
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Dynamically import pdfjs AFTER polyfill has run
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

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