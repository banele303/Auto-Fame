import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redacted(v?: string) {
  if (!v) return null;
  if (v.length <= 6) return '****';
  return v.slice(0,3) + '***' + v.slice(-2);
}

export async function GET() {
  const haveBucket = !!process.env.AWS_BUCKET_NAME;
  const haveRegion = !!process.env.AWS_REGION;
  const haveKey = !!process.env.AWS_ACCESS_KEY_ID;
  const haveSecret = !!process.env.AWS_SECRET_ACCESS_KEY;

  const summary = {
    env: {
      AWS_BUCKET_NAME_present: haveBucket,
      AWS_REGION: process.env.AWS_REGION || null,
      AWS_ACCESS_KEY_ID_present: haveKey,
      AWS_SECRET_ACCESS_KEY_present: haveSecret,
    },
    derived: {
      useS3: haveBucket && haveRegion && haveKey && haveSecret,
      nodeEnv: process.env.NODE_ENV,
    },
    note: 'No secrets exposed. Use this to verify prod has all required vars.'
  };

  return NextResponse.json(summary, { status: 200 });
}
