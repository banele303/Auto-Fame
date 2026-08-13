import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request, ['admin', 'manager']);
    
    // Check if user is authenticated and has required role
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: authResult.message || 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const { id } = params;
    // Consume body (if any) but decision notes field is not in the model
    await request.json().catch(() => null);
    
    // Check if application exists and is in PENDING status
    const application = await prisma.financingApplication.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: 'Financing application not found' }),
        { status: 404 }
      );
    }
    
    if (application.status !== 'PENDING') {
      return new NextResponse(
        JSON.stringify({ error: 'This application has already been processed' }),
        { status: 400 }
      );
    }
    
    const updatedApplication = await prisma.financingApplication.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED'
      }
    });

    // In a real application, you might want to send a notification to the customer here
    
    return NextResponse.json(updatedApplication);
    
  } catch (error) {
    console.error('Error approving financing application:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
