export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getStripe } from '@/lib/stripe';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import { getSession } from '@/lib/session';
import { getProgramBySlug } from '@/lib/programs-index.server';

type LeanUser = { _id: Types.ObjectId; email: string };
type LeanEnrollment = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    programSlug: string;
    status: 'active' | 'completed' | 'paused';
    startedAt?: Date;
    completedAt?: Date;
};

// URL absolue compatible Vercel (preview/prod)
function getBaseUrl(req: Request) {
    const u = new URL(req.url);
    const proto = req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '') ?? 'https';
    const host = req.headers.get('x-forwarded-host') ?? u.host;
    return `${proto}://${host}`;
}

export async function POST(req: Request) {
    const { slug } = await req.json().catch(() => ({}));
    if (!slug) return NextResponse.json({ error: 'slug requis' }, { status: 400 });

    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // ✅ lecture depuis la DB (seulement “published”)
    const program = await getProgramBySlug(slug);
    if (!program) return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 });

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<LeanUser>();
    if (!user?._id) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

    // Gratuit → inscription directe
    if (program.price?.amount_cents === 0) {
        const enr = await Enrollment.findOneAndUpdate(
            { userId: user._id, programSlug: slug },
            { $setOnInsert: { userId: user._id, programSlug: slug, status: 'active' } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean<LeanEnrollment>();
        const enrollmentId = enr ? enr._id.toString() : undefined;
        return NextResponse.json({ ok: true, redirectTo: `/membre/${slug}/jour/1`, enrollmentId });
    }

    // Payant → Stripe
    const stripe = getStripe();

    // Bypass dev (optionnel)
    if (!stripe && process.env.CHECKOUT_DEV_BYPASS === 'true') {
        const enr = await Enrollment.findOneAndUpdate(
            { userId: user._id, programSlug: slug },
            { $setOnInsert: { userId: user._id, programSlug: slug, status: 'active' } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean<LeanEnrollment>();
        const enrollmentId = enr ? enr._id.toString() : undefined;
        return NextResponse.json({ ok: true, redirectTo: `/membre/${slug}/jour/1`, enrollmentId, devBypass: true });
    }

    if (!stripe) return NextResponse.json({ error: 'Stripe non configuré (STRIPE_SECRET_KEY manquante).' }, { status: 501 });

    const amount = program.price?.amount_cents ?? null;
    const currency = (program.price?.currency || 'EUR').toUpperCase();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Montant invalide ou manquant.' }, { status: 400 });

    const base = getBaseUrl(req);
    const success = `${base}/checkout/success?program=${slug}&session_id={CHECKOUT_SESSION_ID}`;
    const cancel = `${base}/programs/${slug}#commencer`;

    const priceId = program.price?.stripe_price_id || null;

    const session = priceId
        ? await stripe.checkout.sessions.create({
              mode: 'payment',
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: success,
              cancel_url: cancel,
              customer_email: user.email,
              metadata: { program: slug, userId: String(user._id) },
          })
        : await stripe.checkout.sessions.create({
              mode: 'payment',
              line_items: [
                  {
                      price_data: {
                          currency,
                          unit_amount: amount,
                          product_data: { name: program.title },
                      },
                      quantity: 1,
                  },
              ],
              success_url: success,
              cancel_url: cancel,
              customer_email: user.email,
              metadata: { program: slug, userId: String(user._id) },
          });

    return NextResponse.json({ url: session.url });
}
