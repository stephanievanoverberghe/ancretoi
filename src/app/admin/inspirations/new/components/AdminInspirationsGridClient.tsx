'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Eye, Tag, ExternalLink, Lock, X, PencilLine, PlayCircle, CalendarClock } from 'lucide-react';

import DeleteInspirationButton from '@/components/admin/DeleteInspirationButton';

export type AdminInspirationRow = {
    id: string;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    videoUrl: string | null;
    summary: string | null;
    tags: string[];
    timestamps: { createdAt: string | null; updatedAt: string | null };
};

type StatusFilter = 'all' | 'draft' | 'published';
type SortKey = 'recent' | 'alphaAsc' | 'alphaDesc';

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

function videoThumb(videoUrl: string | null): { src: string | null; alt: string } {
    if (!videoUrl) return { src: null, alt: 'Aucun visuel' };
    try {
        const yt = new URL(videoUrl);
        if (['www.youtube.com', 'youtube.com'].includes(yt.hostname)) {
            const id = yt.searchParams.get('v');
            if (id) return { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: 'Miniature YouTube' };
        }
        if (yt.hostname === 'youtu.be') {
            const id = yt.pathname.replace('/', '');
            if (id) return { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: 'Miniature YouTube' };
        }
        return { src: null, alt: 'Aucun visuel' };
    } catch {
        return { src: null, alt: 'Aucun visuel' };
    }
}

/* =============== Quick View Modal =============== */

function QuickViewModal({ open, onClose, row }: { open: boolean; onClose: () => void; row: AdminInspirationRow | null }) {
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

    const thumb = videoThumb(row.videoUrl);

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-brand-100">
                    <div className="relative h-48 w-full bg-gray-100">
                        {thumb.src ? (
                            <Image src={thumb.src} alt={thumb.alt} fill sizes="100vw" className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <PlayCircle className="h-10 w-10" />
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
                                    <CalendarClock className="h-4 w-4" /> Créé
                                </div>
                                <div className="font-semibold">{formatRelative(row.timestamps.createdAt)}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Résumé</div>
                                <p className="rounded-lg border p-3 text-sm">{row.summary || '—'}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Tag className="h-3.5 w-3.5" /> Tags:
                                </span>
                                {row.tags.length ? (
                                    row.tags.map((t) => (
                                        <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                            {t}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Link
                                href={`/admin/inspirations/${row.slug}`}
                                className="btn-secondary w-full justify-center inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm"
                            >
                                <PencilLine className="h-4 w-4" /> Éditer
                            </Link>

                            {row.status === 'published' ? (
                                <Link
                                    href={`/inspirations/${row.slug}`}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Voir la page publique <ExternalLink className="h-4 w-4" />
                                </Link>
                            ) : (
                                <div className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                    <Lock className="h-4 w-4" /> Non publié
                                </div>
                            )}

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

const LS_KEY = 'adminInspirationsToolbar:v1';

type PersistedState = {
    q: string;
    status: StatusFilter;
    sort: SortKey;
};

export default function AdminInspirationsGridClient({ rows }: { rows: AdminInspirationRow[] }) {
    // Recherche
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

    // Filtres + tri
    const [status, setStatus] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');

    // Persistance
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<PersistedState>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setStatus((s.status as StatusFilter) ?? 'all');
            setSort((s.sort as SortKey) ?? 'recent');
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: PersistedState = { q, status, sort };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, status, sort]);

    // Stats
    const stats = useMemo(() => {
        const total = rows.length;
        const by = rows.reduce(
            (acc, r) => {
                if (r.status === 'draft') acc.draft += 1;
                else acc.published += 1;
                return acc;
            },
            { draft: 0, published: 0 }
        );
        return { total, ...by };
    }, [rows]);

    // Filtrage + tri
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const passes = (r: AdminInspirationRow) => {
            if (status !== 'all' && r.status !== status) return false;
            if (ql) {
                const hay = `${r.title} ${r.slug} ${(r.tags || []).join(' ')} ${r.summary ?? ''}`.toLowerCase();
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
    }, [rows, q, status, sort]);

    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const current = useMemo(() => rows.find((r) => r.slug === openSlug) ?? null, [openSlug, rows]);

    return (
        <>
            {/* Toolbar */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, titre, slug, tag, résumé)"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher une inspiration"
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

                <div className="mt-3 flex flex-col sm:flex-row w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
                    {(
                        [
                            { key: 'all' as StatusFilter, label: `Tous (${stats.total})` },
                            { key: 'draft' as StatusFilter, label: `Brouillons (${stats.draft})` },
                            { key: 'published' as StatusFilter, label: `Publiés (${stats.published})` },
                        ] as const
                    ).map((opt) => {
                        const active = status === opt.key;
                        return (
                            <button
                                key={opt.key}
                                onClick={() => setStatus(opt.key)}
                                aria-pressed={active}
                                className={[
                                    'snap-start whitespace-nowrap rounded-full px-3 py-1 text-xs ring-1 transition cursor-pointer',
                                    active ? 'bg-brand-600 text-white ring-brand-100 shadow-sm' : 'bg-muted text-gray-800 ring-gray-200 hover:bg-brand-100',
                                ].join(' ')}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-2 flex justify-end">
                    <label htmlFor="insp-sort" className="sr-only">
                        Trier les inspirations
                    </label>
                    <select
                        id="insp-sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className="rounded-full border border-brand-300 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                        <option value="recent">Récents</option>
                        <option value="alphaAsc">A → Z</option>
                        <option value="alphaDesc">Z → A</option>
                    </select>
                </div>
            </section>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucune inspiration ne correspond.</p>
                    <div className="mt-3">
                        <Link
                            href="/admin/inspirations/new"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                        >
                            <span aria-hidden>＋</span> Nouvelle inspiration
                        </Link>
                    </div>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((r) => {
                        const thumb = videoThumb(r.videoUrl);
                        return (
                            <li
                                key={r.id}
                                className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="relative aspect-[16/10] w-full bg-gray-100">
                                    {thumb.src ? (
                                        <Image src={thumb.src} alt={thumb.alt} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px" className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <PlayCircle className="h-10 w-10" />
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

                                    {r.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {r.tags.slice(0, 4).map((t) => (
                                                <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
                                                    {t}
                                                </span>
                                            ))}
                                            {r.tags.length > 4 && <span className="text-[11px] text-muted-foreground">+{r.tags.length - 4}</span>}
                                        </div>
                                    )}

                                    <div className="mt-2 text-xs text-muted-foreground">
                                        maj {formatRelative(r.timestamps.updatedAt)} • créé {formatRelative(r.timestamps.createdAt)}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Link
                                            href={`/admin/inspirations/${r.slug}`}
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

                                        {/* Ligne 3 : Suppression (pleine largeur) */}
                                        <div className="col-span-2 [&>button]:w-full">
                                            <DeleteInspirationButton slug={r.slug} />
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <QuickViewModal open={!!openSlug} onClose={() => setOpenSlug(null)} row={current} />
        </>
    );
}
