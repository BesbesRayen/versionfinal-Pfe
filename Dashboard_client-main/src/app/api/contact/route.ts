import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/server/backend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response, data } = await fetchBackendJson('/api/support/contact-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || "Erreur lors de l'envoi du message." },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Votre message a ete envoye avec succes. Nous vous repondrons dans les plus brefs delais.',
        messageId: data?.id,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Erreur de connexion au serveur.' },
      { status: 500 },
    );
  }
}
