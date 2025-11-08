// src/app/admin/blog/categories/components/AdminCategoriesGridClient.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Search, PencilLine, X, Tag as TagIcon, LayoutGrid, Table as TableIcon } from 'lucide-react';
import DeleteCategoryButton from './DeleteCategoryButton';

export type AdminCategoryRow = {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string | null;
    icon: string | null;
    imagePath: string | null;
    imageAlt: string | null;
    usage: { posts: number };
    timestamps: { createdAt: string | null; updatedAt: string | null };
};

type SortKey = 'alphaAsc' | 'alphaDesc' | 'usageDesc' | 'recent';
type ViewMode = 'cards' | 'table';

type PersistedState = {
    q: string;
    sort: SortKey;
    onlyUnused: boolean;
    view: ViewMode;
};

const LS_KEY = 'adminCategoriesToolbar:v2';

function formatRelative(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = 60 * 1000,
        hour = 60 * min,
        day = 24 * hour;
    if (diff < hour) return `${Math.max(1, Math.round(diff / min))} min`;
    if (diff < day) return `${Math.round(diff / hour)} h`;
    return d.toLocaleDateString('fr-FR');
}

const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export default function AdminCategoriesGridClient({ rows }: { rows: AdminCategoryRow[] }) {
    // search with debounce
    const [qRaw, setQRaw] = useState<string>('');
    const [q, setQ] = useState<string>('');
    const searchRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        const id = setTimeout(() => setQ(qRaw), 220);
        return () => clearTimeout(id);
    }, [qRaw]);

    // toolbar state
    const [sort, setSort] = useState<SortKey>('alphaAsc');
    const [onlyUnused, setOnlyUnused] = useState<boolean>(false);
    const [view, setView] = useState<ViewMode>('cards');

    // keyboard shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                setView((v) => (v === 'cards' ? 'table' : 'cards'));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // restore UI state
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<PersistedState>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setSort((s.sort as SortKey) ?? 'alphaAsc');
            setOnlyUnused(Boolean(s.onlyUnused));
            setView((s.view as ViewMode) ?? 'cards');
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: PersistedState = { q, sort, onlyUnused, view };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, sort, onlyUnused, view]);

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const out = rows.filter((r) => {
            if (onlyUnused && r.usage.posts > 0) return false;
            if (ql) {
                const hay = `${r.name} ${r.slug} ${r.description ?? ''}`.toLowerCase();
                return hay.includes(ql);
            }
            return true;
        });

        out.sort((a, b) => {
            switch (sort) {
                case 'alphaAsc':
                    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
                case 'alphaDesc':
                    return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' });
                case 'usageDesc':
                    return b.usage.posts - a.usage.posts || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
                case 'recent':
                default: {
                    const aa = a.timestamps.updatedAt || a.timestamps.createdAt || '';
                    const bb = b.timestamps.updatedAt || b.timestamps.createdAt || '';
                    return bb.localeCompare(aa);
                }
            }
        });

        return out;
    }, [rows, q, sort, onlyUnused]);

    return (
        <>
            {/* Toolbar */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, nom, slug, description)…"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher une catégorie"
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

                <div className="mt-3 grid items-stretch gap-2 sm:grid-cols-3 xl:grid-cols-[auto_auto_auto_auto]">
                    {/* Tri */}
                    <div className="relative">
                        <label htmlFor="cat-sort" className="sr-only">
                            Trier
                        </label>
                        <select
                            id="cat-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="h-[42px] w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 text-[15px] text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="alphaAsc">A → Z</option>
                            <option value="alphaDesc">Z → A</option>
                            <option value="usageDesc">Plus utilisées</option>
                            <option value="recent">Récentes</option>
                        </select>
                    </div>

                    {/* Filtre: inutilisées */}
                    <label className="flex h-[42px] items-center gap-2 rounded-full border border-brand-300 bg-white px-3 text-[15px] shadow-sm">
                        <input type="checkbox" checked={onlyUnused} onChange={(e) => setOnlyUnused(e.target.checked)} />
                        <span>Masquer les utilisées</span>
                    </label>

                    {/* Switch Vue */}
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
            </section>

            {/* Results */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucune catégorie ne correspond.</p>
                    <div className="mt-3">
                        <Link
                            href="/admin/categories/new"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                        >
                            ＋ Nouvelle catégorie
                        </Link>
                    </div>
                </div>
            ) : view === 'cards' ? (
                <CardsView rows={filtered} />
            ) : (
                <TableView rows={filtered} />
            )}
        </>
    );
}

