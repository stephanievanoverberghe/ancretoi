// app/admin/page.tsx
import 'server-only';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import { PostModel, InspirationModel, UserModel } from '@/db/schemas';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';

type NewsletterRow = Pick<NewsletterDoc, 'email' | 'status' | 'createdAt' | 'source'> & { _id: unknown };

type ProgramRow = {
    programSlug: string;
    title?: string; // dérivé de hero.title
    status: 'draft' | 'published';
    unitsCount: number;
};

// Shape minimal lu depuis ProgramPage
type PgLean = {
    programSlug: string;
    status: 'draft' | 'published';
    hero?: { title?: string | null } | null;
};

export default async function AdminHome() {
    await requireAdmin();
    await dbConnect();

    const [programsCount, posts, videos, users, nlTotal, nlConfirmed, nlPending, nlUnsub, latest, pages] = await Promise.all([
        ProgramPage.countDocuments(),
        PostModel.countDocuments({ status: 'published' }),
        InspirationModel.countDocuments({ status: 'published' }),
        UserModel.countDocuments({ deletedAt: null }),

        Newsletter.countDocuments({}),
        Newsletter.countDocuments({ status: 'confirmed' as const }),
        Newsletter.countDocuments({ status: 'pending' as const }),
        Newsletter.countDocuments({ status: 'unsubscribed' as const }),

        Newsletter.find().sort({ createdAt: -1 }).limit(6).select({ email: 1, status: 1, createdAt: 1, source: 1 }).lean<NewsletterRow[]>().exec(),

        ProgramPage.find().select({ programSlug: 1, status: 1, hero: 1 }).sort({ createdAt: -1 }).lean<PgLean[]>(), // ✅ tableau typé
    ]);

    const programs: ProgramRow[] = await Promise.all(
        pages.map(async (p: PgLean) => {
            const unitsCount = await Unit.countDocuments({ programSlug: p.programSlug, unitType: 'day' });
            const title = typeof p.hero?.title === 'string' && p.hero.title.length > 0 ? p.hero.title : undefined;
            return { programSlug: p.programSlug, title, status: p.status, unitsCount };
        })
    );

    return (
        <div className="space-y-6">
            {/* KPIs contenus / users */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card p-4">
                    <div className="text-sm text-muted-foreground">Parcours (pages)</div>
                    <div className="mt-1 text-2xl font-semibold">{programsCount}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-muted-foreground">Articles publiés</div>
                    <div className="mt-1 text-2xl font-semibold">{posts}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-muted-foreground">Inspirations publiées</div>
                    <div className="mt-1 text-2xl font-semibold">{videos}</div>
                </div>
                <div className="card p-4">
                    <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
                    <div className="mt-1 text-2xl font-semibold">{users}</div>
                </div>
            </div>

            {/* Programmes (ProgramPage + Units) */}
            <div className="card p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Programmes</h2>
                    <Link href="/admin/programs/new" className="text-sm text-brand-700 hover:underline">
                        + Nouveau
                    </Link>
                </div>

                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left">Slug</th>
                                <th className="px-3 py-2 text-left">Titre (hero)</th>
                                <th className="px-3 py-2 text-left">Statut</th>
                                <th className="px-3 py-2 text-left">Unités</th>
                                <th className="px-3 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.map((p) => (
                                <tr key={p.programSlug} className="border-t border-border/60">
                                    <td className="px-3 py-2">{p.programSlug}</td>
                                    <td className="px-3 py-2">{p.title ?? '—'}</td>
                                    <td className="px-3 py-2">{p.status}</td>
                                    <td className="px-3 py-2">{p.unitsCount}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-2">
                                            <Link href={`/admin/programs/${p.programSlug}/units`} className="text-brand-700 hover:underline">
                                                Jours
                                            </Link>
                                            <Link href={`/admin/programs/${p.programSlug}/page`} className="text-brand-700 hover:underline">
                                                Landing
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!programs.length && (
                                <tr>
                                    <td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>
                                        Aucun programme
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Newsletter — KPIs + lien */}
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="card p-4 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Contacts newsletter</div>
                            <div className="mt-1 text-3xl font-semibold">{nlTotal}</div>
                        </div>
                        <Link href="/admin/newsletter" className="rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-brand-50">
                            Ouvrir
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border p-3">
                            <div className="text-xs text-muted-foreground">Confirmés</div>
                            <div className="mt-1 text-xl font-semibold">{nlConfirmed}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <div className="text-xs text-muted-foreground">En attente</div>
                            <div className="mt-1 text-xl font-semibold">{nlPending}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <div className="text-xs text-muted-foreground">Désinscrits</div>
                            <div className="mt-1 text-xl font-semibold">{nlUnsub}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <div className="text-xs text-muted-foreground">Taux conf. (approx)</div>
                            <div className="mt-1 text-xl font-semibold">{nlTotal ? Math.round((nlConfirmed / nlTotal) * 100) : 0}%</div>
                        </div>
                    </div>
                </div>

                {/* Derniers inscrits */}
                <div className="card p-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Dernières inscriptions</h2>
                        <Link href="/admin/newsletter" className="text-sm text-brand-700 hover:underline">
                            Voir tout →
                        </Link>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left">Email</th>
                                    <th className="px-3 py-2 text-left">Statut</th>
                                    <th className="px-3 py-2 text-left">Source</th>
                                    <th className="px-3 py-2 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latest.map((r) => (
                                    <tr key={String(r._id)} className="border-t border-border/60">
                                        <td className="px-3 py-2">{r.email}</td>
                                        <td className="px-3 py-2">
                                            <span className={r.status === 'confirmed' ? 'badge-gold' : 'inline-flex rounded-md border border-border px-2 py-0.5 text-xs'}>
                                                {r.status ?? 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{r.source ?? 'site'}</td>
                                        <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</td>
                                    </tr>
                                ))}
                                {!latest.length && (
                                    <tr>
                                        <td className="px-3 py-8 text-center text-muted-foreground" colSpan={4}>
                                            Aucune inscription récente
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
