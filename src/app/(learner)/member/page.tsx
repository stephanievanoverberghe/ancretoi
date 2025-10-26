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

/** Affiche un prénom robuste… */
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
    const pad2 = (n: number) => String(n).padStart(2, '0');

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

    const resume = rows.find((r) => r.status === 'active') ?? rows[0] ?? null;

    return (
        <div className="space-y-6">
            {/* HERO tendance */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_1px_0_#ffffff66,0_10px_30px_-10px_rgba(129,95,178,.25)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Bonjour {displayName}</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">Un seul pas aujourd’hui.</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Reprends là où tu t’es arrêté — tout est prêt.</p>
                    </div>
                    {resume ? (
                        <Link href={resume.unitsDone === 0 ? `/learn/${resume.programSlug}/day/${pad2(1)}` : '/continue'} className="btn w-full sm:w-auto">
                            {resume.unitsDone === 0 ? 'Commencer' : 'Continuer'}
                        </Link>
                    ) : (
                        <Link href="/programs" className="btn w-full sm:w-auto">
                            Explorer
                        </Link>
                    )}
                </div>

                {/* mini progression si on a un cours */}
                {resume && (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">{resume.programSlug}</div>
                            <div className="truncate text-base font-medium text-foreground">{resume.title}</div>
                        </div>
                        <div className="w-full sm:w-80">
                            <div
                                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={resume.percent}
                            >
                                <div className="h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${resume.percent}%` }} />
                            </div>
                            <div className="mt-1 text-right text-xs text-muted-foreground">
                                {resume.unitsDone}/{resume.unitsTotal} — {resume.percent}%
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Raccourcis */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <QuickCard href="/notes" title="Notes" subtitle="Journal & exports" />
                <QuickCard href="/library" title="Ressources" subtitle="Audios, PDFs, templates" />
                <QuickCard href="/help" title="Aide" subtitle="Sécurité, support, FAQ" />
            </section>

            {/* Liste de tes cours */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Mes cours</h2>
                    {rows.length > 0 && (
                        <Link href="/continue" className="text-sm font-medium text-brand-700 hover:underline">
                            Reprendre →
                        </Link>
                    )}
                </div>

                {rows.length === 0 ? (
                    <EmptyState />
                ) : (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((r) => (
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
                                </div>

                                <div className="p-4">
                                    <div className="text-xs text-muted-foreground">{r.programSlug}</div>
                                    <h3 className="line-clamp-2 text-base font-semibold sm:text-lg text-foreground">{r.title}</h3>

                                    <div
                                        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={r.percent}
                                    >
                                        <div className="h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${r.percent}%` }} />
                                    </div>
                                    <div className="mt-1 text-right text-xs text-muted-foreground">
                                        {r.unitsDone}/{r.unitsTotal} — {r.percent}%
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Link
                                            href={r.unitsDone === 0 ? `/learn/${r.programSlug}/intro` : '/continue'}
                                            className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100"
                                        >
                                            {r.unitsDone === 0 ? 'Commencer' : 'Continuer'}
                                        </Link>

                                        <Link
                                            href={`/learn/${r.programSlug}`}
                                            className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
                                        >
                                            Détails
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

/* ---------- petits composants dans le même fichier pour simplifier ---------- */
function QuickCard({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
    return (
        <Link
            href={href}
            className="group block overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
            <div className="mt-3 h-7 w-24 rounded-full bg-gradient-to-r from-brand-500/30 to-secondary-500/30 opacity-70 transition group-hover:opacity-100" />
        </Link>
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
