import { NextRequest, NextResponse } from 'next/server';
import { ProductImporterService } from '@/lib/product-import/importer';
import { recordImportLog } from '@/lib/product-import/runtime';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; storeId?: string };
    if (!body.url) {
      return NextResponse.json({ error: 'url est obligatoire.' }, { status: 400 });
    }

    const result = await ProductImporterService.importFromUrl(body.url, {
      storeId: body.storeId,
      useCache: false,
    });
    const log = recordImportLog(result);
    return NextResponse.json({ result, log });
  } catch {
    return NextResponse.json({ error: 'Impossible de tester cette URL.' }, { status: 500 });
  }
}
