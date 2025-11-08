// src/app/admin/blog/new/components/AdminPostsGridClient.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, Lock, X, PencilLine, CalendarClock, CalendarDays, ChevronDown, ImageIcon, ExternalLink } from 'lucide-react';

import DeletePostButton from '@/components/admin/DeletePostButton';

export type AdminPostRow = {
    id: string;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    coverPath: string | null;
    summary: string | null;
    tags: string[];
    category: string | null; // slug (ou ancien nom libre)
    timestamps: {
        createdAt: string | null;
        updatedAt: string | null;
        publishedAt: string | null;
    };
};

export type CategoryOption = {
    slug: string;
    name: string;
    color: string | null;
    icon: string | null;
};

type StatusFilter = 'all' | 'draft' | 'published';
type SortKey = 'recent' | 'alphaAsc' | 'alphaDesc';

type PersistedState = {
    q: string;
    status: StatusFilter;
    sort: SortKey;
    category: string; // '__all__' ou slug
};

const LS_KEY = 'adminPostsToolbar:v4';

function formatRelative(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;
    if (diff < hour) return `${Math.max(1, Math.round(diff / min))} min`;
    if (diff < day) return `${Math.round(diff / hour)} h`;
    return d.toLocaleDateString('fr-FR');
}

function StatusBadge({ s }: { s: 'draft' | 'published' }) {
    const map = s === 'published' ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-amber-100 text-amber-800 ring-amber-200';
    const label = s === 'published' ? 'Publié' : 'Brouillon';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${map}`}>{label}</span>;
}

/* =============== Quick View =============== */
function QuickViewModal({ open, onClose, row, categoryName }: { open: boolean; onClose: () => void; row: AdminPostRow | null; categoryName: string | null }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);
    if (!open || !mounted || !row) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-brand-100">
                    <div className="relative h-48 w-full bg-gray-100">
                        {row.coverPath ? (
                            <Image src={row.coverPath} alt={row.title || 'Couverture'} fill sizes="100vw" className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon className="h-10 w-10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="truncate text-white drop-shadow">
                                <div className="text-xs opacity-90">/{row.slug}</div>
                                <div className="truncate font-semibold text-lg leading-tight">{row.title}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge s={row.status} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-3">
                            <div className="rounded-lg border p-3 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                    <CalendarClock className="h-4 w-4" /> Créé • {formatRelative(row.timestamps.createdAt)}
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
                                    <CalendarDays className="h-4 w-4" /> Publié • {row.timestamps.publishedAt ? formatRelative(row.timestamps.publishedAt) : '—'}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Résumé</div>
                                <p className="rounded-lg border p-3 text-sm">{row.summary || '—'}</p>
                            </div>

                            {row.tags?.length || categoryName ? (
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Taxonomie</div>
                                    {categoryName ? (
                                        <div className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 ring-1 ring-indigo-200">
                                            Catégorie : {categoryName}
                                        </div>
                                    ) : null}
                                    {row.tags?.length ? (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {row.tags.map((t) => (
                                                <span
                                                    key={t}
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200"
                                                >
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Link
                                href={`/admin/blog/posts/${row.slug}`}
                                className="btn-secondary w-full justify-center inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm"
                            >
                                <PencilLine className="h-4 w-4" /> Éditer
                            </Link>

                            {row.status === 'published' ? (
                                <Link
                                    href={`/blog/posts/${row.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Voir la page publique <ExternalLink className="h-4 w-4" />
                                </Link>
                            ) : (
                                <div className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                    <Lock className="h-4 w-4" /> Non publié (page publique indisponible)
                                </div>
                            )}

                            <DeletePostButton slug={row.slug} className="w-full justify-center" afterDelete="refresh" label="Supprimer" />

                            <button
                                onClick={onClose}
                                className="w-full rounded-md px-3 py-1.5 text-sm text-secondary-50 border border-secondary-200 bg-secondary-600 hover:bg-secondary-700 cursor-pointer"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* =============== GRID =============== */
