import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => process.env['BACKEND_URL'] ?? 'http://127.0.0.1:8082';

async function proxy(req: NextRequest, params: { path: string[] }) {
  const backendPath = '/' + params.path.join('/');
  const search = req.nextUrl.search ?? '';
  const url = `${getBackendUrl()}/api${backendPath}${search}`;

  const headers = new Headers();
  const ignoredHeaders = new Set([
    'host',
    'connection',
    'content-length',
    'expect',
    'origin',
    'access-control-request-headers',
    'access-control-request-method',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
  ]);
  req.headers.forEach((value, key) => {
    if (!ignoredHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const resBody = await res.arrayBuffer();
  const resHeaders = new Headers();
  res.headers.forEach((value, key) => {
    resHeaders.set(key, value);
  });

  return new NextResponse(resBody, {
    status: res.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
