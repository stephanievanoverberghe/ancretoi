// src/components/blog/BlogGalleryClient.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowUpDown, X, ChevronDown } from 'lucide-react';
import type { BlogItem } from '@/app/blog/page';

type SortKey = 'recent' | 'alphaAsc' | 'alphaDesc' | 'short' | 'long';

const LS_KEY = 'blog:list:v2';
type Persisted = { q: string; sort: SortKey; tag: string | null; category: string | null };

/* ---------- Utils ---------- */
function normalizePublicPath(p?: string | null) {
    if (!p) return '';
    return p.startsWith('/') ? p : `/${p}`;
}
function formatDateSafe(d?: string | Date | null) {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
}
function formatDateHuman(d?: string | Date | null) {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ---------- Component ---------- */
export default function BlogGalleryClient({ items }: { items: BlogItem[] }) {
    // search with `/` focus + debounce + clear
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

    // sorting + filters
    const [sort, setSort] = useState<SortKey>('recent');
    const [tag, setTag] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);

    // persistence
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const s = JSON.parse(raw) as Partial<Persisted>;
                setQRaw(s.q ?? '');
                setQ(s.q ?? '');
                setSort((s.sort as SortKey) ?? 'recent');
                setTag(s.tag ?? null);
                setCategory(s.category ?? null);
            }
        } catch {}
    }, []);
    useEffect(() => {
        const s: Persisted = { q, sort, tag, category };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, sort, tag, category]);

    // taxonomies
    const allTags = useMemo(() => {
        const set = new Set<string>();
        for (const it of items) (it.tags ?? []).forEach((t) => t && set.add(t));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }, [items]);

    const allCategories = useMemo(() => {
        const set = new Set<string>();
        for (const it of items) if (it.category) set.add(it.category);
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }, [items]);

    // filtrage + tri
    const list = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const filtered = items.filter((it) => {
            if (tag && !(it.tags ?? []).includes(tag)) return false;
            if (category && it.category !== category) return false;
            if (!ql) return true;
            const hay = `${it.title ?? ''} ${it.summary ?? ''} ${(it.tags ?? []).join(' ')} ${it.category ?? ''}`.toLowerCase();
            return hay.includes(ql);
        });

        filtered.sort((a, b) => {
            if (sort === 'alphaAsc') return (a.title ?? '').localeCompare(b.title ?? '', 'fr', { sensitivity: 'base' });
            if (sort === 'alphaDesc') return (b.title ?? '').localeCompare(a.title ?? '', 'fr', { sensitivity: 'base' });
            if (sort === 'short') return (a.readingTimeMin ?? 9999) - (b.readingTimeMin ?? 9999);
            if (sort === 'long') return (b.readingTimeMin ?? 0) - (a.readingTimeMin ?? 0);
            const aa = formatDateSafe(a.publishedAt);
            const bb = formatDateSafe(b.publishedAt);
            return bb.localeCompare(aa);
        });

        return filtered;
    }, [items, q, sort, tag, category]);

    return (
        <>
            {/* ===== Toolbar sticky (style admin) ===== */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                {/* Search */}
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, titre, résumé, tag, catégorie)…"
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

                {/* Dropdown row (3 cols) */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {/* Catégorie */}
                    <div className="relative">
                        <label htmlFor="blog-category" className="sr-only">
                            Filtrer par catégorie
                        </label>
                        <select
                            id="blog-category"
                            value={category ?? ''}
                            onChange={(e) => setCategory(e.target.value || null)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="">Toutes les catégories</option>
                            {allCategories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tag */}
                    <div className="relative">
                        <label htmlFor="blog-tag" className="sr-only">
                            Filtrer par tag
                        </label>
                        <select
                            id="blog-tag"
                            value={tag ?? ''}
                            onChange={(e) => setTag(e.target.value || null)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="">Tous les tags</option>
                            {allTags.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tri */}
                    <div className="relative">
                        <label htmlFor="blog-sort" className="sr-only">
                            Trier
                        </label>
                        <select
                            id="blog-sort"
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="recent">Récents</option>
                            <option value="alphaAsc">A → Z</option>
                            <option value="alphaDesc">Z → A</option>
                            <option value="short">Lecture la + courte</option>
                            <option value="long">Lecture la + longue</option>
                        </select>
                        <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </section>

            {/* ===== Grid ===== */}
            {list.length ? (
                <ul className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => {
                        const src = normalizePublicPath(p.coverPath);
                        const alt = (p.coverAlt && p.coverAlt.trim()) || 'Image de couverture';
                        const date = formatDateHuman(p.publishedAt);
                        return (
                            <li
                                key={p.slug}
                                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <Link href={`/blog/${p.slug}`} aria-label={p.title || 'Lire l’article'} className="block">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                                        {src ? (
                                            <Image
                                                src={src}
                                                alt={alt}
                                                fill
                                                sizes="(max-width: 768px) 92vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-400">—</div>
                                        )}
                                        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                                            {date && <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground ring-1 ring-border">{date}</span>}
                                            {typeof p.readingTimeMin === 'number' && (
                                                <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] text-secondary-800 ring-1 ring-border">{p.readingTimeMin} min</span>
                                            )}
                                            {p.category && <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] ring-1 ring-border">{p.category}</span>}
                                        </div>
                                    </div>
                                </Link>

                                <div className="h-px w-full bg-gold-100/80" aria-hidden />

                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                    <header>
                                        <h3 className="font-serif text-[clamp(1rem,2.6vw,1.15rem)] leading-snug">
                                            <Link href={`/blog/${p.slug}`} className="transition-colors hover:text-brand-700">
                                                {(p.title || '').trim() || 'Sans titre'}
                                            </Link>
                                        </h3>
                                    </header>

                                    {p.summary && <p className="mt-2 line-clamp-3 text-[15px] text-brand-900">{p.summary}</p>}

                                    {p.tags?.length ? (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {p.tags.slice(0, 5).map((t) => (
                                                <span
                                                    key={`${p.slug}-${t}`}
                                                    className="inline-flex items-center rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 px-2 py-0.5 text-[11px] font-medium"
                                                >
                                                    #{t}
                                                </span>
                                            ))}
                                            {p.tags.length > 5 && <span className="text-[11px] text-muted-foreground">+{p.tags.length - 5}</span>}
                                        </div>
                                    ) : null}

                                    <div className="mt-4">
                                        <Link
                                            href={`/blog/${p.slug}`}
                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm transition hover:bg-brand-50/60 hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 sm:w-auto"
                                        >
                                            Lire l’article
                                            <span
                                                className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold-50 ring-1 ring-gold-200 transition-transform group-hover:translate-x-[2px]"
                                                aria-hidden
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24">
                                                    <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-muted-foreground">Aucun résultat avec ces filtres.</p>
            )}
        </>
    );
}
