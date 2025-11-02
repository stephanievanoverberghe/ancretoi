// src/app/admin/users/users-client.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Crown, ChevronDown, Eye, Mail, LayoutGrid, Table as TableIcon } from 'lucide-react';

/* ================== Types UI (inchangés côté données) ================== */
export type UiUser = {
    _id: string;
    name: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAtIso: string;
    avatarUrl: string | null;
    isSelf: boolean;
    isArchived: boolean;
    isSuspended: boolean;
};

export type UiEnrollment = {
    // champs réellement renvoyés par actions.ts
    programSlug: string;
    programTitle: string;
    coverUrl: string | null;
    level: 'Basique' | 'Cible' | 'Premium' | null;
    status: 'active' | 'completed' | 'paused';
    startedAtIso: string | null;
    updatedAtIso: string | null;
    progressPct: number | null;
    currentDay: number | null;
    unitsCount: number | null;

    // optionnels (compat future / anciens imports)
    _id?: string;
    programId?: string;
    finishedAtIso?: string | null;
};

export type UiUserDetail = UiUser & {
    enrollments: UiEnrollment[];
    // si tu affiches d’autres champs (theme, marketing…) tu peux les typer ici aussi:
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
    passwordChangedAtIso?: string | null;
    limits?: {
        maxConcurrentPrograms: number | null;
        features: string[];
    };
};

type RoleFilter = 'all' | 'admin' | 'user';
type StatusFilter = 'all' | 'active' | 'archived' | 'suspended';
type SortKey = 'recent' | 'alpha';
type ViewMode = 'cards' | 'table';

type Props = { users: UiUser[] };

/* ================== Utils ================== */
function formatRelative(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = 60 * 1000,
        hr = 60 * min,
        day = 24 * hr;
    if (diff < hr) return `${Math.max(1, Math.round(diff / min))} min`;
    if (diff < day) return `${Math.round(diff / hr)} h`;
    return d.toLocaleDateString('fr-FR');
}

