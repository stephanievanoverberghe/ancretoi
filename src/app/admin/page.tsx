// src/app/admin/page.tsx
import 'server-only';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { PostModel, InspirationModel, UserModel } from '@/db/schemas';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';
import { Boxes, Newspaper, Video, Users, ArrowRight } from 'lucide-react';

import { getAdminAnalytics } from '@/lib/analytics.server';
import AnalyticsGrid from '@/components/admin/analytics/AnalyticsGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type NewsletterRow = Pick<NewsletterDoc, 'email' | 'status' | 'createdAt' | 'source'> & { _id: unknown };

export default async function AdminHome() {
    await requireAdmin();
    await dbConnect();

    const [programsCount, posts, videos, users, nlTotal, nlConfirmed, nlPending, nlUnsub, latest, analytics] = await Promise.all([
        ProgramPage.countDocuments(),
        PostModel.countDocuments({ status: 'published' }),
        InspirationModel.countDocuments({ status: 'published' }),
        UserModel.countDocuments({ deletedAt: null }),
        Newsletter.countDocuments({}),
        Newsletter.countDocuments({ status: 'confirmed' as const }),
        Newsletter.countDocuments({ status: 'pending' as const }),
        Newsletter.countDocuments({ status: 'unsubscribed' as const }),
        Newsletter.find().sort({ createdAt: -1 }).limit(6).select({ email: 1, status: 1, createdAt: 1, source: 1 }).lean<NewsletterRow[]>().exec(),
        getAdminAnalytics(),
    ]);

    return (
        <div className="space-y-8 max-w-full overflow-x-hidden">
            {/* Header + actions */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Tableau de bord</h1>
                    <p className="text-sm text-muted-foreground mt-1">Vue d’ensemble des contenus et de l’activité.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-brand-700/40 hover:bg-brand-700"
                    >
                        + Nouveau programme
                    </Link>
                    <Link
                        href="/admin/newsletter"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                    >
                        Ouvrir Newsletter
                    </Link>
                </div>
            </div>

            {/* KPI cliquables */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCardLink href="/admin/programs" icon={<Boxes className="h-5 w-5" />} label="Programmes publiés" value={programsCount} />
                <StatCardLink href="/admin/blog" icon={<Newspaper className="h-5 w-5" />} label="Articles publiés" value={posts} />
                <StatCardLink href="/admin/inspirations" icon={<Video className="h-5 w-5" />} label="Inspirations publiées" value={videos} />
                <StatCardLink href="/admin/users" icon={<Users className="h-5 w-5" />} label="Utilisateurs actifs" value={users} />
            </div>

            {/* Analytics */}
            <AnalyticsGrid data={analytics} />

            {/* Newsletter — chiffres + dernières inscriptions */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Bloc chiffres — Desktop/Tablet */}
                <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm hidden md:block">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Contacts newsletter</div>
                            <div className="mt-1 text-3xl font-semibold tabular-nums">{nlTotal}</div>
                        </div>
                        <Link href="/admin/newsletter" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                            Ouvrir
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniKpi label="Confirmés" value={nlConfirmed} />
                        <MiniKpi label="En attente" value={nlPending} />
                        <MiniKpi label="Désinscrits" value={nlUnsub} />
                        <MiniKpi label="Taux conf." value={`${nlTotal ? Math.round((nlConfirmed / nlTotal) * 100) : 0}%`} />
                    </div>
                </div>

                {/* Bloc chiffres — Mobile compact */}
                <NewsletterCompactCard total={nlTotal} confirmed={nlConfirmed} pending={nlPending} unsub={nlUnsub} />

                {/* Dernières inscriptions */}
                <div className="rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">Dernières inscriptions</h2>
                        <Link href="/admin/newsletter" className="text-sm text-brand-700 hover:underline whitespace-nowrap">
                            Voir tout <ArrowRight className="inline h-4 w-4 align-[-2px]" />
                        </Link>
                    </div>

                    {/* Mobile: cards empilées (zéro débordement) */}
                    <ul className="mt-3 grid gap-2 md:hidden">
                        {latest.length ? (
                            latest.map((r) => (
                                <li key={String(r._id)} className="w-full max-w-full rounded-xl border border-brand-200 bg-white p-3">
                                    {/* Ligne 1 : email (colonne fluide) + badge (colonne fixe) */}
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 min-w-0">
                                        <div className="min-w-0">
                                            {/* email très long : tronqué + césure forcée */}
                                            <div className="font-medium text-[13px] leading-tight truncate break-all">{r.email}</div>
                                        </div>
                                        <span
                                            className={
                                                r.status === 'confirmed'
                                                    ? 'shrink-0 inline-flex items-center rounded-md bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-800 ring-1 ring-gold-200'
                                                    : 'shrink-0 inline-flex items-center rounded-md border border-border px-2 py-0.5 text-[11px]'
                                            }
                                        >
                                            {r.status ?? 'pending'}
                                        </span>
                                    </div>

                                    {/* Ligne 2 : Source à gauche (tronquée) + Date à droite (nowrap) */}
                                    <div className="mt-1 grid grid-cols-[1fr_auto] items-center gap-2 text-[12px] text-muted-foreground">
                                        <span className="min-w-0 truncate">Source&nbsp;: {r.source ?? 'site'}</span>
                                        <span className="whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="rounded-xl border border-brand-200 bg-white/70 p-6 text-center text-muted-foreground text-sm">Aucune inscription récente</li>
                        )}
                    </ul>

                    {/* Desktop: table */}
                    <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-muted/40 hidden md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left">Email</th>
                                    <th className="px-3 py-2 text-left">Statut</th>
                                    <th className="px-3 py-2 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/70">
                                {latest.map((r) => (
                                    <tr key={String(r._id)} className="border-t border-border/60">
                                        <td className="px-3 py-2 break-all">{r.email}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={
                                                    r.status === 'confirmed'
                                                        ? 'inline-flex items-center rounded-md bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-800 ring-1 ring-gold-200'
                                                        : 'inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs'
                                                }
                                            >
                                                {r.status ?? 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</td>
                                    </tr>
                                ))}
                                {!latest.length && (
                                    <tr>
                                        <td className="px-3 py-8 text-center text-muted-foreground" colSpan={4}>
                                            Aucune inscription récente
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Raccourcis */}
            <div className="rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Raccourcis</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/admin/programs" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Gérer les programmes
                    </Link>
                    <Link href="/admin/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Gérer les articles
                    </Link>
                    <Link href="/admin/inspirations" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Gérer les inspirations
                    </Link>
                    <Link href="/admin/users" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Gérer les utilisateurs
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ===== UI atoms ===== */

function StatCardLink({ href, icon, label, value }: { href: string; icon: React.ReactNode; label: string; value: number }) {
    return (
        <Link
            href={href}
            aria-label={`${label} — ouvrir`}
            className={[
                'group relative block overflow-hidden rounded-2xl border border-brand-200 bg-white/85 p-4',
                'ring-1 ring-white/40 shadow-sm transition',
                'hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)] hover:bg-brand-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
            ].join(' ')}
        >
            <div className="relative flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-brand-100 text-brand-700">{icon}</div>
                <div className="ml-auto text-2xl font-semibold tabular-nums">{value}</div>
            </div>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <span>{label}</span>
                {/* pastille à droite en hover/focus */}
                <span
                    aria-hidden
                    className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-gold-300 ring-2 ring-white opacity-0 scale-75 transition group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100"
                />
            </div>
        </Link>
    );
}

function MiniKpi({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-lg border border-border p-3 bg-white/70">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function NewsletterCompactCard({ total, confirmed, pending, unsub }: { total: number; confirmed: number; pending: number; unsub: number }) {
    const rate = total ? Math.round((confirmed / total) * 100) : 0;
    return (
        <div className="md:hidden w-full max-w-full rounded-2xl border border-brand-200 bg-white/80 p-4 ring-1 ring-white/40 shadow-sm">
            <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Contacts newsletter</div>
                    <div className="mt-0.5 text-2xl font-semibold tabular-nums">{total}</div>
                </div>
                <Link href="/admin/newsletter" className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                    Ouvrir
                </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniKpi label="Confirmés" value={confirmed} />
                <MiniKpi label="En attente" value={pending} />
                <MiniKpi label="Désinscrits" value={unsub} />
                <MiniKpi label="Taux conf." value={`${rate}%`} />
            </div>
        </div>
    );
}
