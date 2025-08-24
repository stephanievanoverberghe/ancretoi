// src/app/admin/newsletter/page.tsx
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter from '@/models/Newsletter';
import Link from 'next/link';
import ComposeSendForm from './ComposeSendForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = {
    q?: string;
    status?: 'all' | 'pending' | 'confirmed' | 'unsubscribed' | 'bounced' | 'complained';
    page?: string;
};

const PAGE_SIZE = 20;

// Filtre typé (pas de any)
type AdminFilter = {
    email?: { $regex: string; $options: string };
    status?: Exclude<SearchParams['status'], 'all'>;
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

    const sp = (await searchParams) ?? {};
    const q = (sp.q ?? '').trim().toLowerCase();
    const status = (sp.status ?? 'all') as SearchParams['status'];
    const page = Math.max(1, Number(sp.page ?? '1'));

    const filter: AdminFilter = {};
    if (q) filter.email = { $regex: q, $options: 'i' };
    if (status !== 'all') filter.status = status;

    const total = await Newsletter.countDocuments(filter as Record<string, unknown>);
    const docs = await Newsletter.find(filter as Record<string, unknown>)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean<Row[]>()
        .exec();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const qp = (p: number) => {
        const ps = new URLSearchParams();
        if (q) ps.set('q', q);
        if (status) ps.set('status', status);
        ps.set('page', String(p));
        return `/admin/newsletter?${ps.toString()}`;
    };

    const exportHref = (() => {
        const ps = new URLSearchParams();
        if (q) ps.set('q', q);
        if (status && status !== 'all') ps.set('status', status);
        return `/api/admin/newsletter/export?${ps.toString()}`;
    })();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Newsletter</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} contact{total > 1 ? 's' : ''} — filtrés par vos critères.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={exportHref} className="rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-brand-50">
                        Export CSV
                    </Link>
                </div>
            </div>

            {/* Filtres */}
            <form className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Recherche</label>
                    <input
                        type="search"
                        name="q"
                        defaultValue={q}
                        placeholder="email@exemple.com"
                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Statut</label>
                    <select
                        name="status"
                        defaultValue={status}
                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                    >
                        <option value="all">Tous</option>
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="unsubscribed">Désinscrit</option>
                        <option value="bounced">Bounce</option>
                        <option value="complained">Plainte</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button className="btn w-full">Filtrer</button>
                </div>
            </form>

            {/* Table */}
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
                                <td className="px-3 py-2">{d.email}</td>
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

            {/* Pagination */}
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

            {/* Compose & Send */}
            <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-lg font-semibold">Envoyer une campagne</h2>
                <p className="mb-3 text-sm text-muted-foreground">Envoi HTML via Resend. Tu peux faire un envoi test à une adresse avant l’envoi global.</p>

                <ComposeSendForm />
            </div>
        </div>
    );
}
