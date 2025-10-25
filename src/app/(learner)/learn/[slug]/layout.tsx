// src/app/(learner)/learn/[slug]/layout.tsx
import 'server-only';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';

type RouteParams = { slug: string };
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function CourseLayout({ children, params }: { children: ReactNode; params: Promise<RouteParams> }) {
    await dbConnect();
    const { slug } = await params;
    const safeSlug = slug.toLowerCase();

    const user = await requireUser(`/learn/${safeSlug}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: unknown; name?: string | null } | null>();
    const userId = String(userDoc?._id ?? '');

    // 📌 Jours publiés uniquement
    const [enr, units] = await Promise.all([
        Enrollment.findOne({ userId, programSlug: safeSlug })
            .select({ status: 1, currentDay: 1 })
            .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>(),
        Unit.find({ programSlug: safeSlug, unitType: 'day', status: 'published' })
            .select({ unitIndex: 1, title: 1, mantra: 1 })
            .sort({ unitIndex: 1 })
            .lean<{ unitIndex: number; title?: string | null; mantra?: string | null }[]>(),
    ]);

    const total = units.length;
    const currentDay = Math.max(1, Math.min(total || 1, enr?.currentDay ?? 1));
    const pad = (n: number) => String(n).padStart(2, '0');

    // Accès séquentiel : jours futurs visibles mais non-cliquables
    const sequential = true;
    const isCompleted = enr?.status === 'completed';

    // Items d’aside : Intro + published days + Conclusion (verrouillée tant que non terminé)
    const items: Array<{
        key: string;
        label: string;
        href: string;
        state: 'done' | 'active' | 'locked';
        sub?: string;
        locked: boolean;
    }> = [
        {
            key: 'intro',
            label: 'Introduction',
            href: `/learn/${safeSlug}/intro`,
            state: enr?.currentDay ? 'done' : 'active',
            sub: undefined,
            locked: false,
        },
        ...units.map((u) => {
            const day = u.unitIndex;
            let state: 'done' | 'active' | 'locked' = 'locked';
            if (isCompleted || day < currentDay) state = 'done';
            else if (day === currentDay) state = 'active';
            const locked = sequential && state === 'locked';
            return {
                key: `day-${day}`,
                label: `Jour ${pad(day)} — ${u.title ?? ''}`,
                href: `/learn/${safeSlug}/day/${pad(day)}`,
                state,
                sub: u.mantra || undefined,
                locked,
            };
        }),
        {
            key: 'conclusion',
            label: 'Conclusion & Bilan',
            href: `/learn/${safeSlug}/conclusion`,
            state: isCompleted ? 'active' : 'locked',
            sub: isCompleted ? 'Exports & suites' : undefined,
            locked: !isCompleted,
        },
    ];

    const doneCount = isCompleted ? total : Math.max(0, currentDay - 1);
    const percent = total ? Math.round((doneCount / total) * 100) : 0;

    const displayName = user.name ?? userDoc?.name ?? '';
    const firstName = displayName ? displayName.split(' ')[0] : 'toi';

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
            {/* ASIDE (desktop) */}
            <aside className="sticky top-6 hidden self-start md:block">
                <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm backdrop-blur">
                    <div className="mb-4">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{safeSlug}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">Salut {firstName} 👋</div>

                        <div className="mt-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                                <div className="h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{isCompleted ? `Terminé (${total})` : `Jour ${Math.min(currentDay, total || 1)}/${total || 1}`}</span>
                                <span>{percent}%</span>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                                href="/continue"
                                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                            >
                                Continuer
                            </Link>
                            <Link
                                href="/notes"
                                className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                            >
                                Notes
                            </Link>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                    {/* Étapes : jours publiés + conclusion */}
                    <ol className="mt-4 space-y-1">
                        {items.map((it) => {
                            // Tons par état (tokens)
                            const tone = it.locked
                                ? 'border-border text-muted-foreground opacity-70'
                                : it.state === 'active'
                                ? 'border-brand-300 bg-brand-50/60 text-brand-800'
                                : it.state === 'done'
                                ? 'border-secondary-200 bg-secondary-50/60 text-secondary-800'
                                : 'border-border text-foreground hover:bg-muted';

                            const dot = it.state === 'active' ? 'bg-brand-600' : it.state === 'done' ? 'bg-secondary-500' : 'bg-muted';

                            // ✅ gabarit 3 colonnes : dot | texte | lock
                            const RowInner = ({ asLink }: { asLink: boolean }) => {
                                const content = (
                                    <div className={['grid grid-cols-[10px_1fr_auto] items-start gap-3 rounded-xl border p-3 text-sm transition', tone].join(' ')}>
                                        <span className={`mt-0.5 inline-block h-2.5 w-2.5 flex-none rounded-full ${dot}`} />
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">{it.label}</span>
                                            {it.sub ? <span className="block truncate text-[11px] text-muted-foreground">{it.sub}</span> : null}
                                        </span>
                                        {/* lock: taille fixe pour toutes les lignes */}
                                        <span className="ml-auto grid h-5 w-5 place-items-center">
                                            {it.locked ? <Lock className="h-4 w-4 text-muted-foreground" aria-hidden /> : <span className="h-4 w-4" aria-hidden />}
                                        </span>
                                    </div>
                                );
                                if (asLink) return <Link href={it.href}>{content}</Link>;
                                return (
                                    <div aria-disabled="true" title="Débloque cette étape en validant la précédente" className="pointer-events-none cursor-not-allowed">
                                        {content}
                                    </div>
                                );
                            };

                            return <li key={it.key}>{it.locked ? <RowInner asLink={false} /> : <RowInner asLink={true} />}</li>;
                        })}
                    </ol>

                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link href="/library" className="rounded-lg px-3 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                            Ressources
                        </Link>
                        <Link href="/help" className="rounded-lg px-3 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                            Aide
                        </Link>
                    </div>
                </div>
            </aside>

            {/* CONTENU (intro / day / conclusion) */}
            <main>{children}</main>
        </div>
    );
}
