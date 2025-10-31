// src/app/member/summary/page.tsx
import 'server-only';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';

import ProgressDonutClient from '../components/ProgressDonutClient';
import StreakHeatmapClient from '../components/StreakHeatmapClient';
import SummaryBarsClient from './SummaryBarsClient';

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

export default async function MemberSummaryPage() {
    await dbConnect();
    const user = await requireUser('/member/summary');

    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: unknown; name?: string | null }>();

    if (!userDoc?._id) redirect('/login?next=/member/summary');

    const userId = String(userDoc._id);

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
            status: e.status,
            updatedAtIso: e.updatedAt ? e.updatedAt.toISOString() : null,
        };
    });

    const avgPercent = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0;
    const totalUnitsDone = rows.reduce((s, r) => s + r.unitsDone, 0);
    const lastActivityIso = enrollments[0]?.updatedAt ? enrollments[0].updatedAt.toISOString() : null;

    return (
        <>
            {/* Header */}
            <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 ring-1 ring-black/5 p-5 md:p-6 backdrop-blur">
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_80%_0%,#000_15%,transparent_75%)]">
                    <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
                </div>
                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Bilan d’apprentissage</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Vue consolidée de tes cours, progression et rythme.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Link href="/member" className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm hover:bg-white">
                                Retour à l’espace membre
                            </Link>
                            <Link href="/programs" className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm hover:bg-white">
                                Explorer les cours
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 ring-1 ring-black/5 shadow-sm">
                        <div className="text-sm font-medium text-center">Progression moyenne</div>
                        <div className="mt-2 grid place-items-center">
                            <ProgressDonutClient percent={avgPercent} size={164} stroke={12} label={`${avgPercent}%`} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats rapides */}
            <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi label="Cours suivis" value={rows.length} />
                <Kpi label="Unités complétées" value={totalUnitsDone} />
                <Kpi label="Dernière activité" value={lastActivityIso ? new Date(lastActivityIso).toLocaleDateString('fr-FR') : '—'} />
                <Kpi label="Moyenne" value={`${avgPercent}%`} />
            </section>

            {/* Graphiques */}
            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    {/* Barres par programme */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">Progression par programme</h2>
                            {rows.length > 0 && <span className="text-xs text-muted-foreground">{rows.length} programme(s)</span>}
                        </div>
                        <div className="mt-4">
                            <SummaryBarsClient items={rows.map((r) => ({ slug: r.programSlug, title: r.title, percent: r.percent }))} />
                        </div>
                    </div>

                    {/* Tableau détaillé */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="text-lg font-semibold">Détail</h2>
                        <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-muted/40">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Programme</th>
                                        <th className="px-3 py-2 text-left">Niveau</th>
                                        <th className="px-3 py-2 text-left">Progression</th>
                                        <th className="px-3 py-2 text-left">Dernière activité</th>
                                        <th className="px-3 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/70">
                                    {rows.map((r) => (
                                        <tr key={r.programSlug} className="border-t border-border/60">
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{r.title}</div>
                                                <div className="text-[11px] text-muted-foreground">{r.programSlug}</div>
                                            </td>
                                            <td className="px-3 py-2">{r.level ?? '—'}</td>
                                            <td className="px-3 py-2">
                                                <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full bg-brand-600" style={{ width: `${r.percent}%` }} />
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {r.percent}% ({r.unitsDone}/{r.unitsTotal})
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{r.updatedAtIso ? new Date(r.updatedAtIso).toLocaleString('fr-FR') : '—'}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={r.unitsDone === 0 ? `/learn/${r.programSlug}/intro` : '/continue'}
                                                        className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-border hover:bg-muted"
                                                    >
                                                        {r.unitsDone === 0 ? 'Commencer' : 'Continuer'}
                                                    </Link>
                                                    <Link
                                                        href={`/programs/${encodeURIComponent(r.programSlug)}`}
                                                        className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-border hover:bg-muted"
                                                    >
                                                        Voir
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                                                Aucun programme suivi pour l’instant.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Aside */}
                <aside className="space-y-6 lg:sticky lg:top-24 lg:h-max">
                    <div className="rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm">
                        <h3 className="text-base font-semibold">Assiduité (90 jours)</h3>
                        <p className="text-xs text-muted-foreground">Un point = un jour, plus c’est foncé, plus tu as été active.</p>
                        <div className="mt-3">
                            <StreakHeatmapClient days={90} size={10} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="text-base font-semibold">Export & partages</h3>
                        <div className="mt-3 grid gap-2">
                            <Link href="/api/settings/export" className="rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-muted">
                                Télécharger le JSON
                            </Link>
                            <Link href="/member" className="rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-muted">
                                Retour à l’espace membre
                            </Link>
                        </div>
                    </div>
                </aside>
            </section>
        </>
    );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-3 border border-white/60">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
        </div>
    );
}
