// src/app/member/page.tsx
import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';

// UI clients
import ProgressDonutClient from './components/ProgressDonutClient';
import StreakHeatmapClient from './components/StreakHeatmapClient';
import ProgramDetailButton from '@/app/(learner)/components/ProgramDetailButton';

type EnrollmentLean = {
    programSlug: string;
    status: 'active' | 'completed' | 'paused';
    currentDay?: number | null;
    updatedAt?: Date | null;
};

type ProgramLean = {
    programSlug: string;
    hero?: { title?: string | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
    meta?: { level?: 'Basique' | 'Cible' | 'Premium' | null } | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getDisplayName(userEmail: string, sessionName?: string | null, dbName?: string | null) {
    const raw = (sessionName ?? dbName ?? '').trim();
    if (raw) return raw.split(' ')[0];
    const local = (userEmail.split('@')[0] ?? '').trim();
    if (!local) return 'toi';
    return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function MemberPage() {
    await dbConnect();
    const user = await requireUser('/member');

    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: unknown; name?: string | null }>();

    if (!userDoc?._id) redirect('/login?next=/member');

    const userId = String(userDoc._id);
    const displayName = getDisplayName(user.email, user.name, userDoc.name);

    // Inscriptions triées par dernière activité
    const enrollments = await Enrollment.find({ userId }).select({ programSlug: 1, status: 1, currentDay: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).lean<EnrollmentLean[]>();

    const slugs = [...new Set(enrollments.map((e) => e.programSlug))];

    const pages = slugs.length
        ? await ProgramPage.find({ programSlug: { $in: slugs } })
              .select({ programSlug: 1, hero: 1, card: 1, meta: 1 })
              .lean<ProgramLean[]>()
        : [];

    const pageBySlug = new Map(pages.map((p) => [p.programSlug, p]));
    const totals = new Map<string, number>(await Promise.all(slugs.map(async (s) => [s, await Unit.countDocuments({ programSlug: s, unitType: 'day' })] as const)));

    const rows = enrollments.map((e) => {
        const pg = pageBySlug.get(e.programSlug);
        const total = totals.get(e.programSlug) ?? 0;
        const currentDay = Math.max(1, Math.min(total || 1, e.currentDay ?? 1));
        const done = e.status === 'completed' ? total : Math.max(0, currentDay - 1);
        const percent = total ? Math.round((done / total) * 100) : 0;

        return {
            programSlug: e.programSlug,
            title: pg?.hero?.title ?? 'Sans titre',
            coverUrl: pg?.card?.image?.url ?? null,
            coverAlt: pg?.card?.image?.alt ?? null,
            level: (pg?.meta?.level ?? null) as 'Basique' | 'Cible' | 'Premium' | null,
            unitsTotal: total,
            unitsDone: done,
            percent,
            currentDay,
            status: e.status,
            lastUpdatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
        };
    });

    // ---- FOCUS HEADER ----
    // 1) Priorité aux cours "nouvellement achetés" (0%)
    const newlyBought = rows.filter((r) => r.percent === 0 && r.status !== 'completed').sort((a, b) => (b.lastUpdatedAt ?? '').localeCompare(a.lastUpdatedAt ?? ''));

    // 2) Sinon premier cours non terminé
    const notCompleted = rows.filter((r) => r.percent < 100 && r.status !== 'completed');

    const resume = newlyBought[0] ?? notCompleted[0] ?? rows[0] ?? null;

    // Href + Label CTA header
    const headerHref = resume
        ? resume.percent === 100 || resume.status === 'completed'
            ? `/learn/${resume.programSlug}/conclusion`
            : resume.unitsDone === 0
            ? `/learn/${resume.programSlug}/intro`
            : '/continue'
        : '/programs';

    const headerLabel = resume ? (resume.percent === 100 || resume.status === 'completed' ? 'Terminé' : resume.unitsDone === 0 ? 'Commencer' : 'Continuer') : 'Explorer les cours';

    // === KPIs globaux ===
    const activeCount = rows.filter((r) => r.status === 'active').length;
    const avgPercent = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0;
    const totalUnitsDone = rows.reduce((s, r) => s + r.unitsDone, 0);
    const lastActivityIso = enrollments[0]?.updatedAt ? enrollments[0].updatedAt.toISOString() : null;

    const hasSomethingToResume = rows.some((r) => r.percent < 100);

    return (
        <>
            {/* ===== HERO ===== */}
            <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 ring-1 ring-black/5 p-5 md:p-6 backdrop-blur">
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_80%_0%,#000_15%,transparent_75%)]">
                    <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
                </div>

                <div className="relative grid gap-6 md:grid-cols-[1fr_240px] items-start">
                    <div>
                        <p className="text-sm text-muted-foreground">Bonjour {displayName}</p>
                        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">Ton espace d’évolution</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Reprends là où tu t’es arrêté, suis ta progression, et retrouve ton bilan.</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href={headerHref}
                                className={[
                                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition',
                                    headerLabel === 'Terminé' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-600 text-white hover:bg-brand-700',
                                ].join(' ')}
                            >
                                {headerLabel}
                            </Link>

                            <a href="#stats" className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm hover:bg-white">
                                Voir mes statistiques
                            </a>
                            <Link href="/member/summary" className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm hover:bg-white">
                                Ouvrir le bilan
                            </Link>
                        </div>

                        {/* KPIs */}
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Kpi label="Cours actifs" value={activeCount} />
                            <Kpi label="Progression moyenne" value={`${avgPercent}%`} />
                            <Kpi label="Unités effectuées" value={totalUnitsDone} />
                            <Kpi label="Dernière activité" value={lastActivityIso ? new Date(lastActivityIso).toLocaleDateString('fr-FR') : '—'} />
                        </div>
                    </div>

                    {/* Donut global (moyenne) */}
                    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 ring-1 ring-black/5 shadow-sm">
                        <div className="text-sm font-medium text-center">Progression globale</div>
                        <div className="mt-2 grid place-items-center">
                            <ProgressDonutClient percent={avgPercent} size={172} stroke={14} label={`${avgPercent}%`} />
                        </div>
                        {resume && (
                            <div className="mt-3 text-center text-xs text-muted-foreground">
                                Focus actuel : <span className="font-medium">{resume.title}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== Anchor pills ===== */}
            <nav className="mt-6 flex flex-wrap gap-2">
                <a href="#courses" className="rounded-lg px-3 py-1.5 text-xs ring-1 ring-border hover:bg-muted">
                    Mes cours
                </a>
                <a href="#stats" className="rounded-lg px-3 py-1.5 text-xs ring-1 ring-border hover:bg-muted">
                    Statistiques
                </a>
                <a href="#summary" className="rounded-lg px-3 py-1.5 text-xs ring-1 ring-border hover:bg-muted">
                    Bilan
                </a>
            </nav>

            {/* ===== Layout 2 colonnes ===== */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Colonne principale */}
                <div className="space-y-6">
                    {/* ===== MES COURS ===== */}
                    <section id="courses" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Mes cours</h2>
                            {rows.length > 0 && hasSomethingToResume && (
                                <Link href="/continue" className="text-sm font-medium text-brand-700 hover:underline">
                                    Reprendre →
                                </Link>
                            )}
                        </div>

                        {rows.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {rows.map((r) => {
                                    const isDone = r.percent === 100 || r.status === 'completed';
                                    const primaryHref = isDone ? `/learn/${r.programSlug}/conclusion` : r.unitsDone === 0 ? `/learn/${r.programSlug}/intro` : '/continue';
                                    const primaryLabel = isDone ? 'Terminé' : r.unitsDone === 0 ? 'Commencer' : 'Continuer';

                                    return (
                                        <li
                                            key={r.programSlug}
                                            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <div className="relative aspect-[16/10] w-full bg-muted">
                                                {r.coverUrl ? (
                                                    <Image
                                                        src={r.coverUrl}
                                                        alt={r.coverAlt ?? ''}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">Aucune image</div>
                                                )}
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                                                {r.level && (
                                                    <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium ring-1 ring-black/5">
                                                        {r.level}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.programSlug}</div>
                                                <h3 className="line-clamp-2 text-base font-semibold sm:text-lg">{r.title}</h3>

                                                <div
                                                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                                                    role="progressbar"
                                                    aria-valuenow={r.percent}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div className="h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${r.percent}%` }} />
                                                </div>
                                                <div className="mt-1 text-right text-xs text-muted-foreground">
                                                    {r.unitsDone}/{r.unitsTotal} — {r.percent}%
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <Link
                                                        href={primaryHref}
                                                        className={[
                                                            'inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium transition',
                                                            r.percent === 100 || r.status === 'completed'
                                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                                : 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100',
                                                        ].join(' ')}
                                                    >
                                                        {primaryLabel}
                                                    </Link>

                                                    <ProgramDetailButton
                                                        slug={r.programSlug}
                                                        returnTo="/member"
                                                        trigger={
                                                            <button className="inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-sm hover:bg-muted">
                                                                Détails
                                                            </button>
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* ===== STATISTIQUES ===== */}
                    <section id="stats" className="space-y-4">
                        <h2 className="text-lg font-semibold">Statistiques</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-border bg-card p-4">
                                <div className="text-sm font-medium">Assiduité (30 jours)</div>
                                <div className="mt-2">
                                    <StreakHeatmapClient days={30} />
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Objectif : 4 jours / semaine. Rappels activables dans Paramètres &gt; Préférences.</p>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-4">
                                <div className="text-sm font-medium">Temps estimé d’apprentissage</div>
                                <p className="mt-1 text-xs text-muted-foreground">Calcul simple : ~10 min / unité terminée (à affiner si tu stockes de la durée par unité).</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <KpiSoft label="Unités terminées" value={totalUnitsDone} />
                                    <KpiSoft label="Estimation (min)" value={totalUnitsDone * 10} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ===== BILAN ===== */}
                    <section id="summary" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Bilan</h2>
                            <Link href="/member/summary" className="text-sm font-medium text-brand-700 hover:underline">
                                Ouvrir le bilan complet →
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <ul className="text-sm space-y-1">
                                <li>
                                    • Cours actifs : <strong>{activeCount}</strong>
                                </li>
                                <li>
                                    • Progression moyenne : <strong>{avgPercent}%</strong>
                                </li>
                                <li>
                                    • Unités complétées : <strong>{totalUnitsDone}</strong>
                                </li>
                                <li>
                                    • Dernière activité : <strong>{lastActivityIso ? new Date(lastActivityIso).toLocaleString('fr-FR') : '—'}</strong>
                                </li>
                            </ul>
                            <p className="mt-2 text-xs text-muted-foreground">Astuce : cible une progression régulière (petits pas) plutôt qu’un gros rush hebdomadaire.</p>
                        </div>
                    </section>
                </div>

                {/* Colonne droite sticky */}
                <aside className="space-y-6 lg:sticky lg:top-24 lg:h-max">
                    <section className="rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm">
                        <header className="mb-3">
                            <h3 className="text-base font-semibold">Streak & Badges</h3>
                            <p className="text-xs text-muted-foreground">Garde le rythme et débloque des récompenses.</p>
                        </header>
                        <StreakHeatmapClient days={14} size={11} />
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge label="Premiers pas" active />
                            <Badge label="7 jours 💫" />
                            <Badge label="30 jours 🔥" />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="text-base font-semibold">Raccourcis</h3>
                        <div className="mt-3 grid gap-2">
                            <QuickLink href="/notes" label="Notes & exports" />
                            <QuickLink href="/library" label="Médiathèque" />
                            <QuickLink href="/help" label="Aide & sécurité" />
                        </div>
                    </section>
                </aside>
            </div>
        </>
    );
}

/* ===== UI atoms ===== */
function Kpi({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-3 border border-white/60">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function KpiSoft({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function QuickLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
            {label}
        </Link>
    );
}

function Badge({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <span
            className={[
                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] ring-1',
                active ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-muted text-foreground/80 ring-border',
            ].join(' ')}
        >
            {label}
        </span>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-brand-300/60 bg-card p-10 text-center backdrop-blur">
            <p className="text-sm text-muted-foreground">Tu n’as pas encore démarré de cours.</p>
            <div className="mt-3">
                <Link
                    href="/programs"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
                >
                    Explorer les cours
                </Link>
            </div>
        </div>
    );
}
