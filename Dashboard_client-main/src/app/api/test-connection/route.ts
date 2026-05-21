import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/server/backend';

export async function GET() {
  try {
    const { response, data } = await fetchBackendJson('/api/users/health', {
      method: 'GET',
    });

    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok ? 'Backend connection successful' : 'Backend connection failed',
        backend: data,
      },
      { status: response.ok ? 200 : 500 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Backend connection failed',
      },
      { status: 500 },
    );
  }
}
