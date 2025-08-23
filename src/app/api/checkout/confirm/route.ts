export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getStripe } from '@/lib/stripe';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import { getSession } from '@/lib/session';

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
    const { session_id, program } = await req.json().catch(() => ({}));
    if (!session_id || !program) return NextResponse.json({ error: 'params manquants' }, { status: 400 });

    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 501 });

    const checkout = await stripe.checkout.sessions.retrieve(session_id);

    // Vérifs essentielles : paiement + métadonnées cohérentes
    const paid = checkout.status === 'complete' || checkout.payment_status === 'paid';
    if (!paid) return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 });

    const metaProgram = checkout.metadata?.program as string | undefined;
    const metaUserId = checkout.metadata?.userId as string | undefined;
    if (!metaProgram || !metaUserId) {
        return NextResponse.json({ error: 'Métadonnées de session manquantes' }, { status: 400 });
    }
    if (metaProgram !== program) {
        return NextResponse.json({ error: 'Programme inattendu' }, { status: 400 });
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1 }).lean<LeanUserId>();
    if (!user?._id) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

    // Empêche de valider pour un autre user
    if (String(user._id) !== String(metaUserId)) {
        return NextResponse.json({ error: 'Session non liée à cet utilisateur' }, { status: 403 });
    }

    const enr = await Enrollment.findOneAndUpdate(/* ... */).lean<LeanEnrollment>();
    return NextResponse.json({
        ok: true,
        enrollmentId: enr?._id?.toString(),
        redirectTo: `/member/${program}/day/1`,
    });
}
