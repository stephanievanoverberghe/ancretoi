import 'server-only';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { PostModel, CategoryModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getStats() {
    await dbConnect();
    const [total, published, draft, archived, categories] = await Promise.all([
        PostModel.countDocuments({ deletedAt: null }),
        PostModel.countDocuments({ status: 'published', deletedAt: null }),
        PostModel.countDocuments({ status: 'draft', deletedAt: null }),
        PostModel.countDocuments({ deletedAt: { $ne: null } }),
        CategoryModel.countDocuments({}),
    ]);

    const last = await PostModel.findOne({ deletedAt: null })
        .select({ title: 1, slug: 1, updatedAt: 1, status: 1 })
        .sort({ updatedAt: -1 })
        .lean<{ title?: string; slug: string; updatedAt?: Date; status: 'draft' | 'published' } | null>();

    return { total, published, draft, archived, categories, last };
}

export default async function BlogHubPage() {
    await requireAdmin();
    const s = await getStats();

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/admin" className="hover:underline">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Blog</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Blog</h1>
                <p className="text-sm text-muted-foreground mt-1">Centre de commande : articles, catégories, SEO, archives.</p>

                {/* KPIs */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Kpi label="Total" value={s.total} />
                    <Kpi label="Publiés" value={s.published} />
                    <Kpi label="Brouillons" value={s.draft} />
                    <Kpi label="Archivés" value={s.archived} />
                    <Kpi label="Catégories" value={s.categories} />
                </div>

                {s.last && (
                    <div className="mt-4 rounded-xl bg-white/70 ring-1 ring-black/5 p-4 text-sm">
                        <div className="text-xs text-muted-foreground">Dernière mise à jour</div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{s.last.title || s.last.slug}</span>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] ring-1 ring-zinc-200">{s.last.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                            <span className="text-xs text-muted-foreground">{s.last.updatedAt ? new Date(s.last.updatedAt).toLocaleString('fr-FR') : '—'}</span>
                            <Link href={`/admin/blog/posts/${s.last.slug}`} className="ml-auto rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">
                                Éditer
                            </Link>
                            <Link href={`/blog/${s.last.slug}`} target="_blank" className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">
                                Voir public
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions principales */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ActionCard
                    title="Articles"
                    description="Lister, rechercher, éditer et publier des billets."
                    primary={{ href: '/admin/blog/posts', label: 'Ouvrir la liste' }}
                    secondary={{ href: '/admin/blog/posts/new', label: 'Nouvel article' }}
                />
                <ActionCard
                    title="Catégories"
                    description="Créer, renommer, illustrer et colorer vos catégories."
                    primary={{ href: '/admin/blog/categories', label: 'Gérer les catégories' }}
                    secondary={{ href: '/admin/blog/categories/new', label: 'Nouvelle catégorie' }}
                />
                <ActionCard
                    title="Archives"
                    description="Consulter et restaurer (ou supprimer) les billets archivés."
                    primary={{ href: '/admin/blog/posts/archives', label: 'Voir les archives' }}
                />
                <ActionCard
                    title="SEO & Taxonomie"
                    description="Vérifier titres/desc SEO, tags et cohérence des slugs."
                    primary={{ href: '/admin/blog/posts?view=seo', label: 'Ouvrir (vue SEO)' }}
                />
                <ActionCard
                    title="Brouillons"
                    description="Finaliser les écrits en cours et planifier les publications."
                    primary={{ href: '/admin/blog/posts?status=draft', label: 'Voir les brouillons' }}
                />
                <ActionCard
                    title="Mis en avant"
                    description="Mettre en avant des billets sur la page publique."
                    primary={{ href: '/admin/blog/posts?featured=1', label: 'Filtre “featured”' }}
                />
            </section>
        </div>
    );
}

/* ====== UI subcomponents ====== */
function Kpi({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}

function ActionCard(props: { title: string; description: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
    const { title, description, primary, secondary } = props;
    return (
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm ring-1 ring-white/40">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                    href={primary.href}
                    className="rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
                >
                    {primary.label}
                </Link>
                {secondary ? (
                    <Link href={secondary.href} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                        {secondary.label}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
