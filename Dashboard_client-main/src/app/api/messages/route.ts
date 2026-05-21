import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/server/backend';

export async function GET() {
  try {
    const { response, data } = await fetchBackendJson('/api/support/contact-messages', {
      method: 'GET',
    });

    if (!response.ok || !Array.isArray(data)) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          messages: [],
          degraded: true,
          message: 'Messages are unavailable, returning empty list',
        },
        { status: 200 },
      );
    }

    const messages = data.map((message) => ({
      ...message,
      created_at: message.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        count: messages.length,
        messages,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        count: 0,
        messages: [],
        degraded: true,
        message: 'Unable to load messages, try again later',
      },
      { status: 200 },
    );
  }
}
