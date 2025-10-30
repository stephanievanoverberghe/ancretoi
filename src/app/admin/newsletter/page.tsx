// src/app/admin/newsletter/page.tsx
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter from '@/models/Newsletter';
import Link from 'next/link';
import ComposeSendForm from './ComposeSendForm';
import { Search, X, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = {
    q?: string;
    status?: 'all' | 'pending' | 'confirmed' | 'unsubscribed' | 'bounced' | 'complained';
    tag?: string; // NEW: filtre tag
    sort?: 'recent' | 'oldest' | 'alphaAsc' | 'alphaDesc';
    page?: string;
};
type SortKey = NonNullable<SearchParams['sort']>;

const PAGE_SIZE = 20;

// Filtre typé (pas de any)
type AdminFilter = {
    email?: { $regex: string; $options: string };
    status?: Exclude<SearchParams['status'], 'all'>;
    tags?: { $in: string[] }; // NEW: tag
};

// Type d’affichage des lignes (ce qu’on lit en base)
type Row = {
    _id: unknown;
    email: string;
    status?: 'pending' | 'confirmed' | 'unsubscribed' | 'bounced' | 'complained';
    tags?: string[];
    source?: string;
    createdAt?: Date;
    unsubToken?: string;
};

export default async function AdminNewsletterPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
    await requireAdmin();
    await dbConnect();

    // Compteurs globaux (pour le header)
    const [countAll, countConfirmed, countPending, countUnsub, countBounced, countComplained] = await Promise.all([
        Newsletter.countDocuments({}),
        Newsletter.countDocuments({ status: 'confirmed' }),
        Newsletter.countDocuments({ status: 'pending' }),
        Newsletter.countDocuments({ status: 'unsubscribed' }),
        Newsletter.countDocuments({ status: 'bounced' }),
        Newsletter.countDocuments({ status: 'complained' }),
    ]);

    const sp = (await searchParams) ?? {};
    const q = (sp.q ?? '').trim().toLowerCase();
    const status = (sp.status ?? 'all') as SearchParams['status'];
    const sort = (sp.sort ?? 'recent') as SortKey;
    const page = Math.max(1, Number(sp.page ?? '1'));
    const tag = (sp.tag ?? '').trim();

    const filter: AdminFilter = {};
    if (q) filter.email = { $regex: q, $options: 'i' };
    if (status !== 'all') filter.status = status;
    if (tag) filter.tags = { $in: [tag] };

    // ✅ Tri fortement typé pour éviter TS2345
    const sortObj: Record<string, 1 | -1> = sort === 'alphaAsc' ? { email: 1 } : sort === 'alphaDesc' ? { email: -1 } : sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }; // recent (default)

    const total = await Newsletter.countDocuments(filter as Record<string, unknown>);
    const docs = await Newsletter.find(filter as Record<string, unknown>)
        .sort(sortObj)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean<Row[]>()
        .exec();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Helpers URL (préserve q/status/tag/sort)
    const qp = (p: number) => {
        const ps = new URLSearchParams();
        if (q) ps.set('q', q);
        if (status) ps.set('status', status);
        if (tag) ps.set('tag', tag);
        if (sort) ps.set('sort', sort);
        ps.set('page', String(p));
        return `/admin/newsletter?${ps.toString()}`;
    };

    const exportHref = (() => {
        const ps = new URLSearchParams();
        if (q) ps.set('q', q);
        if (status && status !== 'all') ps.set('status', status);
        if (tag) ps.set('tag', tag);
        if (sort) ps.set('sort', sort);
        return `/api/admin/newsletter/export?${ps.toString()}`;
    })();

    // Lien "effacer recherche" à la manière du X client (on garde status/sort/tag)
    const clearSearchHref = (() => {
        const ps = new URLSearchParams();
        if (status) ps.set('status', status);
        if (tag) ps.set('tag', tag);
        if (sort) ps.set('sort', sort);
        // page reset à 1
        ps.set('page', '1');
        return `/admin/newsletter?${ps.toString()}`;
    })();

    return (
        <div className="space-y-6">
            {/* ===== Header verre (cohérent avec Inspirations) ===== */}
            <div className="mx-auto max-w-7xl">
                <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                    {/* Breadcrumb */}
                    <div className="text-xs text-muted-foreground">
                        <Link href="/admin" className="hover:underline">
                            Admin
                        </Link>
                        <span className="px-1.5">›</span>
                        <span className="text-foreground">Newsletter</span>
                    </div>

                    {/* Titre */}
                    <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Newsletter</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestion des contacts, filtres et envois de campagnes.</p>

                    {/* Stats (cartes) */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="text-2xl font-semibold tabular-nums">{countAll}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                            <div className="text-xs text-muted-foreground">Confirmés</div>
                            <div className="text-2xl font-semibold tabular-nums">{countConfirmed}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                            <div className="text-xs text-muted-foreground">En attente</div>
                            <div className="text-2xl font-semibold tabular-nums">{countPending}</div>
                        </div>
                        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                            <div className="text-xs text-muted-foreground">Désinscrits</div>
                            <div className="text-2xl font-semibold tabular-nums">{countUnsub}</div>
                        </div>
                    </div>

                    {/* Bandeau secondaire (Bounces / Plaintes) */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/60 ring-1 ring-black/5 p-3">
                            <div className="text-xs text-muted-foreground">Bounces</div>
                            <div className="text-xl font-semibold tabular-nums">{countBounced}</div>
                        </div>
                        <div className="rounded-xl bg-white/60 ring-1 ring-black/5 p-3">
                            <div className="text-xs text-muted-foreground">Plaintes</div>
                            <div className="text-xl font-semibold tabular-nums">{countComplained}</div>
                        </div>
                    </div>

                    {/* Actions alignées à droite (comme Inspirations) */}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <Link href={exportHref} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Export CSV
                        </Link>
                        <Link
                            href="#compose"
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                            <span aria-hidden className="text-xl leading-none">
                                ＋
                            </span>
                            <span className="hidden sm:inline">Nouvelle campagne</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== Toolbar sticky style "Inspirations" (search + 3 selects) ===== */}
            <section className="mx-auto max-w-7xl">
                <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-2 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                    {/* Search (avec icône et bouton clear style X) */}
                    <div className="relative w-full mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            name="q"
                            defaultValue={q}
                            placeholder="Rechercher un email (/)…"
                            className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-brand-500"
                            aria-label="Rechercher un contact newsletter"
                            form="nl-toolbar-form"
                        />
                        {q && (
                            <Link
                                href={clearSearchHref}
                                aria-label="Effacer la recherche"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:bg-gray-100"
                            >
                                <X className="h-4 w-4" />
                            </Link>
                        )}
                    </div>

                    {/* 2 dropdowns en rounded-full : Statut / Tag / Tri */}
                    <form id="nl-toolbar-form" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {/* Statut */}
                        <div className="relative">
                            <label htmlFor="nl-status" className="sr-only">
                                Filtrer par statut
                            </label>
                            <select
                                id="nl-status"
                                name="status"
                                defaultValue={status}
                                className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                <option value="all">Tous les statuts ({countAll})</option>
                                <option value="confirmed">Confirmés ({countConfirmed})</option>
                                <option value="pending">En attente ({countPending})</option>
                                <option value="unsubscribed">Désinscrits ({countUnsub})</option>
                                <option value="bounced">Bounces ({countBounced})</option>
                                <option value="complained">Plaintes ({countComplained})</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Tri + bouton Appliquer */}
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <div className="relative">
                                <label htmlFor="nl-sort" className="sr-only">
                                    Trier
                                </label>
                                <select
                                    id="nl-sort"
                                    name="sort"
                                    defaultValue={sort}
                                    className="w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                >
                                    <option value="recent">Récents</option>
                                    <option value="oldest">Anciens</option>
                                    <option value="alphaAsc">A → Z</option>
                                    <option value="alphaDesc">Z → A</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                            <div className="flex items-end">
                                <button className="rounded-full border border-brand-300 bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                                    Appliquer
                                </button>
                            </div>
                        </div>

                        {/* On préserve la page à 1 au submit */}
                        <input type="hidden" name="page" value="1" />
                        {/* On garde q (déjà présent via l'input search) */}
                    </form>

                    {/* Ligne info */}
                    <div className="mt-2 text-[12px] text-muted-foreground">
                        {total} contact{total > 1 ? 's' : ''} — page {page} / {totalPages}
                    </div>
                </div>
            </section>

            {/* ===== Table ===== */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Statut</th>
                            <th className="px-3 py-2 text-left">Tags</th>
                            <th className="px-3 py-2 text-left">Source</th>
                            <th className="px-3 py-2 text-left">Créé</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs.map((d) => (
                            <tr key={String(d._id)} className="border-t border-border/60">
                                <td className="px-3 py-2 break-all">{d.email}</td>
                                <td className="px-3 py-2">
                                    <span className={d.status === 'confirmed' ? 'badge-gold' : 'inline-flex rounded-md border border-border px-2 py-0.5 text-xs'}>
                                        {d.status ?? 'pending'}
                                    </span>
                                </td>
                                <td className="px-3 py-2">{Array.isArray(d.tags) && d.tags.length ? d.tags.join(', ') : <span className="text-muted-foreground">—</span>}</td>
                                <td className="px-3 py-2">{d.source ?? 'site'}</td>
                                <td className="px-3 py-2">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center justify-end gap-2">
                                        {d.status !== 'confirmed' ? (
                                            <form action="/api/admin/newsletter/status" method="post">
                                                <input type="hidden" name="email" value={d.email} />
                                                <input type="hidden" name="status" value="confirmed" />
                                                <button className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:bg-brand-50">Confirmer</button>
                                            </form>
                                        ) : (
                                            <form action="/api/admin/newsletter/status" method="post">
                                                <input type="hidden" name="email" value={d.email} />
                                                <input type="hidden" name="status" value="unsubscribed" />
                                                <button className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:bg-brand-50">Désinscrire</button>
                                            </form>
                                        )}
                                        {d.unsubToken ? (
                                            <a
                                                className="rounded-lg border border-border px-2.5 py-1.5 text-xs transition hover:bg-brand-50"
                                                href={`/api/newsletter/unsubscribe?token=${d.unsubToken}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Lien désinscription
                                            </a>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!docs.length && (
                            <tr>
                                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>
                                    Aucun résultat
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ===== Pagination ===== */}
            {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2">
                    <Link href={qp(Math.max(1, page - 1))} className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-brand-50">
                        ← Précédent
                    </Link>
                    <span className="text-sm text-muted-foreground">
                        Page {page} / {totalPages}
                    </span>
                    <Link href={qp(Math.min(totalPages, page + 1))} className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-brand-50">
                        Suivant →
                    </Link>
                </nav>
            )}

            {/* ===== Compose & Send ===== */}
            <div id="compose" className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-lg font-semibold">Envoyer une campagne</h2>
                <p className="mb-3 text-sm text-muted-foreground">Envoi HTML via Resend. Tu peux faire un envoi test à une adresse avant l’envoi global.</p>
                <ComposeSendForm />
            </div>
        </div>
    );
}
