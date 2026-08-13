import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (authResult.isAuthenticated) {
      return NextResponse.json({ isAuthenticated: true, userId: authResult.userId, userRole: authResult.userRole });
    } else {
      return NextResponse.json({ isAuthenticated: false, message: authResult.message }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Error checking admin authentication:", error);
    return NextResponse.json({ isAuthenticated: false, message: `Error: ${error.message}` }, { status: 500 });
  }
}