export default function AdminPostsGridClient({ rows, categories }: { rows: AdminPostRow[]; categories: CategoryOption[] }) {
    /* --- Map utilitaire slug->name --- */
    const catNameBySlug = useMemo(() => {
        const m = new Map<string, string>();
        categories.forEach((c) => m.set(c.slug, c.name));
        return m;
    }, [categories]);

    /* --- Recherche (/, debounce, clear) --- */
    const [qRaw, setQRaw] = useState('');
    const [q, setQ] = useState('');
    const searchRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        const id = setTimeout(() => setQ(qRaw), 220);
        return () => clearTimeout(id);
    }, [qRaw]);
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

    /* --- Dropdowns --- */
    const [status, setStatus] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');

    /* --- Catégories (liste DB) --- */
    const [categoryFilter, setCategoryFilter] = useState<string>('__all__');

    /* --- Persistance --- */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<PersistedState>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setStatus((s.status as StatusFilter) ?? 'all');
            setSort((s.sort as SortKey) ?? 'recent');
            setCategoryFilter(s.category ?? '__all__');
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: PersistedState = { q, status, sort, category: categoryFilter || '__all__' };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, status, sort, categoryFilter]);

    /* --- Stats pour libellés --- */
    const stats = useMemo(() => {
        const total = rows.length;
        let draft = 0,
            published = 0;
        rows.forEach((r) => (r.status === 'draft' ? draft++ : published++));
        return { total, draft, published };
    }, [rows]);

    /* --- Filtrage + Tri --- */
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const passes = (r: AdminPostRow) => {
            if (status !== 'all' && r.status !== status) return false;

            if (categoryFilter && categoryFilter !== '__all__') {
                // r.category = slug (ou ancien nom libre). On ne garde que ceux dont slug exact correspond.
                if ((r.category || '').trim() !== categoryFilter) return false;
            }

            if (ql) {
                const categoryName = r.category ? catNameBySlug.get(r.category) || r.category : '';
                const hay = `${r.title} ${r.slug} ${r.summary ?? ''} ${categoryName}`.toLowerCase();
                if (!hay.includes(ql)) return false;
            }
            return true;
        };

        const out = rows.filter(passes);

        out.sort((a, b) => {
            switch (sort) {
                case 'alphaAsc':
                    return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
                case 'alphaDesc':
                    return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
                case 'recent':
                default: {
                    const aa = a.timestamps.updatedAt || a.timestamps.createdAt || '';
                    const bb = b.timestamps.updatedAt || b.timestamps.createdAt || '';
                    return bb.localeCompare(aa);
                }
            }
        });

        return out;
    }, [rows, q, status, sort, categoryFilter, catNameBySlug]);

    /* --- Quick view --- */
    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const current = useMemo(() => rows.find((r) => r.slug === openSlug) ?? null, [openSlug, rows]);
    const currentCatName = useMemo(() => (current?.category ? catNameBySlug.get(current.category) || current.category : null), [current, catNameBySlug]);

    return (
        <>
            {/* ===== Toolbar sticky ===== */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                {/* Search */}
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, titre, slug, résumé, catégorie)…"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher un article"
                    />
                    {qRaw && (
                        <button
                            aria-label="Effacer la recherche"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:bg-gray-100"
                            onClick={() => {
                                setQRaw('');
                                setQ('');
                            }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Dropdowns */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {/* Statut */}
                    <div className="relative">
                        <label htmlFor="post-status" className="sr-only">
                            Filtrer par statut
                        </label>
                        <select
                            id="post-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="all">Tous ({stats.total})</option>
                            <option value="published">Publiés ({stats.published})</option>
                            <option value="draft">Brouillons ({stats.draft})</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Catégorie (depuis DB) */}
                    <div className="relative">
                        <label htmlFor="post-category" className="sr-only">
                            Filtrer par catégorie
                        </label>
                        <select
                            id="post-category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="__all__">Toutes les catégories</option>
                            {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tri */}
                    <div className="relative">
                        <label htmlFor="post-sort" className="sr-only">
                            Trier
                        </label>
                        <select
                            id="post-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="recent">Récents</option>
                            <option value="alphaAsc">A → Z</option>
                            <option value="alphaDesc">Z → A</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </section>

            {/* ===== Grid ===== */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucun article ne correspond.</p>
                    <div className="mt-3">
                        <Link
                            href="/admin/blog/posts/new"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                        >
                            <span aria-hidden>＋</span> Nouvel article
                        </Link>
                    </div>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((r) => {
                        const catDisplay = r.category ? catNameBySlug.get(r.category) || r.category : null;
                        return (
                            <li
                                key={r.id}
                                className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="relative aspect-[16/10] w-full bg-gray-100">
                                    {r.coverPath ? (
                                        <Image
                                            src={r.coverPath}
                                            alt={r.title || 'Couverture'}
                                            fill
                                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <ImageIcon className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-90 transition group-hover:opacity-100" />
                                    <div className="absolute right-2 top-2">
                                        <StatusBadge s={r.status} />
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="text-xs text-gray-500">/{r.slug}</div>
                                    <h3 className="line-clamp-2 text-base font-semibold sm:text-lg">{r.title}</h3>

                                    {r.summary && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{r.summary}</p>}

                                    {catDisplay ? <div className="mt-2 text-[11px] text-muted-foreground">Catégorie : {catDisplay}</div> : null}

                                    {r.tags?.length ? (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {r.tags.map((t) => (
                                                <span
                                                    key={`${r.id}-${t}`}
                                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200"
                                                >
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}

                                    <div className="mt-2 text-xs text-muted-foreground">
                                        maj {formatRelative(r.timestamps.updatedAt)} • créé {formatRelative(r.timestamps.createdAt)}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Link
                                            href={`/admin/blog/${r.slug}`}
                                            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100"
                                        >
                                            <PencilLine className="h-4 w-4" /> Éditer
                                        </Link>
                                        <button
                                            onClick={() => setOpenSlug(r.slug)}
                                            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100 cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4" /> Aperçu
                                        </button>

                                        <DeletePostButton slug={r.slug} className="col-span-2 w-full justify-center" afterDelete="refresh" label="Supprimer" />

                                        {r.status === 'draft' && (
                                            <div className="col-span-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                                <Lock className="h-4 w-4" /> Non publié
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <QuickViewModal open={!!openSlug} onClose={() => setOpenSlug(null)} row={current} categoryName={currentCatName} />
        </>
    );
}