/* ================== VUE CARTES ================== */
function CardsView({ rows }: { rows: AdminCategoryRow[] }) {
    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
                <li key={r.id} className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    {/* Bandeau image */}
                    <div className="relative aspect-[16/9] w-full bg-gray-100">
                        {r.imagePath ? (
                            <Image
                                src={r.imagePath}
                                alt={r.imageAlt || r.name}
                                fill
                                className="object-cover"
                                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                priority={false}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center text-white"
                                style={{
                                    background: r.color ? `linear-gradient(135deg, ${r.color} 0%, rgba(0,0,0,0.35) 100%)` : 'linear-gradient(135deg, #c7d2fe 0%, #fbcfe8 100%)',
                                }}
                            >
                                <div className="flex items-center gap-2 text-lg drop-shadow">
                                    <TagIcon className="h-7 w-7" />
                                    <span className="font-semibold">{r.name}</span>
                                </div>
                            </div>
                        )}

                        {/* Badges bandeau */}
                        <div className="absolute left-3 bottom-3 flex items-center gap-2">
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">/{r.slug}</span>
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">articles {r.usage.posts}</span>
                        </div>
                    </div>

                    {/* Corps */}
                    <div className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-gray-200 bg-white">
                                <TagIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <h3 className="line-clamp-1 text-base font-semibold sm:text-lg">{r.name}</h3>
                            {r.color && (
                                <span className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]" title={r.color}>
                                    <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: r.color }} />
                                    <span className="text-muted-foreground">{r.color}</span>
                                </span>
                            )}
                        </div>

                        {r.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{r.description}</p>}

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Articles</div>
                                <div className="text-base font-semibold">{r.usage.posts}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Créée</div>
                                <div className="font-medium">{formatRelative(r.timestamps.createdAt)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">MAJ</div>
                                <div className="font-medium">{formatRelative(r.timestamps.updatedAt)}</div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Link
                                href={`/admin/blog/categories/${r.slug}`}
                                className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100"
                            >
                                <PencilLine className="h-4 w-4" /> Éditer
                            </Link>
                            <DeleteCategoryButton slug={r.slug} afterDelete="redirect" redirectTo="/admin/blog/categories" className="w-full justify-center" />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ================== VUE TABLEAU (fix overflow) ================== */
function TableView({ rows }: { rows: AdminCategoryRow[] }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-brand-200 bg-white ring-1 ring-black/5">
            <table className="min-w-full table-fixed text-sm">
                {/* Largeurs stables par colonne */}
                <colgroup>
                    <col className="w-[40%]" /> {/* Catégorie (image + nom + desc courte + badge couleur) */}
                    <col className="w-[18%]" /> {/* Slug */}
                    <col className="w-[10%]" /> {/* Articles */}
                    <col className="w-[12%]" /> {/* Créée */}
                    <col className="w-[12%]" /> {/* MAJ */}
                    <col className="w-[8%]" /> {/* Actions */}
                </colgroup>

                <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b">
                        <th className="px-3 py-2 font-medium">Catégorie</th>
                        <th className="px-3 py-2 font-medium">Articles</th>
                        <th className="px-3 py-2 font-medium">Créée</th>
                        <th className="px-3 py-2 font-medium">MAJ</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                            {/* Catégorie */}
                            <td className="px-3 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* thumb fixe 64px */}
                                    <div className="relative h-9 w-16 overflow-hidden rounded-xl ring-1 ring-black/5 bg-zinc-100 shrink-0">
                                        {r.imagePath ? (
                                            <Image src={r.imagePath} alt={r.imageAlt || r.name} fill className="object-cover" sizes="64px" />
                                        ) : (
                                            <div
                                                className="grid h-full w-full place-items-center text-[10px] text-white"
                                                style={{
                                                    background: r.color
                                                        ? `linear-gradient(135deg, ${r.color} 0%, rgba(0,0,0,0.35) 100%)`
                                                        : 'linear-gradient(135deg, #c7d2fe 0%, #fbcfe8 100%)',
                                                }}
                                                title={r.name}
                                            >
                                                <TagIcon className="h-4 w-4 opacity-90" />
                                            </div>
                                        )}
                                    </div>

                                    {/* texte: bloc truncaté */}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{r.name}</div>
                                    </div>
                                </div>
                            </td>

                            {/* Articles */}
                            <td className="px-3 py-3 whitespace-nowrap text-xs">{r.usage.posts}</td>

                            {/* Dates (compact) */}
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">{formatRelative(r.timestamps.createdAt)}</td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">{formatRelative(r.timestamps.updatedAt)}</td>

                            {/* Actions compactes */}
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/categories/${r.slug}`}
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-zinc-200 hover:bg-zinc-50 cursor-pointer"
                                        title="Éditer"
                                    >
                                        <PencilLine className="h-3.5 w-3.5" />
                                        <span className="hidden 2xl:inline">Éditer</span>
                                    </Link>
                                    <DeleteCategoryButton slug={r.slug} afterDelete="redirect" redirectTo="/admin/blog/categories" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
