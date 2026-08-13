import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = {
    convex: {
      url: process.env.NEXT_PUBLIC_CONVEX_URL || null,
      configured: !!process.env.NEXT_PUBLIC_CONVEX_URL,
    },
    nodeEnv: process.env.NODE_ENV,
    note: 'Storage diagnostics'
  };

  return NextResponse.json(summary, { status: 200 });
}