function RoleBadge({ role }: { role: 'user' | 'admin' }) {
    const cls = role === 'admin' ? 'bg-amber-100 text-amber-800 ring-amber-200' : 'bg-zinc-100 text-zinc-800 ring-zinc-200';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${cls}`}>{role}</span>;
}

function StateBadges({ archived, suspended }: { archived?: boolean; suspended?: boolean }) {
    return (
        <div className="flex items-center gap-1">
            {suspended && <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 ring-amber-200 px-2 py-0.5 text-[11px]">suspendu</span>}
            {archived && <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-800 ring-zinc-200 px-2 py-0.5 text-[11px]">archivé</span>}
        </div>
    );
}

const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/* ================== GRID & TABLE (switchable) ================== */
const LS_KEY = 'adminUsersToolbar:v3';
type Persisted = { q: string; role: RoleFilter; status: StatusFilter; sort: SortKey; view: ViewMode };

export default function AdminUsersClient({ users }: Props) {
    /* ----- Recherche avec debounce + raccourci '/' + persistance ----- */
    const [qRaw, setQRaw] = useState('');
    const [q, setQ] = useState('');
    useEffect(() => {
        const id = setTimeout(() => setQ(qRaw.trim().toLowerCase()), 220);
        return () => clearTimeout(id);
    }, [qRaw]);

    const searchRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* ----- Filtres + tri + vue ----- */
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');
    const [view, setView] = useState<ViewMode>('cards');

    /* ----- Persistance LS ----- */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<Persisted>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setRoleFilter((s.role as RoleFilter) ?? 'all');
            setStatusFilter((s.status as StatusFilter) ?? 'all');
            setSort((s.sort as SortKey) ?? 'recent');
            setView((s.view as ViewMode) ?? 'cards');
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: Persisted = { q, role: roleFilter, status: statusFilter, sort, view };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, roleFilter, statusFilter, sort, view]);

    // Raccourci clavier pour basculer la vue
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                setView((v) => (v === 'cards' ? 'table' : 'cards'));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* ----- Stats pour libellés ----- */
    const stats = useMemo(() => {
        const total = users.length;
        const admins = users.filter((u) => u.role === 'admin').length;
        const usersCount = total - admins;
        const active = users.filter((u) => !u.isArchived && !u.isSuspended).length;
        const archived = users.filter((u) => !!u.isArchived).length;
        const suspended = users.filter((u) => !!u.isSuspended).length;
        return { total, admins, usersCount, active, archived, suspended };
    }, [users]);

    /* ----- Data filtrée + tri ----- */
    const filtered = useMemo(() => {
        let list = users.slice();

        if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
        if (statusFilter !== 'all') {
            list = list.filter((u) => {
                if (statusFilter === 'active') return !u.isArchived && !u.isSuspended;
                if (statusFilter === 'archived') return !!u.isArchived;
                if (statusFilter === 'suspended') return !!u.isSuspended;
                return true;
            });
        }
        if (q) list = list.filter((u) => `${u.name || ''} ${u.email}`.toLowerCase().includes(q));

        if (sort === 'alpha') {
            list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'fr', { sensitivity: 'base' }));
        } else {
            list.sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());
        }
        return list;
    }, [users, q, roleFilter, statusFilter, sort]);

    return (
        <>
            {/* ===== Toolbar STICKY ===== */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/85 to-white/40 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200">
                {/* Recherche */}
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, nom, email)…"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-11 pr-11 py-2.5 text-[15px] shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher un utilisateur"
                    />
                    {qRaw && (
                        <button
                            aria-label="Effacer la recherche"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                            onClick={() => {
                                setQRaw('');
                                setQ('');
                            }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filtres + Tri + Vue */}
                <div className="grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto_auto] mb-2">
                    {/* Filtrer par rôle */}
                    <div className="relative">
                        <label htmlFor="users-role" className="sr-only">
                            Filtrer par rôle
                        </label>
                        <select
                            id="users-role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="all">Tous les rôles ({stats.total})</option>
                            <option value="admin">Admins ({stats.admins})</option>
                            <option value="user">Users ({stats.usersCount})</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Filtrer par état */}
                    <div className="relative">
                        <label htmlFor="users-status" className="sr-only">
                            Filtrer par état
                        </label>
                        <select
                            id="users-status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="all">Tous les états ({stats.total})</option>
                            <option value="active">Actifs ({stats.active})</option>
                            <option value="archived">Archivés ({stats.archived})</option>
                            <option value="suspended">Suspendus ({stats.suspended})</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tri */}
                    <div className="relative">
                        <label htmlFor="users-sort" className="sr-only">
                            Trier
                        </label>
                        <select
                            id="users-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="recent">Récents</option>
                            <option value="alpha">A → Z</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Switch Vue (prend tout l'espace restant ≥ lg, même hauteur) */}
                    <div className="flex items-stretch">
                        <div
                            role="tablist"
                            aria-label="Mode d’affichage"
                            className={cls('inline-flex h-[42px] w-full items-center rounded-full border border-brand-300 bg-white p-1 shadow-sm')}
                        >
                            <button
                                role="tab"
                                aria-selected={view === 'cards'}
                                onClick={() => setView('cards')}
                                className={cls(
                                    'flex h-full w-full items-center justify-center gap-1 rounded-full px-3 text-sm',
                                    'lg:flex-1',
                                    view === 'cards' ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200' : 'text-gray-700 hover:bg-gray-50'
                                )}
                                title="Vue cartes (V)"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>Cartes</span>
                            </button>

                            <button
                                role="tab"
                                aria-selected={view === 'table'}
                                onClick={() => setView('table')}
                                className={cls(
                                    'ml-1 flex h-full w-full items-center justify-center gap-1 rounded-full px-3 text-sm',
                                    'lg:flex-1',
                                    view === 'table' ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200' : 'text-gray-700 hover:bg-gray-50'
                                )}
                                title="Vue tableau (V)"
                            >
                                <TableIcon className="h-4 w-4" />
                                <span>Tableau</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistiques (desktop) */}
                <div className="hidden xl:block text-xs text-muted-foreground text-right pr-2 py-2.5">
                    <span className="font-medium">{stats.total}</span> utilisateurs • {stats.admins} admin • {stats.active} actifs
                </div>
            </section>

            {/* ===== RÉSULTATS ===== */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucun utilisateur ne correspond.</p>
                </div>
            ) : view === 'cards' ? (
                <CardsView users={filtered} />
            ) : (
                <TableView users={filtered} />
            )}
        </>
    );
}

/* ================== VUE CARTES ================== */
function CardsView({ users }: { users: UiUser[] }) {
    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
                <li key={u._id} className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[5/4] w-full bg-gray-100 sm:aspect-[16/9] lg:aspect-[21/9]">
                        {u.avatarUrl ? (
                            <Image
                                src={u.avatarUrl}
                                alt={u.name || u.email}
                                fill
                                className="object-cover"
                                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                priority={false}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">Aucune image</div>
                        )}

                        {/* Badges */}
                        <div className="absolute right-3 top-3 flex items-center gap-1">
                            <RoleBadge role={u.role} />
                            <StateBadges archived={u.isArchived} suspended={u.isSuspended} />
                            {u.role === 'admin' && (
                                <span className="rounded-full bg-amber-500/90 p-1 text-white ring-1 ring-amber-200">
                                    <Crown className="h-4 w-4" />
                                </span>
                            )}
                        </div>

                        <div className="absolute left-3 bottom-3 rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">inscrit {formatRelative(u.createdAtIso)}</div>
                    </div>

                    <div className="p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{u.email}</span>
                        </div>
                        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-semibold sm:text-base">
                            {u.name || u.email}
                            {u.isSelf && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800 ring-1 ring-brand-300">toi</span>}
                        </h3>

                        <div className="mt-3 grid grid-cols-1">
                            <Link
                                href={`/admin/users/${u._id}`}
                                aria-label={`Voir le profil et les actions pour ${u.name || u.email}`}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100"
                                title="Voir / actions"
                            >
                                <Eye className="h-4 w-4" /> Voir / actions
                            </Link>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ================== VUE TABLEAU ================== */
function TableView({ users }: { users: UiUser[] }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-brand-200 bg-white ring-1 ring-black/5">
            <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th className="px-3 py-2 font-medium">Utilisateur</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Rôle</th>
                        <th className="px-3 py-2 font-medium">Créé</th>
                        <th className="px-3 py-2 font-medium">Statut</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u._id} className="border-b last:border-0">
                            <td className="px-3 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-black/5 bg-zinc-100 shrink-0">
                                        {u.avatarUrl ? (
                                            <Image src={u.avatarUrl} alt={u.email} fill className="object-cover" sizes="36px" />
                                        ) : (
                                            <div className="grid h-full w-full place-items-center text-[10px] text-zinc-400">—</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{u.name || u.email}</div>
                                    </div>
                                    {u.isSelf && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800 ring-1 ring-brand-300 shrink-0">toi</span>}
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">{u.email}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                <RoleBadge role={u.role} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(u.createdAtIso).toLocaleDateString('fr-FR')}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center flex-wrap gap-1">
                                    {u.isArchived && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] ring-1 ring-zinc-200">archivé</span>}
                                    {u.isSuspended && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] ring-1 ring-amber-200 text-amber-900">suspendu</span>}
                                    {!u.isArchived && !u.isSuspended && (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] ring-1 ring-emerald-200 text-emerald-700">actif</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                <Link
                                    href={`/admin/users/${u._id}`}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-zinc-200 hover:bg-zinc-50 cursor-pointer"
                                    title="Voir / actions"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline">Voir</span>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
