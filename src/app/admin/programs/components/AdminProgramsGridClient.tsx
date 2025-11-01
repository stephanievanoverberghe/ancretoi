'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { BadgeCheck, Search, Eye, Calendar, Clock3, Tag, ExternalLink, Lock, X, PencilLine, ChevronDown, CheckCircle2 } from 'lucide-react';
import DeleteProgramButton from '@/app/admin/programs/components/DeleteProgramButton';
import CreationSuccessModal from './CreationSuccessModal';

/* ===================== Types ===================== */

export type AdminProgramRow = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    title: string;
    coverUrl: string | null;
    coverAlt: string | null;
    price: { amountCents: number | null; currency: 'EUR' | string };
    meta: {
        durationDays: number | null;
        estMinutesPerDay: number | null;
        level: 'Basique' | 'Cible' | 'Premium' | null;
        tags: string[];
    };
    stats: { unitsCount: number };
    timestamps: { createdAt: string | null; updatedAt: string | null };
};

type StatusFilter = 'all' | 'draft' | 'preflight' | 'published';
type LevelFilter = '' | 'Basique' | 'Cible' | 'Premium';
type SortKey = 'recent' | 'alphaAsc' | 'alphaDesc';

/* ===================== Utils ===================== */

function formatPrice(p: AdminProgramRow['price']) {
    if (p.amountCents == null) return 'Bientôt';
    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: (p.currency ?? 'EUR').toUpperCase(),
        }).format(p.amountCents / 100);
    } catch {
        const amount = (p.amountCents / 100).toFixed(2);
        return `${amount} ${(p.currency ?? 'EUR').toUpperCase()}`;
    }
}

function StatusBadge({ s }: { s: AdminProgramRow['status'] }) {
    const map = {
        draft: 'bg-zinc-100 text-zinc-800 ring-zinc-200',
        preflight: 'bg-amber-100 text-amber-800 ring-amber-200',
        published: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    } as const;
    const label = s === 'draft' ? 'Brouillon' : s === 'preflight' ? 'Préflight' : 'Publié';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${map[s]}`}>{label}</span>;
}

function LevelBadge({ level }: { level: AdminProgramRow['meta']['level'] }) {
    if (!level) return null;
    const colors =
        level === 'Basique'
            ? 'bg-brand-50 text-brand-900 ring-brand-200'
            : level === 'Cible'
            ? 'bg-secondary-50 text-secondary-900 ring-secondary-200'
            : 'bg-gold-50 text-gold-900 ring-gold-200';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${colors}`}>{level}</span>;
}

