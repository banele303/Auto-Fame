import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API endpoint to clear the admin authentication cookie
export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth_token');
    
    console.log('[API] Removed admin auth cookie successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error removing admin auth cookie:', error);
    return NextResponse.json({ success: true }); // Still return success to allow client logout
  }
}
