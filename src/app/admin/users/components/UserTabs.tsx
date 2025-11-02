'use client';

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { User as UserIcon, SlidersHorizontal, Shield, CheckCircle2, BarChart3 } from 'lucide-react';

/* ========= Types ========= */
type EnrollmentRowClient = {
    _id: string;
    programTitle: string;
    programSlug: string;
    coverUrl?: string | null;
    level?: 'Basique' | 'Cible' | 'Premium' | null;
    status: 'active' | 'completed' | 'paused';
    unitsCount: number;
    unitsDone: number;
    progressPct: number;
    currentDay?: number | null;
    updatedAt?: string | Date | null;
};

type UserDocLite = {
    _id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
    createdAt?: string | Date | null;
    passwordChangedAt?: string | Date | null;
    limits?: { maxConcurrentPrograms?: number | null; features?: string[] };
};

type StatusBreakdown = { active: number; completed: number; paused: number };

type Stats = {
    enrollCount: number;
    avgPercent: number;
    totalUnitsDone: number;
    practicedDays: number;
    firstStartAt?: string | Date | null;
    dailyPace: number;
    projectedFinish?: string | null;
    status: StatusBreakdown;
};

type Props = {
    user: UserDocLite;
    enrolls: EnrollmentRowClient[];
    stats: Stats;
    LimitsFormSlot: React.ReactNode;
    IdentityExtraSlot?: React.ReactNode;
    PreferencesExtraSlot?: React.ReactNode;
};

/* ========= UI helpers ========= */
const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
const SectionTitle = ({ kicker, title, hint }: { kicker: string; title: string; hint?: string }) => (
    <div className="mb-3">
        <div className="text-[11px] uppercase tracking-wider text-gray-500">{kicker}</div>
        <div className="text-lg md:text-xl font-semibold">{title}</div>
        {hint ? <div className="text-xs text-gray-500 mt-0.5">{hint}</div> : null}
    </div>
);
const Card = ({ children, bleed = false }: { children: React.ReactNode; bleed?: boolean }) => (
    <section className={cls('rounded-2xl border bg-white shadow-sm ring-1 ring-black/5', bleed ? '' : 'p-4 md:p-5', 'border-brand-200')}>{children}</section>
);

/* ========= Micro-charts (SVG) ========= */
function Donut({
    value,
    size = 96,
    stroke = 10,
    label,
    sub,
    gradient = true,
}: {
    value: number;
    size?: number;
    stroke?: number;
    label?: string;
    sub?: string;
    gradient?: boolean;
}) {
    const v = Math.max(0, Math.min(100, value || 0));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (v / 100) * c;
    const rest = c - dash;
    const id = `grad-${Math.round(Math.random() * 1e6)}`;
    return (
        <div className="flex items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
                {gradient && (
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="rgb(245 158 11)" />
                            <stop offset="100%" stopColor="rgb(124 58 237)" />
                        </linearGradient>
                    </defs>
                )}
                <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(228 228 231)" strokeWidth={stroke} fill="none" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={gradient ? `url(#${id})` : 'rgb(67 56 202)'}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${dash} ${rest}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-zinc-900 text-[14px] font-semibold">
                    {Math.round(v)}%
                </text>
            </svg>
            {(label || sub) && (
                <div className="min-w-0">
                    {label && <div className="text-sm font-medium">{label}</div>}
                    {sub && <div className="text-xs text-zinc-500">{sub}</div>}
                </div>
            )}
        </div>
    );
}