/* ============== Deletion Success Modal (inline) ============== */
function DeletionSuccessModal() {
    const search = useSearchParams();
    const router = useRouter();
    const show = search.get('deleted') === '1';
    const slug = (search.get('slug') ?? '').trim().toLowerCase();
    const [open, setOpen] = useState(show);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setOpen(show), [show]);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);

    if (!open || !mounted) return null;

    const onClose = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('deleted');
        url.searchParams.delete('slug');
        router.replace(url.pathname + (url.search || ''));
        setOpen(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-brand-100/70">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
                        <div>
                            <div className="text-lg font-semibold">Programme supprimé</div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                <span className="font-medium">{slug || '—'}</span> a été supprimé avec succès.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                        <button onClick={onClose} className="rounded-md bg-purple-600 px-3 py-2 text-white hover:bg-purple-700">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ================= Modal Quick View ================= */

function QuickViewModal({ open, onClose, row }: { open: boolean; onClose: () => void; row: AdminProgramRow | null }) {
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

    const priceLabel = formatPrice(row.price);
    const missing: string[] = [];
    if (!row.coverUrl) missing.push('Image (card)');
    if (row.price.amountCents == null) missing.push('Prix');
    if (!row.meta.durationDays) missing.push('Durée (jours)');
    if (!row.meta.estMinutesPerDay) missing.push('Charge (min/j)');
    if (!row.meta.level) missing.push('Niveau');

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-brand-100">
                    {/* Cover */}
                    <div className="relative h-48 w-full bg-gray-100">
                        {row.coverUrl ? (
                            <Image src={row.coverUrl} alt={row.coverAlt ?? ''} fill sizes="100vw" className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">Aucune image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="truncate text-white drop-shadow">
                                <div className="text-xs opacity-90">{row.programSlug}</div>
                                <div className="truncate font-semibold text-lg leading-tight">{row.title}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge s={row.status} />
                                <LevelBadge level={row.meta.level} />
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="rounded-lg border p-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <Calendar className="h-4 w-4" /> Jours
                                    </div>
                                    <div className="font-semibold">{row.meta.durationDays ?? '—'}</div>
                                </div>
                                <div className="rounded-lg border p-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <Clock3 className="h-4 w-4" /> Min / jour
                                    </div>
                                    <div className="font-semibold">{row.meta.estMinutesPerDay ?? '—'}</div>
                                </div>
                                <div className="rounded-lg border p-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                        <BadgeCheck className="h-4 w-4" /> Prix
                                    </div>
                                    <div className="font-semibold">{priceLabel}</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Tag className="h-3.5 w-3.5" /> Tags:
                                </span>
                                {row.meta.tags?.length ? (
                                    row.meta.tags.map((t) => (
                                        <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                            {t}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Créé le {row.timestamps.createdAt ? new Date(row.timestamps.createdAt).toLocaleString('fr-FR') : '—'} • Maj le{' '}
                                {row.timestamps.updatedAt ? new Date(row.timestamps.updatedAt).toLocaleString('fr-FR') : '—'}
                            </div>

                            {missing.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">⚠️ À compléter : {missing.join(', ')}.</div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Link href={`/admin/programs/${row.programSlug}/edit`} className="btn w-full justify-center">
                                Éditer
                            </Link>

                            {row.status === 'published' ? (
                                <Link
                                    href={`/programs/${row.programSlug}`}
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Voir la page publique <ExternalLink className="h-4 w-4" />
                                </Link>
                            ) : (
                                <div className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
                                    <Lock className="h-4 w-4" /> Non publié
                                </div>
                            )}

                            <div className="pt-1 [&>button]:w-full">
                                {/* après suppression, on revient ici avec ?deleted=1&slug=... */}
                                <DeleteProgramButton slug={row.programSlug} afterDelete="redirect" />
                            </div>

                            <div className="pt-2">
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
            </div>
        </div>,
        document.body
    );
}

/* ==================== Grid + Toolbar ==================== */

const LS_KEY = 'adminProgramsToolbar:v9';

type PersistedState = {
    q: string;
    status: StatusFilter;
    level: LevelFilter; // '' => tous
    tag: string; // '' => tous
    sort: SortKey;
};

export default function AdminProgramsGridClient({ rows }: { rows: AdminProgramRow[] }) {
    // Modales succès
    const _showCreationSuccess = <CreationSuccessModal />;
    const _showDeletionSuccess = <DeletionSuccessModal />;

    /** Recherche (debounce) + raccourci "/" */
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

    /** Dropdowns: Statut / Niveau / Tag / Tri */
    const [status, setStatus] = useState<StatusFilter>('all');
    const [level, setLevel] = useState<LevelFilter>('');
    const [sort, setSort] = useState<SortKey>('recent');

    const uniqueTags = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => r.meta.tags?.forEach((t) => t && set.add(t)));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }, [rows]);
    const [tag, setTag] = useState<string>('');

    /** Persistance */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw) as Partial<PersistedState>;
            setQRaw(s.q ?? '');
            setQ(s.q ?? '');
            setStatus((s.status as StatusFilter) ?? 'all');
            setLevel((s.level as LevelFilter) ?? '');
            setTag(typeof s.tag === 'string' ? s.tag : '');
            setSort((s.sort as SortKey) ?? 'recent');
        } catch {
            /* ignore */
        }
    }, []);
    useEffect(() => {
        const s: PersistedState = { q, status, level, tag, sort };
        localStorage.setItem(LS_KEY, JSON.stringify(s));
    }, [q, status, level, tag, sort]);

    /** Stats pour libellés Statut */
    const stats = useMemo(() => {
        const total = rows.length;
        const by = rows.reduce(
            (acc, r) => {
                if (r.status === 'draft') acc.draft += 1;
                else if (r.status === 'preflight') acc.preflight += 1;
                else acc.published += 1;
                return acc;
            },
            { draft: 0, preflight: 0, published: 0 }
        );
        return { total, ...by };
    }, [rows]);

    /** Filtrage + tri */
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const passes = (r: AdminProgramRow) => {
            if (status !== 'all' && r.status !== status) return false;
            if (level && r.meta.level !== level) return false;
            if (tag && !r.meta.tags.includes(tag)) return false;
            if (ql) {
                const hay = `${r.title} ${r.programSlug} ${r.meta.tags.join(' ')}`.toLowerCase();
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
    }, [rows, q, status, level, tag, sort]);

    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const current = useMemo(() => rows.find((r) => r.programSlug === openSlug) ?? null, [openSlug, rows]);

    /* ======== Toolbar + Grid ======== */
    return (
        <>
            {/* Modales succès (invisibles, mais montées dans le DOM) */}
            {_showCreationSuccess}
            {_showDeletionSuccess}

            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                {/* Search */}
                <div className="relative w-full mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchRef}
                        placeholder="Rechercher (/, titre, slug, tag)…"
                        value={qRaw}
                        onChange={(e) => setQRaw(e.target.value)}
                        className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                        aria-label="Rechercher un programme"
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
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    {/* Statut */}
                    <div className="relative">
                        <label htmlFor="pg-status" className="sr-only">
                            Filtrer par statut
                        </label>
                        <select
                            id="pg-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as StatusFilter)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="all">Tous les statuts ({stats.total})</option>
                            <option value="published">Publiés ({stats.published})</option>
                            <option value="preflight">Préflight ({stats.preflight})</option>
                            <option value="draft">Brouillons ({stats.draft})</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Niveau */}
                    <div className="relative">
                        <label htmlFor="pg-level" className="sr-only">
                            Filtrer par niveau
                        </label>
                        <select
                            id="pg-level"
                            value={level}
                            onChange={(e) => setLevel(e.target.value as LevelFilter)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="">Tous les niveaux</option>
                            <option value="Basique">Basique</option>
                            <option value="Cible">Cible</option>
                            <option value="Premium">Premium</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tag */}
                    <div className="relative">
                        <label htmlFor="pg-tag" className="sr-only">
                            Filtrer par tag
                        </label>
                        <select
                            id="pg-tag"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            <option value="">Tous les tags</option>
                            {uniqueTags.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Tri */}
                    <div className="relative">
                        <label htmlFor="pg-sort" className="sr-only">
                            Trier les programmes
                        </label>
                        <select
                            id="pg-sort"
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

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucun programme ne correspond.</p>
                    <div className="mt-3">
                        <Link
                            href="/admin/programs/new"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                        >
                            <span aria-hidden>＋</span> Nouveau programme
                        </Link>
                    </div>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((r) => (
                        <li
                            key={r.programSlug}
                            className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            {/* Cover */}
                            <div className="relative aspect-[16/10] w-full bg-gray-100">
                                {r.coverUrl ? (
                                    <Image src={r.coverUrl} alt={r.coverAlt ?? ''} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px" className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">Aucune image</div>
                                )}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-90 transition group-hover:opacity-100" />
                                <div className="absolute right-2 top-2 flex items-center gap-1">
                                    <StatusBadge s={r.status} />
                                    <LevelBadge level={r.meta.level} />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                                <div className="text-xs text-gray-500">{r.programSlug}</div>
                                <h3 className="line-clamp-2 text-base font-semibold sm:text-lg">{r.title}</h3>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                    <span>{formatPrice(r.price)}</span>
                                    {r.meta.durationDays ? (
                                        <>
                                            <span>•</span>
                                            <span>{r.meta.durationDays} j</span>
                                        </>
                                    ) : null}
                                    {r.meta.estMinutesPerDay ? (
                                        <>
                                            <span>•</span>
                                            <span>{r.meta.estMinutesPerDay} min/j</span>
                                        </>
                                    ) : null}
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <Link
                                        href={`/admin/programs/${r.programSlug}/edit`}
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100"
                                    >
                                        <PencilLine className="h-4 w-4" /> Éditer
                                    </Link>
                                    <button
                                        onClick={() => setOpenSlug(r.programSlug)}
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100 cursor-pointer"
                                    >
                                        <Eye className="h-4 w-4" /> Aperçu
                                    </button>

                                    <div className="col-span-2 [&>button]:w-full">
                                        <DeleteProgramButton slug={r.programSlug} afterDelete="redirect" />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* QuickView */}
            <QuickViewModal open={!!openSlug} onClose={() => setOpenSlug(null)} row={current} />
        </>
    );
}
