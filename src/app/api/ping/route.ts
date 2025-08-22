import { dbConnect } from '@/db/connect';

export async function GET() {
    await dbConnect();
    return Response.json({ ok: true, time: new Date().toISOString() });
}
