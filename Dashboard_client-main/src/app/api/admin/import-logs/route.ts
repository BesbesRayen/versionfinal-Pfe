import { NextResponse } from 'next/server';
import { getImportLogs } from '@/lib/product-import/runtime';

export async function GET() {
  return NextResponse.json({
    logs: getImportLogs(),
  });
}
