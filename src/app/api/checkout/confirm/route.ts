export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getStripe } from '@/lib/stripe';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import { getSession } from '@/lib/session';
import { normalizeProgramSlug } from '@/lib/programs';

type LeanUserId = { _id: Types.ObjectId };
type LeanEnrollment = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    programSlug: string;
    status: 'active' | 'completed' | 'paused';
    startedAt?: Date;
    completedAt?: Date;
};

export async function POST(req: Request) {
    const body = (await req.json().catch(() => ({}))) as { session_id?: string; program?: string };
    const session_id = body.session_id;
    const bodyProgram = body.program ? normalizeProgramSlug(body.program) : '';

    if (!session_id || !bodyProgram) return NextResponse.json({ error: 'params manquants' }, { status: 400 });

    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 501 });

    const checkout = await stripe.checkout.sessions.retrieve(session_id);

    const paid = checkout.status === 'complete' || checkout.payment_status === 'paid';
    if (!paid) return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 });

    const metaProgram = normalizeProgramSlug(String(checkout.metadata?.program || ''));
    const metaUserId = String(checkout.metadata?.userId || '');

    if (!metaProgram || !metaUserId) {
        return NextResponse.json({ error: 'Métadonnées de session manquantes' }, { status: 400 });
    }
    if (metaProgram !== bodyProgram) {
        return NextResponse.json({ error: 'Programme inattendu' }, { status: 400 });
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1 }).lean<LeanUserId>().exec();
    if (!user?._id) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

    if (String(user._id) !== metaUserId) {
        return NextResponse.json({ error: 'Session non liée à cet utilisateur' }, { status: 403 });
    }

    const enr = await Enrollment.findOneAndUpdate(
        { userId: user._id, programSlug: bodyProgram },
        { $setOnInsert: { userId: user._id, programSlug: bodyProgram, status: 'active', startedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<LeanEnrollment>();

    return NextResponse.json({
        ok: true,
        enrollmentId: enr?._id?.toString(),
        redirectTo: `/learn/${bodyProgram}/day/1`,
    });
}
