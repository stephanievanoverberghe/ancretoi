// src/app/(learner)/learn/[slug]/conclusion/page.tsx
import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import ProgramPage from '@/models/ProgramPage';
import ResetProgramClient from './ResetProgramClient';

type RouteParams = { slug: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// "ancre-toi" → "Ancre Toi"
function humanize(slug: string) {
    return slug
        .split('-')
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
}

function SimpleProgramCard(props: { slug: string; title: string; durationDays: number; cover: string; alt?: string | null; position?: number }) {
    const { slug, title, durationDays, cover, alt, position = 0 } = props;
    return (
        <article>
            <Link href={`/programs/${slug}`} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
                    <Image
                        src={cover}
                        alt={alt ?? ''}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width:1024px) 50vw, 320px"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        priority={position < 3}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-50/95 px-2.5 py-1 text-xs font-medium text-gold-800 ring-1 ring-gold-200 shadow-sm">
                        {durationDays} jours
                    </span>
                    <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
                        <h3 className="flex-1 truncate font-serif text-white text-[clamp(1rem,2.6vw,1.1rem)] leading-tight drop-shadow">{title}</h3>
                        <span
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-700 ring-1 ring-brand-100 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M13 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}

export default async function ConclusionPage({ params }: { params: Promise<RouteParams> }) {
    await dbConnect();
    const { slug } = await params;
    const safeSlug = slug.toLowerCase();

    // Auth
    const session = await requireUser(`/learn/${safeSlug}/conclusion`);
    const me = await UserModel.findOne({ email: session.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: unknown; name?: string | null } | null>();
    if (!me?._id) redirect(`/learn/${safeSlug}`);

    const userId = String(me._id);

    // Progression uniquement pour CE programme
    const enr = await Enrollment.findOne({ userId, programSlug: safeSlug })
        .select({ status: 1, currentDay: 1, startedAt: 1, completedAt: 1 })
        .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null; startedAt?: Date | null; completedAt?: Date | null } | null>();

    // Nombre de jours PUBLIÉS pour CE programme
    const totalPublished = await Unit.countDocuments({ programSlug: safeSlug, unitType: 'day', status: 'published' });

    // ⚠️ Accès strict : la conclusion n’est accessible que si le statut de CE programme est "completed"
    if (!enr || enr.status !== 'completed') {
        const current = Math.max(1, Math.min(totalPublished || 1, enr?.currentDay ?? 1));
        redirect(`/learn/${safeSlug}/day/${String(current).padStart(2, '0')}`);
    }

    // Métadonnées du programme courant
    const page = await ProgramPage.findOne({ programSlug: safeSlug })
        .select({ hero: 1, meta: 1 })
        .lean<{ hero?: { title?: string | null } | null; meta?: { estMinutesPerDay?: number | null; durationDays?: number | null; level?: string | null } | null } | null>();

    const minutesPerDay = Math.max(1, page?.meta?.estMinutesPerDay ?? 20);
    const totalMinutes = totalPublished * minutesPerDay;
    const programName = humanize(safeSlug);

    // Autres programmes publiés (≠ slug courant)
    const published = await ProgramPage.find({ status: 'published', programSlug: { $ne: safeSlug } })
        .select({ programSlug: 1, hero: 1, card: 1, meta: 1, status: 1 })
        .limit(6)
        .lean<
            Array<{
                programSlug: string;
                hero?: { title?: string | null } | null;
                card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
                meta?: { estMinutesPerDay?: number | null; durationDays?: number | null; level?: string | null } | null;
                status?: 'draft' | 'preflight' | 'published' | null;
            }>
        >();

    const fallbackCover = '/images/prog-placeholder-4x3.jpg';
    const otherPrograms = published
        .map((p) => ({
            slug: p.programSlug,
            title: (p.hero?.title ?? humanize(p.programSlug)).trim(),
            durationDays: Math.max(1, p.meta?.durationDays ?? 1),
            cover: p.card?.image?.url?.trim() || fallbackCover,
            alt: p.card?.image?.alt ?? null,
        }))
        .filter((p) => !!p.cover);

    const displayName = session.name ?? me?.name ?? '';
    const firstName = displayName ? displayName.split(' ')[0] : '';

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-16 sm:px-5">
            {/* ===== Header ===== */}
            <header className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/member" className="hover:underline">
                        Mon espace
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">{programName}</span>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Conclusion</span>
                </div>

                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{page?.hero?.title?.trim() || 'Bilan & prochaines étapes'}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {firstName ? `${firstName}, ` : ''}tu as complété toutes les leçons publiées. Voici ta synthèse et comment poursuivre.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Stat label="Leçons complétées" value={totalPublished} />
                    <Stat label="Temps total estimé" value={`${totalMinutes} min`} />
                    <Stat label="Rythme conseillé" value={`${minutesPerDay} min/j`} />
                    <Stat label="Niveau" value={page?.meta?.level ?? 'Basique'} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link href={`/learn/${safeSlug}`} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Vue d’ensemble
                    </Link>
                    <Link
                        href="/notes?export=pdf"
                        className="rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                        Exporter mon carnet (PDF)
                    </Link>
                </div>
            </header>

            {/* ===== Synthèse ===== */}
            <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">Ta synthèse</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>{totalPublished} leçon(s) complétée(s)</li>
                    <li>Notes & journaux enregistrés — exports disponibles (PDF/JSON)</li>
                </ul>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href={`/notes?export=pdf`} className="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
                        Exporter mon carnet (PDF)
                    </Link>
                    <Link href={`/notes?export=json`} className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Exporter mes données (JSON)
                    </Link>
                </div>
            </section>

            {/* ===== Continuer avec d’autres formations ===== */}
            {otherPrograms.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground">Poursuivre avec…</h3>
                        <Link href="/programs" className="text-sm text-brand-700 hover:underline">
                            Voir tout
                        </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {otherPrograms.map((p, i) => (
                            <SimpleProgramCard key={p.slug} slug={p.slug} title={p.title} durationDays={p.durationDays} cover={p.cover} alt={p.alt} position={i} />
                        ))}
                    </div>
                </section>
            )}

            {/* ===== Réinitialiser CE programme uniquement ===== */}
            <section className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">Recommencer ce programme</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Supprime tes réponses et remets la progression au jour 1 de <span className="font-medium">{programName}</span>.
                </p>

                <div className="mt-3 rounded-xl border border-border/80 bg-brand-50/80 p-4">
                    <ResetProgramClient slug={safeSlug} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href="/member" className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Retour au tableau de bord
                    </Link>
                    <Link href="/programs" className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Voir les programmes
                    </Link>
                </div>
            </section>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
        </div>
    );
}
