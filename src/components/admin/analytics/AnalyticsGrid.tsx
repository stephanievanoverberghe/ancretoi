'use client';

import type { AdminAnalytics } from '@/lib/analytics.server';
import Sparkline from '@/components/admin/charts/Sparkline';
import Link from 'next/link';

function Delta({ arr }: { arr: number[] }) {
    if (arr.length < 2) return null;
    const last = arr[arr.length - 1]!;
    const prev = arr[arr.length - 2]!;
    const diff = last - prev;
    const up = diff >= 0;
    return (
        <span
            className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ring-1',
                up ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-800 ring-red-200',
            ].join(' ')}
        >
            {up ? '▲' : '▼'} {Math.abs(diff)}
        </span>
    );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <ul className="space-y-2">
            {items.map((it) => (
                <li key={it.label}>
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="truncate">{it.label}</span>
                        <span className="tabular-nums text-secondary-800">{it.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-brand-50 ring-1 ring-brand-100/60">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-300 via-brand-500 to-gold-400"
                            style={{ width: `${Math.max(10, Math.round((it.value / max) * 100))}%` }}
                            aria-hidden
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function AnalyticsGrid({ data }: { data: AdminAnalytics }) {
    const nwVals = data.newsletterWeekly.map((p) => p.value);
    const umVals = data.usersMonthly.map((p) => p.value);
    const pmVals = data.postsMonthly.map((p) => p.value);
    const imVals = data.inspMonthly.map((p) => p.value);

    return (
        <section aria-labelledby="analytics-title" className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 id="analytics-title" className="text-lg font-semibold">
                    Analytics
                </h2>
                <span className="text-xs text-muted-foreground">Vue rapide (Mongo)</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Newsletter weekly */}
                <div className="rounded-2xl border border-brand-200 bg-white/80 p-4 ring-1 ring-white/40 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Newsletter • 12 semaines</div>
                            <div className="mt-0.5 text-2xl font-semibold">{nwVals.at(-1) ?? 0}</div>
                        </div>
                        <Delta arr={nwVals} />
                    </div>
                    <div className="mt-3">
                        <Sparkline points={data.newsletterWeekly} ariaLabel="Newsletter par semaine" />
                    </div>
                    <div className="mt-2 flex gap-2">
                        <Link href="/admin/newsletter" className="text-sm text-brand-700 hover:underline">
                            Voir les contacts →
                        </Link>
                    </div>
                </div>

                {/* Users monthly */}
                <div className="rounded-2xl border border-brand-200 bg-white/80 p-4 ring-1 ring-white/40 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Nouveaux utilisateurs • 6 mois</div>
                            <div className="mt-0.5 text-2xl font-semibold">{umVals.at(-1) ?? 0}</div>
                        </div>
                        <Delta arr={umVals} />
                    </div>
                    <div className="mt-3">
                        <Sparkline points={data.usersMonthly} ariaLabel="Utilisateurs par mois" />
                    </div>
                    <div className="mt-2 flex gap-2">
                        <Link href="/admin/users" className="text-sm text-brand-700 hover:underline">
                            Voir les users →
                        </Link>
                    </div>
                </div>

                {/* Publications monthly (posts & insp) */}
                <div className="rounded-2xl border border-brand-200 bg-white/80 p-4 ring-1 ring-white/40 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Publications • 6 mois</div>
                            <div className="mt-0.5 text-2xl font-semibold">{(pmVals.at(-1) ?? 0) + (imVals.at(-1) ?? 0)}</div>
                        </div>
                    </div>
                    <div className="mt-2 grid gap-2">
                        <div>
                            <div className="flex items-center justify-between text-xs">
                                <span>Articles</span>
                                <span className="tabular-nums">{pmVals.at(-1) ?? 0}</span>
                            </div>
                            <Sparkline points={data.postsMonthly} showFill={false} ariaLabel="Articles par mois" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs">
                                <span>Inspirations</span>
                                <span className="tabular-nums">{imVals.at(-1) ?? 0}</span>
                            </div>
                            <Sparkline points={data.inspMonthly} showFill={false} ariaLabel="Inspirations par mois" />
                        </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <Link href="/admin/blog" className="text-brand-700 hover:underline">
                            Gérer articles →
                        </Link>
                        <Link href="/admin/inspirations" className="text-brand-700 hover:underline">
                            Gérer inspirations →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Top sources */}
            <div className="rounded-2xl border border-brand-200 bg-white/80 p-4 ring-1 ring-white/40 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Acquisition — top sources</h3>
                    <Link href="/admin/newsletter" className="text-sm text-brand-700 hover:underline">
                        Détails →
                    </Link>
                </div>
                <div className="mt-3">
                    <BarList items={data.topNewsletterSources} />
                </div>
            </div>
        </section>
    );
}
