import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";
import { verifyAuth } from "@/lib/auth";

export const runtime = "nodejs";

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('[API/presign-uploads] Received POST request');
  try {
    // Debug: log auth header presence
    const authHeader = req.headers.get('authorization');
    console.log('[API/presign-uploads] Auth header present:', !!authHeader, '| starts with Bearer:', authHeader?.startsWith('Bearer '));
    
    // Verify the user is authenticated
    const authResult = await verifyAuth(req, []);
    if (!authResult.isAuthenticated) {
      console.warn('[API/presign-uploads] Unauthorized:', authResult.message);
      return NextResponse.json({ message: `Unauthorized: ${authResult.message}` }, { status: 401 });
    }

    const missing: string[] = [];
    if (!process.env.AWS_REGION) missing.push('AWS_REGION');
    if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_BUCKET_NAME) missing.push('AWS_BUCKET_NAME');
    if (missing.length) {
      return NextResponse.json({ message: 'Missing required S3 env vars', missing }, { status: 500 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseError: any) {
      console.error('FormData parse error:', parseError);
      return NextResponse.json({ message: 'Failed to parse form data. File may be too large.' }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "blog";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File too large (max 5MB)" }, { status: 400 });
    }

    // Allow specifying a folder (e.g. 'blog', 'cars'), default to 'blog'
    const allowedFolders = ['cars', 'blog', 'general'];
    const safeFolder = allowedFolders.includes(folder) ? folder : 'blog';

    // Upload directly to S3 using the same helper used for car images
    const url = await uploadToS3(file, safeFolder);

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    console.error('Upload error', e);
    return NextResponse.json(
      { message: 'Failed to upload', error: e?.message },
      { status: 500 }
    );
  }
}
