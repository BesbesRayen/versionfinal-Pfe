import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/server/backend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await fetchBackendJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Erreur de connexion au serveur.' },
      { status: 500 },
    );
  }
}
