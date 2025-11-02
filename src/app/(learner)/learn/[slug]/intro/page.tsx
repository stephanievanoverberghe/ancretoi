import 'server-only';
import { Types } from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import Enrollment from '@/models/Enrollment';
import DayState from '@/models/DayState';
import IntroClient from './IntroClient';
import ProgramDetailButton from '@/app/(learner)/components/ProgramDetailButton';

type RouteParams = { slug: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function humanizeSlug(slug: string): string {
    return slug
        .split('-')
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
}

export default async function IntroPage({ params }: { params: Promise<RouteParams> }) {
    await dbConnect();
    const { slug } = await params;
    const safeSlug = slug.toLowerCase();

    const user = await requireUser(`/learn/${safeSlug}/intro`);

    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: Types.ObjectId; name?: string | null } | null>();

    if (!userDoc?._id) notFound();

    const page = await ProgramPage.findOne({ programSlug: safeSlug }).select({ hero: 1, card: 1, meta: 1, status: 1 }).lean<{
        hero?: { title?: string | null; subtitle?: string | null } | null;
        card?: { tagline?: string | null } | null;
        meta?: { durationDays?: number | null; estMinutesPerDay?: number | null; level?: string | null } | null;
        status?: 'draft' | 'preflight' | 'published' | null;
    } | null>();

    if (!page) notFound();
    // Optionnel: si tu veux bloquer l’intro quand non publié
    // if (page.status !== 'published') notFound();

    // ⚠️ Choisis la variante selon le type réel dans ton schéma:
    // A) Si Enrollment.userId est un ObjectId:
    const enrollmentQueryUserId = userDoc._id;
    // B) Si Enrollment.userId est un string:
    // const enrollmentQueryUserId = String(userDoc._id);

    const [units, enr, hasProgress] = await Promise.all([
        Unit.find({ programSlug: safeSlug, unitType: 'day', status: 'published' }).select({ unitIndex: 1 }).sort({ unitIndex: 1 }).lean<{ unitIndex: number }[]>(),
        Enrollment.findOne({ userId: enrollmentQueryUserId, programSlug: safeSlug })
            .select({ introEngaged: 1, startedAt: 1 })
            .lean<{ introEngaged?: boolean | null; startedAt?: Date | null } | null>(),
        // ✅ plus léger qu’un count si on veut juste un booléen
        DayState.exists({
            userId: enrollmentQueryUserId,
            programSlug: safeSlug,
            $or: [{ practiced: true }, { completed: true }],
        }).then(Boolean),
    ]);

    const totalDays = units.length;
    const minutesPerDay = page.meta?.estMinutesPerDay ?? 20;
    const minutesPerDaySafe = Math.max(1, minutesPerDay);
    const level = page.meta?.level ?? 'Basique';
    const programName = humanizeSlug(safeSlug);

    const displayName = user.name ?? userDoc?.name ?? '';
    const firstName = displayName ? displayName.split(' ')[0] : '';

    const initialEngaged = !!enr?.introEngaged;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 sm:px-5">
            {/* ===== Header style "admin" adapté formation ===== */}
            <header className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/member" className="hover:underline">
                        Mon espace
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">{programName}</span>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Introduction</span>
                </div>

                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{page.hero?.title?.trim() || 'Introduction'}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {page.hero?.subtitle?.trim() || 'Bienvenue. Voici les repères essentiels pour démarrer en douceur et en conscience.'}
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Durée totale estimée</div>
                        <div className="text-lg font-semibold">{totalDays > 0 ? `${totalDays * minutesPerDaySafe}–${totalDays * minutesPerDaySafe + 5} min` : 'à venir'}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Nombre de jours</div>
                        <div className="text-lg font-semibold">{totalDays || 0}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Rythme conseillé</div>
                        <div className="text-lg font-semibold">{minutesPerDaySafe} min/j</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Niveau</div>
                        <div className="text-lg font-semibold">{level}</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <ProgramDetailButton slug={safeSlug} label="Vue d’ensemble" />
                    <a
                        href="#engagement"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                        Aller à l’engagement
                    </a>
                </div>
            </header>

            <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">Ce qui t’attend</h2>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Feature title="Clarté & douceur" text="Des exercices simples, guidés, pour te mettre en mouvement sans te brusquer." />
                    <Feature title="Ancrage corporel" text="Des micro-pratiques de respiration et d’écoute du corps pour revenir au calme." />
                    <Feature title="Progression réelle" text="Un pas par jour. Tu avances, tu notes, tu reviens si besoin. On garde tout en mémoire." />
                </div>
            </section>

            <IntroClient slug={safeSlug} initialEngaged={initialEngaged} hasProgress={hasProgress} learnerName={firstName} />
        </div>
    );
}

function Feature({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
            <div className="text-sm font-medium text-foreground">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
    );
}
