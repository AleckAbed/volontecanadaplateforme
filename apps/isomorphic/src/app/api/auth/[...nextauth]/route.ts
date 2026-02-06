/**
 * Routes NextAuth désactivées
 * Nous utilisons maintenant notre propre API Laravel pour l'authentification
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'NextAuth is disabled. Please use /signin for authentication.',
      message: 'Les routes NextAuth sont désactivées. Utilisez /signin pour vous connecter.'
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'NextAuth is disabled. Please use /signin for authentication.',
      message: 'Les routes NextAuth sont désactivées. Utilisez /signin pour vous connecter.'
    },
    { status: 404 }
  );
}
