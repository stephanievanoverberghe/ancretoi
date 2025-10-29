'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';

type Item = {
    title: string;
    slug?: string;
    videoUrl: string;
    summary?: string | null;
    tags?: string[] | null;
    createdAt?: string | Date;
};

type SortKey = 'recent' | 'alphaAsc' | 'alphaDesc';

/* ------------ Utils ------------ */

function youtubeId(url: string) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
        if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
        return null;
    } catch {
        return null;
    }
}

function youtubeThumb(url: string) {
    const id = youtubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** Renvoie un ISO string stable pour trier côté client sans mismatch SSR/CSR */
function formatDateSafe(d?: string | Date) {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
}

/* ============== Modal vidéo ============== */

function VideoModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: Item | null }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, mounted, onClose]);

    if (!open || !mounted || !item) return null;

    const id = youtubeId(item.videoUrl);
    const src = id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 p-4 flex items-center justify-center">
                <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
                    {/* header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="min-w-0 pr-3">
                            <div className="text-xs text-muted-foreground truncate">{item.tags?.slice(0, 3).join(' • ')}</div>
                            <h3 className="font-semibold leading-tight truncate">{item.title}</h3>
                        </div>
                        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Fermer">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* video */}
                    <div className="relative aspect-video bg-black">
                        {src ? (
                            <iframe className="absolute inset-0 h-full w-full" src={src} title={item.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/70">Vidéo indisponible</div>
                        )}
                    </div>

                    {/* footer */}
                    {item.summary ? <div className="px-4 py-3 text-sm text-muted-foreground">{item.summary}</div> : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ============== Galerie + filtres ============== */

const LS_KEY = 'inspirations:list:v1';
type Persisted = { q: string; sort: SortKey; tag: string | null };

export default function InspirationsGalleryClient({ items }: { items: Item[] }) {
    const [qRaw, setQRaw] = useState('');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState<SortKey>('recent');
    const [tag, setTag] = useState<string | null>(null);

    // debounce recherche
    useEffect(() => {
        const id = setTimeout(() => setQ(qRaw), 200);
        return () => clearTimeout(id);
    }, [qRaw]);

    // persistance
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const s = JSON.parse(raw) as Partial<Persisted>;
                setQRaw(s.q ?? '');
                setQ(s.q ?? '');
                setSort((s.sort as SortKey) ?? 'recent');
                setTag(s.tag ?? null);
            }
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: Persisted = { q, sort, tag };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, sort, tag]);

    // tags disponibles
    const allTags = useMemo(() => {
        const set = new Set<string>();
        for (const it of items) (it.tags ?? []).forEach((t) => t && set.add(t));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }, [items]);

    // filtrage + tri
    const list = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const filtered = items.filter((it) => {
            if (tag && !(it.tags ?? []).includes(tag)) return false;
            if (!ql) return true;
            const hay = `${it.title} ${it.summary ?? ''} ${(it.tags ?? []).join(' ')}`.toLowerCase();
            return hay.includes(ql);
        });

        filtered.sort((a, b) => {
            if (sort === 'alphaAsc') return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
            if (sort === 'alphaDesc') return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
            // recent
            const aa = formatDateSafe(a.createdAt);
            const bb = formatDateSafe(b.createdAt);
            return bb.localeCompare(aa);
        });

        return filtered;
    }, [items, q, sort, tag]);

    // modal
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<Item | null>(null);
    const openModal = (it: Item) => {
        setCurrent(it);
        setOpen(true);
    };
    const closeModal = () => setOpen(false);

    // UI
    return (
        <>
            {/* Toolbar */}
            <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center">
                    {/* search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={qRaw}
                            onChange={(e) => setQRaw(e.target.value)}
                            placeholder="Rechercher (titre, résumé, tag)"
                            className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                            aria-label="Rechercher une inspiration"
                        />
                        {qRaw && (
                            <button
                                onClick={() => {
                                    setQRaw('');
                                    setQ('');
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-100"
                                aria-label="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* tag filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={tag ?? ''}
                            onChange={(e) => setTag(e.target.value || null)}
                            className="rounded-full border border-brand-300 bg-white px-3 py-1.5 text-xs text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            aria-label="Filtrer par tag"
                        >
                            <option value="">Tous les tags</option>
                            {allTags.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        {tag && (
                            <button onClick={() => setTag(null)} className="text-xs text-brand-700 hover:underline">
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    {/* sort */}
                    <div className="justify-self-end">
                        <label htmlFor="insp-sort" className="sr-only">
                            Trier
                        </label>
                        <div className="inline-flex items-center gap-1">
                            <ArrowUpDown className="h-4 w-4 text-gray-500" />
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
                    </div>
                </div>
            </div>

            {/* Grid */}
            {list.length ? (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((it) => {
                        const thumb = youtubeThumb(it.videoUrl);
                        const href = it.slug ? `/inspirations/${it.slug}` : it.videoUrl;
                        return (
                            <li key={it.videoUrl}>
                                <Link
                                    href={href}
                                    onClick={(e) => {
                                        // Clic principal sans modifieurs → modal (SEO-friendly: le lien reste pour clic molette / cmd+clic)
                                        const isPrimary = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
                                        if (it.slug && isPrimary) {
                                            e.preventDefault();
                                            openModal(it);
                                        }
                                    }}
                                    className="group relative block w-full overflow-hidden rounded-2xl border border-brand-200 bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                                    aria-label={`Ouvrir ${it.title}`}
                                >
                                    <div className="relative aspect-video bg-gray-100">
                                        {thumb ? (
                                            <Image
                                                src={thumb}
                                                alt={it.title}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                priority={false}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm">Aucune image</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition" />
                                        <div className="absolute bottom-3 left-4 right-4 text-white drop-shadow-sm">
                                            <div className="font-semibold leading-snug text-base line-clamp-2">{it.title}</div>
                                        </div>
                                        {/* Play bubble */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition duration-300">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-md backdrop-blur-sm">
                                                    ▶
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        {it.summary ? <p className="text-sm text-muted-foreground line-clamp-2">{it.summary}</p> : null}
                                        {!!it.tags?.length && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {(it.tags ?? []).slice(0, 4).map((t) => (
                                                    <span key={t} className="rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 px-2 py-0.5 text-[11px] font-medium">
                                                        {t}
                                                    </span>
                                                ))}
                                                {(it.tags ?? []).length > 4 && <span className="text-[11px] text-muted-foreground">+{(it.tags ?? []).length - 4}</span>}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-muted-foreground">Aucun résultat avec ces filtres.</p>
            )}

            {/* Modal */}
            <VideoModal open={open} onClose={closeModal} item={current} />
        </>
    );
}
