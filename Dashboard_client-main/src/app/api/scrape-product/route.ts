import { NextRequest, NextResponse } from 'next/server';
import { ProductImporterService } from '@/lib/product-import/importer';
import { recordImportLog } from '@/lib/product-import/runtime';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string };
    if (!body.url) {
      return NextResponse.json({ valid: false, errorMessage: 'URL obligatoire.' }, { status: 200 });
    }

    const result = await ProductImporterService.importFromUrl(body.url);
    recordImportLog(result);

    return NextResponse.json({
      name: result.product.title,
      price: result.product.price ? String(result.product.price) : '',
      description: result.product.description,
      images: result.product.gallery.length ? result.product.gallery : result.product.mainImage ? [result.product.mainImage] : [],
      brand: result.product.brand,
      category: result.product.category,
      sourceUrl: result.sourceUrl,
      aiExtracted: false,
      valid: result.success,
      errorMessage: result.success ? undefined : result.parser.warnings.join(' '),
      parser: result.parser,
      store: result.store,
    });
  } catch {
    return NextResponse.json({
      valid: false,
      errorMessage: "Impossible de charger la page. Verifiez l'URL.",
    }, { status: 200 });
  }
}
