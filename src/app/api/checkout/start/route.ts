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
    currentDay?: number | null;
};

function baseUrl(req: Request) {
    const u = new URL(req.url);
    const proto = req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '') ?? 'https';
    const host = req.headers.get('x-forwarded-host') ?? u.host;
    return `${proto}://${host}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export async function POST(req: Request) {
    try {
        const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
        if (!slug) return NextResponse.json({ error: 'slug requis' }, { status: 400 });

        const sess = await getSession();
        if (!sess?.email) {
            const next = `/programs/${slug}#commencer`;
            return NextResponse.json({ error: 'Non authentifié', redirectTo: `/login?next=${encodeURIComponent(next)}` }, { status: 401 });
        }

        // Programme publié
        const program = await getProgramBySlug(slug);
        if (!program) return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 });

        await dbConnect();

        const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<LeanUser>().exec();
        if (!user?._id) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });

        // Déjà inscrit → redirige vers le jour courant
        const existing = await Enrollment.findOne({
            userId: user._id,
            programSlug: slug,
            status: { $in: ['active', 'completed'] },
        })
            .select({ _id: 1, currentDay: 1 })
            .lean<Pick<LeanEnrollment, '_id' | 'currentDay'> | null>();

        if (existing?._id) {
            const day = Math.max(1, existing.currentDay ?? 1);
            return NextResponse.json({ ok: true, redirectTo: `/learn/${slug}/day/${pad2(day)}` });
        }

        // Gratuit → crée l'enrollment et renvoie vers /member
        if ((program.price?.amount_cents ?? 0) === 0) {
            await Enrollment.findOneAndUpdate(
                { userId: user._id, programSlug: slug },
                { $setOnInsert: { userId: user._id, programSlug: slug, status: 'active', currentDay: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).lean<LeanEnrollment>();
            return NextResponse.json({ ok: true, redirectTo: `/member` });
        }

        // Payant → Stripe
        const stripe = getStripe();

        // Bypass dev si pas de clé stripe
        if (!stripe && process.env.CHECKOUT_DEV_BYPASS === 'true') {
            await Enrollment.findOneAndUpdate(
                { userId: user._id, programSlug: slug },
                { $setOnInsert: { userId: user._id, programSlug: slug, status: 'active', currentDay: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).lean<LeanEnrollment>();
            return NextResponse.json({ ok: true, redirectTo: `/member`, devBypass: true });
        }

        if (!stripe) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 501 });

        // ✅ pas d’assertion non nulle ici
        const amount = Number(program.price?.amount_cents ?? 0);
        const currency = (program.price?.currency || 'EUR').toUpperCase();
        if (!amount || amount <= 0) return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });

        const priceId = program.price?.stripe_price_id || null;
        const base = baseUrl(req);
        // Après succès (retour Stripe) on appelle /api/checkout/confirm, qui lui renverra /member
        const success = `${base}/checkout/success?program=${slug}&session_id={CHECKOUT_SESSION_ID}`;
        const cancel = `${base}/programs/${slug}#commencer`;

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
    } catch {
        return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
    }
}
