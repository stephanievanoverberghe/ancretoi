import { dbConnect } from '@/db/connect';

export async function GET() {
    await dbConnect(); // vérifie qu'on sait parler à Mongo
    return Response.json({ ok: true, time: new Date().toISOString() });
}
