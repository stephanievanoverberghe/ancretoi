// src/app/admin/blog/components/AdminPostsGridClient.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, LayoutGrid, Table as TableIcon, Eye, PencilLine, Lock, ExternalLink, ImageIcon, Star, Trash2 } from 'lucide-react';
import DeletePostButton from '@/app/admin/blog/posts/components/DeletePostButton';

/* ================= Types ================= */
export type AdminPostRow = {
    id: string;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    coverPath: string | null;
    summary: string | null;
    tags: string[];
    category: string | null; // slug
    timestamps: { createdAt: string | null; updatedAt: string | null; publishedAt: string | null };
    seo?: { title?: string; description?: string };
    featured?: boolean;
};

export type CategoryOption = { slug: string; name: string; color: string | null; icon: string | null };

type StatusFilter = 'all' | 'draft' | 'published';
type SortKey = 'recent' | 'alpha';
type ViewMode = 'cards' | 'table';

type Persisted = { q: string; status: StatusFilter; category: string; sort: SortKey; view: ViewMode };

const LS_KEY = 'adminPostsToolbar:v6';

/* ================= Utils ================= */
const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

function formatRelative(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = 60_000,
        h = 60 * m,
        day = 24 * h;
    if (diff < h) return `${Math.max(1, Math.round(diff / m))} min`;
    if (diff < day) return `${Math.round(diff / h)} h`;
    return d.toLocaleDateString('fr-FR');
}

function StatusBadge({ s }: { s: 'draft' | 'published' }) {
    const label = s === 'published' ? 'Publié' : 'Brouillon';
    const theme = s === 'published' ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-amber-100 text-amber-800 ring-amber-200';
    return <span className={cls('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1', theme)}>{label}</span>;
}

function FeatureBadge() {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700 ring-1 ring-indigo-200">
            <Star className="h-3.5 w-3.5" /> mis en avant
        </span>
    );
}

function SeoBadge({ ok }: { ok: boolean }) {
    return ok ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 ring-1 ring-emerald-200">SEO ok</span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 ring-1 ring-rose-200">SEO manquant</span>
    );
}

