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
    const applicationId = parseInt(id, 10);
    
    // Validate that id is a valid number
    if (isNaN(applicationId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid application ID' }),
        { status: 400 }
      );
    }
    
    const { decisionNotes } = await request.json();
    
    // Check if application exists and is in PENDING status
    const application = await prisma.financingApplication.findUnique({
      where: { id: applicationId }
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
    
    // Update the application status to REJECTED
    const updatedApplication = await prisma.financingApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        // Note: decisionDate and decisionNotes are not part of the FinancingApplication schema
        // In a real implementation, you might want to create a separate table for decision history
        // or add these fields to the schema if needed
      }
    });

    // In a real application, you might want to send a notification to the customer here
    
    return NextResponse.json(updatedApplication);
    
  } catch (error) {
    console.error('Error rejecting financing application:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
