// src/app/api/settings/avatar/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';

export async function POST(req: Request) {
    try {
        const sess = await getSession();
        if (!sess?.email) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });

        const form = await req.formData();
        const name = form.get('name');
        const remove = form.get('remove'); // '1' pour supprimer
        const file = form.get('avatar') as File | null;

        await dbConnect();

        let avatarUrlToSave: string | null | undefined = undefined;

        // Suppression explicite
        if (remove === '1') {
            avatarUrlToSave = null;
        } else if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
            // ✅ Quick-win : encode en Data URL et stocke en DB
            const buf = Buffer.from(await file.arrayBuffer());
            const mime = file.type || 'image/png';
            const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
            avatarUrlToSave = dataUrl;

            // 🔁 Plus tard : remplace par un upload S3/Cloudinary et mets l’URL HTTP ici.
            // const uploadedUrl = await uploadToYourStorage(file);
            // avatarUrlToSave = uploadedUrl;
        }

        const $set: Record<string, unknown> = { updatedAt: new Date() };
        if (typeof name === 'string') $set.name = name;
        if (avatarUrlToSave !== undefined) $set.avatarUrl = avatarUrlToSave;

        await UserModel.updateOne({ email: sess.email }, { $set });

        return NextResponse.json({ ok: true, avatarUrl: avatarUrlToSave ?? undefined });
    } catch (e) {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 }), e;
    }
}