/* ================= QuickView ================= */
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

    const seoOk = !!(row.seo && row.seo.title && row.seo.description);

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-brand-100">
                    <div className="relative h-48 w-full bg-gray-100">
                        {row.coverPath ? (
                            <Image src={row.coverPath} alt={row.title || 'Couverture'} fill sizes="100vw" className="object-cover" />
                        ) : (
                            <div className="grid h-full w-full place-items-center text-gray-400">
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
                                {row.featured && <FeatureBadge />}
                                <StatusBadge s={row.status} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <SeoBadge ok={seoOk} />
                                {categoryName && (
                                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] ring-1 ring-zinc-200">
                                        Catégorie : {categoryName}
                                    </span>
                                )}
                            </div>

                            <p className="rounded-lg border p-3 text-sm">{row.summary || '—'}</p>

                            {row.tags?.length ? (
                                <div className="flex flex-wrap gap-1">
                                    {row.tags.map((t) => (
                                        <span key={t} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>Créé • {formatRelative(row.timestamps.createdAt)}</div>
                                <div>MAJ • {formatRelative(row.timestamps.updatedAt)}</div>
                                <div>Publié • {row.timestamps.publishedAt ? formatRelative(row.timestamps.publishedAt) : '—'}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Link
                                href={`/admin/blog/posts/${row.slug}`}
                                className="inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-2 text-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
                            >
                                <PencilLine className="h-4 w-4" /> Éditer
                            </Link>

                            {row.status === 'published' ? (
                                <Link
                                    href={`/blog/${row.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Voir la page publique <ExternalLink className="h-4 w-4" />
                                </Link>
                            ) : (
                                <div className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                    <Lock className="h-4 w-4" /> Non publié
                                </div>
                            )}

                            <DeletePostButton slug={row.slug} className="w-full justify-center" afterDelete="refresh" label="Supprimer" />
                            <button
                                onClick={onClose}
                                className="w-full rounded-md px-3 py-1.5 text-sm text-secondary-50 border border-secondary-200 bg-secondary-600 hover:bg-secondary-700"
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

/* ================= Client (Cartes / Tableau) ================= */
export default function AdminPostsClient({ rows, categories }: { rows: AdminPostRow[]; categories: CategoryOption[] }) {
    const catNameBySlug = useMemo(() => {
        const m = new Map<string, string>();
        categories.forEach((c) => m.set(c.slug, c.name));
        return m;
    }, [categories]);

    // recherche (/, debounce), filtres, tri, vue + persistance
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

    const [status, setStatus] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');
    const [view, setView] = useState<ViewMode>('cards');
    const [categoryFilter, setCategoryFilter] = useState<string>('__all__');

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<Persisted>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setStatus((s.status as StatusFilter) ?? 'all');
            setCategoryFilter(s.category ?? '__all__');
            setSort((s.sort as SortKey) ?? 'recent');
            setView((s.view as ViewMode) ?? 'cards');
        } catch {}
    }, []);
    useEffect(() => {
        const s: Persisted = { q, status, category: categoryFilter, sort, view };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, status, categoryFilter, sort, view]);

    // stats (labels)
    const counts = useMemo(() => {
        const total = rows.length;
        let draft = 0,
            published = 0;
        rows.forEach((r) => (r.status === 'draft' ? draft++ : published++));
        return { total, draft, published };
    }, [rows]);

    // filtres + tri
    const filtered = useMemo(() => {
        let out = rows.slice();
        if (status !== 'all') out = out.filter((r) => r.status === status);
        if (categoryFilter !== '__all__') out = out.filter((r) => (r.category || '').trim() === categoryFilter);
        if (q)
            out = out.filter((r) => {
                const cat = r.category ? catNameBySlug.get(r.category) || r.category : '';
                const hay = `${r.title} ${r.slug} ${r.summary ?? ''} ${cat}`.toLowerCase();
                return hay.includes(q);
            });
        if (sort === 'alpha') {
            out.sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
        } else {
            const key = (r: AdminPostRow) => r.timestamps.updatedAt || r.timestamps.createdAt || '';
            out.sort((a, b) => key(b).localeCompare(key(a)));
        }
        return out;
    }, [rows, q, status, categoryFilter, sort, catNameBySlug]);

    // quick view
    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const current = useMemo(() => rows.find((r) => r.slug === openSlug) ?? null, [openSlug, rows]);
    const currentCatName = useMemo(() => (current?.category ? catNameBySlug.get(current.category) || current.category : null), [current, catNameBySlug]);

    return (
        <>
            {/* Toolbar sticky (calquée Users) */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/85 to-white/40 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200">
                {/* Recherche */}
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, titre, slug, résumé, catégorie)…"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-11 pr-11 py-2.5 text-[15px] shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher un article"
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

                {/* Filtres + tri + vue */}
                <div className="grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto_auto] mb-2">
                    {/* Statut */}
                    <div className="relative">
                        <label htmlFor="post-status" className="sr-only">
                            Filtrer par statut
                        </label>
                        <select
                            id="post-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as StatusFilter)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="all">Tous ({counts.total})</option>
                            <option value="published">Publiés ({counts.published})</option>
                            <option value="draft">Brouillons ({counts.draft})</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Catégorie */}
                    <div className="relative">
                        <label htmlFor="post-category" className="sr-only">
                            Filtrer par catégorie
                        </label>
                        <select
                            id="post-category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="recent">Récents</option>
                            <option value="alpha">A → Z</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Switch Vue (Cartes/Tableau) */}
                    <div className="flex items-stretch">
                        <div
                            role="tablist"
                            aria-label="Mode d’affichage"
                            className="inline-flex h-[42px] w-full items-center rounded-full border border-brand-300 bg-white p-1 shadow-sm"
                        >
                            <button
                                role="tab"
                                aria-selected={view === 'cards'}
                                onClick={() => setView('cards')}
                                className={cls(
                                    'flex h-full w-full items-center justify-center gap-1 rounded-full px-3 text-sm lg:flex-1',
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
                                    'ml-1 flex h-full w-full items-center justify-center gap-1 rounded-full px-3 text-sm lg:flex-1',
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

                {/* Mini stats text-right (cohérence Users) */}
                <div className="hidden xl:block text-xs text-muted-foreground text-right pr-2 py-2.5">
                    <span className="font-medium">{counts.total}</span> articles • {counts.published} publiés • {counts.draft} brouillons
                </div>
            </section>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucun article ne correspond.</p>
                    <div className="mt-3">
                        <Link
                            href="/admin/blog/posts/new"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            <span aria-hidden>＋</span> Nouvel article
                        </Link>
                    </div>
                </div>
            )}

            {/* Cartes */}
            {filtered.length > 0 && view === 'cards' && <CardsView items={filtered} catNameBySlug={catNameBySlug} onQuick={(s) => setOpenSlug(s)} />}

            {/* Tableau */}
            {filtered.length > 0 && view === 'table' && <TableView items={filtered} catNameBySlug={catNameBySlug} onQuick={(s) => setOpenSlug(s)} />}

            <QuickViewModal open={!!openSlug} onClose={() => setOpenSlug(null)} row={current} categoryName={currentCatName} />
        </>
    );
}

/* ================= Vues ================= */
/* ================= Vues ================= */
function CardsView({ items, catNameBySlug, onQuick }: { items: AdminPostRow[]; catNameBySlug: Map<string, string>; onQuick: (slug: string) => void }) {
    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => {
                const cat = r.category ? catNameBySlug.get(r.category) || r.category : null;
                const seoOk = !!(r.seo && r.seo.title && r.seo.description);
                return (
                    <li key={r.id} className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="relative aspect-[16/10] w-full bg-gray-100">
                            {r.coverPath ? (
                                <Image
                                    src={r.coverPath}
                                    alt={r.title || 'Couverture'}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-gray-400">
                                    <ImageIcon className="h-10 w-10" />
                                </div>
                            )}
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                {r.featured && <FeatureBadge />}
                                <StatusBadge s={r.status} />
                            </div>
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                        </div>

                        <div className="p-4">
                            <div className="text-xs text-gray-500">/{r.slug}</div>
                            <h3 className="line-clamp-2 text-base font-semibold sm:text-lg">{r.title}</h3>
                            {r.summary && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{r.summary}</p>}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                {cat && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] ring-1 ring-zinc-200">Catégorie : {cat}</span>}
                                <SeoBadge ok={seoOk} />
                            </div>

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

                            {/* Actions: version précédente avec libellés */}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <Link
                                    href={`/admin/blog/posts/${r.slug}`}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500"
                                >
                                    <PencilLine className="h-4 w-4" /> Éditer
                                </Link>

                                <button
                                    onClick={() => onQuick(r.slug)}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500"
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
    );
}

function TableView({ items, catNameBySlug, onQuick }: { items: AdminPostRow[]; catNameBySlug: Map<string, string>; onQuick: (slug: string) => void }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-brand-200 bg-white ring-1 ring-black/5">
            <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th className="px-3 py-2 font-medium">Titre</th>
                        <th className="px-3 py-2 font-medium">Catégorie</th>
                        <th className="px-3 py-2 font-medium">Statut</th>
                        <th className="px-3 py-2 font-medium">MAJ</th>
                        <th className="px-3 py-2 font-medium">SEO</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((r) => {
                        const cat = r.category ? catNameBySlug.get(r.category) || r.category : '—';
                        const seoOk = !!(r.seo && r.seo.title && r.seo.description);
                        return (
                            <tr key={r.id} className="border-b last:border-0">
                                <td className="px-3 py-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">{r.title || r.slug}</div>
                                        <div className="text-[11px] text-gray-500 sm:hidden">/{r.slug}</div>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-[12px] text-gray-700">{cat}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <StatusBadge s={r.status} />
                                </td>
                                <td className="px-3 py-3 text-[12px] text-gray-600">{formatRelative(r.timestamps.updatedAt)}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <SeoBadge ok={seoOk} />{' '}
                                    {r.featured && (
                                        <span className="ml-1 align-middle">
                                            <FeatureBadge />
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    {/* Actions: icônes seules */}
                                    <div className="flex items-center gap-1.5">
                                        {/* Éditer */}
                                        <Link
                                            href={`/admin/blog/posts/${r.slug}`}
                                            title="Éditer"
                                            aria-label="Éditer"
                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50"
                                        >
                                            <PencilLine className="h-4 w-4" />
                                        </Link>

                                        {/* Aperçu */}
                                        <button
                                            onClick={() => onQuick(r.slug)}
                                            title="Aperçu"
                                            aria-label="Aperçu"
                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {/* Supprimer */}
                                        <div className="relative">
                                            <DeletePostButton
                                                slug={r.slug}
                                                afterDelete="refresh"
                                                label="Supprimer"
                                                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 text-transparent"
                                            />
                                            <span className="pointer-events-none absolute inset-0 grid place-items-center">
                                                <Trash2 className="h-4 w-4 text-zinc-800" />
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