function Bar({ label, value, max, tone = 'from-violet-600 to-amber-500' }: { label: string; value: number; max: number; tone?: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-600">{label}</span>
                <span className="tabular-nums text-zinc-700">{value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div className={cls('h-full bg-gradient-to-r', tone)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ========= Component ========= */
export default function UserTabs({ user, enrolls, stats, LimitsFormSlot, IdentityExtraSlot, PreferencesExtraSlot }: Props) {
    type TabKey = 'identite' | 'preferences' | 'limites' | 'inscriptions' | 'stats';
    const tabs: { id: TabKey; label: string; Icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
        { id: 'identite', label: 'Identité', Icon: UserIcon },
        { id: 'preferences', label: 'Préférences', Icon: SlidersHorizontal },
        { id: 'limites', label: 'Limites & sécurité', Icon: Shield },
        { id: 'inscriptions', label: 'Inscriptions', Icon: CheckCircle2, badge: enrolls.length },
        { id: 'stats', label: 'Statistiques', Icon: BarChart3 },
    ];

    const [tab, setTab] = useState<TabKey>('identite');

    /* ---- Animated indicator under active tab ---- */
    const barRef = useRef<HTMLDivElement | null>(null);
    const btnRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
        identite: null,
        preferences: null,
        limites: null,
        inscriptions: null,
        stats: null,
    });

    const moveBar = () => {
        const el = btnRefs.current[tab];
        const bar = barRef.current;
        if (!el || !bar) return;
        const parent = el.parentElement as HTMLElement;
        const parentBox = parent.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        const x = box.left - parentBox.left;
        bar.style.width = `${box.width}px`;
        bar.style.transform = `translateX(${x}px)`;
    };

    useEffect(() => {
        moveBar();
        const ro = new ResizeObserver(() => moveBar());
        const node = btnRefs.current[tab];
        if (node) ro.observe(node);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, enrolls.length]);

    /* ---- Status chips for "Inscriptions" ---- */
    const statusChips = useMemo(
        () => [
            { k: 'active', label: 'Actifs', val: stats.status.active, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
            { k: 'completed', label: 'Terminés', val: stats.status.completed, tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
            { k: 'paused', label: 'En pause', val: stats.status.paused, tone: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
        ],
        [stats]
    );

    return (
        <section className="rounded-3xl border border-brand-200 bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
            {/* ---- Fancy Tabbar (responsive) ---- */}
            <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="px-2 md:px-4 py-2">
                    <div
                        role="tablist"
                        aria-label="Sections du profil"
                        className="relative grid grid-cols-5 gap-1 rounded-xl border border-brand-200 bg-gradient-to-br from-gray-50 to-gray-100 p-1"
                    >
                        {/* indicator */}
                        <div
                            ref={barRef}
                            className="pointer-events-none absolute top-1 left-1 h-[calc(100%-0.5rem)] rounded-lg bg-white shadow ring-1 ring-brand-200 transition-transform duration-300 ease-out"
                            style={{ width: 0, transform: 'translateX(0)' }}
                        />
                        {tabs.map(({ id, label, Icon, badge }) => {
                            const active = tab === id;
                            return (
                                <button
                                    key={id}
                                    ref={(r) => {
                                        btnRefs.current[id] = r;
                                    }}
                                    role="tab"
                                    aria-selected={active}
                                    aria-controls={`panel-${id}`}
                                    id={`tab-${id}`}
                                    onClick={() => setTab(id)}
                                    className={cls(
                                        'relative z-10 flex items-center justify-center gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-2 text-sm transition',
                                        active ? 'text-brand-700' : 'text-gray-700 hover:text-gray-900'
                                    )}
                                    title={label}
                                >
                                    <Icon className={cls('h-4 w-4', active && 'scale-110 transition')} />
                                    {/* Label caché sur mobile */}
                                    <span className="hidden md:inline truncate">{label}</span>
                                    <span className="sr-only md:not-sr-only md:hidden">{label}</span>
                                    {typeof badge === 'number' && (
                                        <span
                                            className={cls(
                                                // badge masqué en mobile → icône seule
                                                'ml-1 hidden md:inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums ring-1',
                                                active ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-gray-600 ring-gray-200'
                                            )}
                                        >
                                            {badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ---- Panels ---- */}
            <div className="p-4 md:p-6 space-y-6">
                {/* ===== Identité ===== */}
                <div role="tabpanel" id="panel-identite" aria-labelledby="tab-identite" hidden={tab !== 'identite'}>
                    <SectionTitle kicker="Profil" title="Identité & Sécurité" hint="Informations de base et statut du compte." />
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <h3 className="text-sm font-semibold mb-3">Identité</h3>
                            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-gray-600">Nom</dt>
                                    <dd className="font-medium">{user.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Email</dt>
                                    <dd className="font-medium">{user.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Thème</dt>
                                    <dd className="font-medium">{user.theme ?? 'system'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-600">Créé</dt>
                                    <dd className="font-medium">{toFr(user.createdAt)}</dd>
                                </div>
                            </dl>
                        </Card>

                        <Card>
                            <h3 className="text-sm font-semibold mb-3">Sécurité</h3>
                            <div className="text-sm">
                                Mot de passe modifié : <strong>{toFr(user.passwordChangedAt)}</strong>
                            </div>
                            {user.limits?.features && user.limits.features.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-xs text-gray-600 mb-1">Features activées</div>
                                    <div className="flex flex-wrap gap-1">
                                        {user.limits.features.map((f) => (
                                            <span key={f} className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                    {IdentityExtraSlot && React.Children.toArray(IdentityExtraSlot)}
                </div>

                {/* ===== Préférences ===== */}
                <div role="tabpanel" id="panel-preferences" aria-labelledby="tab-preferences" hidden={tab !== 'preferences'}>
                    <SectionTitle kicker="Communication" title="Préférences utilisateur" hint="Notifications, marketing et mises à jour." />
                    <Card>
                        <ul className="text-sm space-y-1">
                            <li>
                                Marketing : <strong>{user.marketing ? 'oui' : 'non'}</strong>
                            </li>
                            <li>
                                Mises à jour produit : <strong>{user.productUpdates ? 'oui' : 'non'}</strong>
                            </li>
                        </ul>
                    </Card>
                    {PreferencesExtraSlot && React.Children.toArray(PreferencesExtraSlot)}
                </div>

                {/* ===== Limites ===== */}
                <div role="tabpanel" id="panel-limites" aria-labelledby="tab-limites" hidden={tab !== 'limites'}>
                    <SectionTitle kicker="Accès & quotas" title="Limites & sécurité" hint="Quotas d’usage et flags de fonctionnalités." />
                    {LimitsFormSlot && React.Children.toArray(LimitsFormSlot)}
                </div>

                {/* ===== Inscriptions ===== */}
                <div role="tabpanel" id="panel-inscriptions" aria-labelledby="tab-inscriptions" hidden={tab !== 'inscriptions'}>
                    <SectionTitle kicker="Parcours" title="Inscriptions & progression" hint="État des programmes suivis par l’utilisateur." />
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">{enrolls.length} cours</div>
                        {/* chips totalement cachées en mobile (icône seule sur la tabbar) */}
                        <div className="hidden md:flex flex-wrap gap-2">
                            {statusChips.map((c) => (
                                <span key={c.k} className={`rounded-full px-2 py-0.5 text-xs ring-1 ${c.tone}`}>
                                    {c.label}: {c.val}
                                </span>
                            ))}
                        </div>
                    </div>

                    {enrolls.length === 0 ? (
                        <Card>
                            <div className="text-sm text-gray-600">Aucune inscription.</div>
                        </Card>
                    ) : (
                        <Card bleed>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="text-left text-xs text-muted-foreground">
                                        <tr className="border-b">
                                            <th className="py-2 pr-3 font-medium">Programme</th>
                                            <th className="py-2 pr-3 font-medium">Niveau</th>
                                            <th className="py-2 pr-3 font-medium">Statut</th>
                                            <th className="py-2 pr-3 font-medium">Progression</th>
                                            <th className="py-2 pr-3 font-medium">Jour</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrolls.map((e) => (
                                            <tr key={e._id} className="border-b last:border-0">
                                                <td className="py-3 pr-3 max-w-[360px]">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 bg-zinc-100">
                                                            {e.coverUrl ? (
                                                                <Image src={e.coverUrl} alt={e.programTitle} fill sizes="32px" className="object-cover" unoptimized />
                                                            ) : (
                                                                <div className="grid h-full w-full place-items-center text-[10px] text-zinc-400">—</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium">{e.programTitle}</div>
                                                            <div className="text-xs text-muted-foreground truncate">{e.programSlug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3 whitespace-nowrap">{e.level ?? '—'}</td>
                                                <td className="py-3 pr-3 whitespace-nowrap capitalize">{e.status}</td>
                                                <td className="py-3 pr-3 w-56">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-2 w-40 overflow-hidden rounded-full bg-muted"
                                                            role="progressbar"
                                                            aria-valuenow={e.progressPct}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                        >
                                                            <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500" style={{ width: `${e.progressPct}%` }} />
                                                        </div>
                                                        {/* chiffres masqués en mobile, visibles à partir de md */}
                                                        <div className="hidden md:block tabular-nums text-xs text-muted-foreground">
                                                            {e.unitsDone}/{e.unitsCount} • {e.progressPct}%
                                                        </div>
                                                        {/* accessibilité mobile */}
                                                        <span className="sr-only">
                                                            Progression {e.unitsDone} sur {e.unitsCount} soit {e.progressPct} pourcents
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3 whitespace-nowrap">{typeof e.currentDay === 'number' ? e.currentDay : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                {/* ===== Statistiques (visuelles) ===== */}
                <div role="tabpanel" id="panel-stats" aria-labelledby="tab-stats" hidden={tab !== 'stats'}>
                    <SectionTitle kicker="Analyse" title="Statistiques visuelles" hint="Lecture rapide via donuts et barres." />

                    {/* Ligne 1 : Donut principal + mini-sections */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Card>
                            <Donut value={stats.avgPercent} label="Progression moyenne" sub={`${stats.avgPercent}% sur l’ensemble`} />
                        </Card>

                        <Card>
                            <div className="text-sm">
                                <div className="mb-3 font-medium">Vitesse & projection</div>
                                <div className="grid gap-3 lg:grid-cols-2 mt-3">
                                    <div>
                                        <div className="text-[11px] text-zinc-500">Rythme moyen</div>
                                        <div className="text-lg font-semibold">{round1(stats.dailyPace)} u/j</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-zinc-500">Fin estimée</div>
                                        <div className="text-lg font-semibold">{stats.projectedFinish ? toDate(stats.projectedFinish) : '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Ligne 2 : Répartition par statut + top programmes */}
                    <div className="grid gap-3 lg:grid-cols-2 mt-3">
                        <Card>
                            <div className="mb-3 font-medium">Répartition des statuts</div>
                            <div className="space-y-3">
                                <Bar label="Actifs" value={stats.status.active} max={Math.max(1, stats.enrollCount)} tone="from-emerald-600 to-emerald-400" />
                                <Bar label="Terminés" value={stats.status.completed} max={Math.max(1, stats.enrollCount)} tone="from-amber-600 to-amber-400" />
                                <Bar label="En pause" value={stats.status.paused} max={Math.max(1, stats.enrollCount)} tone="from-zinc-700 to-zinc-400" />
                            </div>
                        </Card>

                        {enrolls.length > 0 && (
                            <Card>
                                <h4 className="font-medium mb-2">Top programmes (avancement)</h4>
                                <ul className="space-y-2">
                                    {enrolls
                                        .slice()
                                        .sort((a, b) => b.progressPct - a.progressPct)
                                        .slice(0, 5)
                                        .map((e) => (
                                            <li key={e._id} className="flex items-center gap-3">
                                                <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-zinc-100 ring-1 ring-black/5">
                                                    {e.coverUrl ? (
                                                        <Image src={e.coverUrl} alt={e.programTitle} fill sizes="32px" className="object-cover" unoptimized />
                                                    ) : (
                                                        <div className="grid h-full w-full place-items-center text-[10px] text-zinc-400">—</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">{e.programTitle}</div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-1">
                                                        <div className="h-full bg-gradient-to-r from-violet-600 to-amber-500" style={{ width: `${e.progressPct}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-xs tabular-nums text-muted-foreground w-14 text-right">{e.progressPct}%</div>
                                            </li>
                                        ))}
                                </ul>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ===== Atoms/helpers ===== */
function toFr(d?: string | Date | null) {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(+dt) ? '—' : dt.toLocaleString('fr-FR');
}
function toDate(d?: string | Date | null) {
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(+dt) ? '—' : dt.toLocaleDateString('fr-FR');
}
function round1(n: number) {
    return Math.round(n * 10) / 10;
}
