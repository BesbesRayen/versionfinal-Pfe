import { NextRequest, NextResponse } from 'next/server';

const backendUrl = () => process.env['BACKEND_URL'] ?? 'http://127.0.0.1:8082';

async function proxy(req: NextRequest) {
  const res = await fetch(`${backendUrl()}/api/admin/stores${req.nextUrl.search}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
  });
  return new NextResponse(await res.arrayBuffer(), { status: res.status, headers: res.headers });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}
