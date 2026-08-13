import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/jpg','application/pdf',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','application/zip'
]);
const DOC_MAX: Record<string, number> = {
  id_doc: 2,
  drivers_license: 2,
  payslip_latest: 2,
  payslips_3_months: 6,
  bank_statements: 6,
  proof_of_residence: 2,
  self_employed_docs: 6,
};

function sanitizeDocType(v: string | null) { return v && /^[a-z0-9_\-]+$/i.test(v) ? v : 'misc'; }
function cors(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS,HEAD,GET','Access-Control-Allow-Headers':'Content-Type'} as Record<string,string>;}
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:cors()});}
export async function GET(){return NextResponse.json({ok:true,service:'financing-uploads-alt'}, {status:200,headers:cors()});}

export async function POST(req: NextRequest){
  try {
    console.log('[ALT_UPLOAD_POST_HIT]', req.method, req.headers.get('content-type'));
    const url = new URL(req.url);
    const docType = sanitizeDocType(url.searchParams.get('docType'));
    const formData = await req.formData();
    const files: File[] = [];
    for (const [,val] of formData.entries()) if (val instanceof File) files.push(val);
    if (!files.length) return NextResponse.json({message:'No files received'}, {status:400, headers:cors()});
    const maxForType = DOC_MAX[docType] ?? 6;
    if (files.length > maxForType) return NextResponse.json({message:`Too many files for ${docType}. Max ${maxForType}`},{status:400,headers:cors()});
    const haveAwsCreds = !!(process.env.AWS_BUCKET_NAME && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && !haveAwsCreds) return NextResponse.json({message:'Storage not configured (AWS env vars missing)'},{status:500,headers:cors()});
    const useS3 = haveAwsCreds;
    const localBase = path.join(process.cwd(),'public','uploads','financing',docType);
    if (!useS3) await fs.mkdir(localBase,{recursive:true}).catch(()=>{});
    const uploaded: any[] = [];
    for (const f of files) {
      const sizeMb = f.size/1024/1024;
      if (sizeMb > MAX_FILE_SIZE_MB) return NextResponse.json({message:`File ${f.name} is ${sizeMb.toFixed(1)}MB > ${MAX_FILE_SIZE_MB}MB`},{status:400,headers:cors()});
      if (!ALLOWED_MIME.has(f.type)) return NextResponse.json({message:`File type not allowed: ${f.type}`},{status:400,headers:cors()});
      let urlStored: string;
      if (useS3) {
        try { urlStored = await uploadToS3(f, `financing/${docType}`); } catch(e:any){ return NextResponse.json({message:'S3 upload failed', error:e?.message},{status:500,headers:cors()}); }
      } else {
        const buf = Buffer.from(await f.arrayBuffer());
        const ext = path.extname(f.name) || '.dat';
        const stored = `${Date.now()}_${randomUUID()}${ext}`;
        await fs.writeFile(path.join(localBase, stored), buf);
        urlStored = `/uploads/financing/${docType}/${stored}`;
      }
      uploaded.push({ originalName:f.name, storedName:urlStored.split('/').pop(), size:f.size, type:f.type, url:urlStored, docType, storage: useS3 ? 's3' : 'local' });
    }
    return NextResponse.json({ files: uploaded, alt:true }, {status:201, headers:{...cors(),'x-alt-upload':'1'}});
  } catch(e:any){
    console.error('[ALT_UPLOAD_ERROR]', e);
    return NextResponse.json({message:'Upload failed', error:e?.message},{status:500,headers:cors()});
  }
}

export async function PUT(){return NextResponse.json({message:'Method Not Allowed'},{status:405,headers:cors()});}
export async function DELETE(){return NextResponse.json({message:'Method Not Allowed'},{status:405,headers:cors()});}
