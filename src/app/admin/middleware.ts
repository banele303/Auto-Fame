// This file is unused as Next.js only supports one middleware file in src/ or root.
// Renuming to ensure no conflict.
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}
