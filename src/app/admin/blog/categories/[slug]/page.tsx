// src/app/admin/categories/[slug]/page.tsx
import 'server-only';

import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { CategoryModel } from '@/db/schemas';

import DeleteCategoryButton from '../components/DeleteCategoryButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type CategoryDoc = {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    color: string | null;
    icon: string | null;
    imagePath: string | null;
    imageAlt: string | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
};

function slugify(input: string): string {
    return (input || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function sanitizeLocalPath(p: string): string {
    const s = (p || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) throw new Error('Utilise un chemin local situé dans /public (ex: /images/blog/categories/cover.jpg).');
    return s.startsWith('/') ? s : `/${s}`;
}

const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

/* =========================
   Actions serveur
   ========================= */
async function updateCategory(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();

    const id = String(formData.get('id') ?? '');
    if (!id) throw new Error('ID manquant.');

    const name = String(formData.get('name') ?? '').trim();
    if (!name) throw new Error('Nom requis.');

    const slugInput = String(formData.get('slug') ?? '').trim();
    const nextSlug = slugInput ? slugify(slugInput) : slugify(name);

    const description = String(formData.get('description') ?? '').trim();
    const colorRaw = String(formData.get('color') ?? '').trim();
    const color = colorRaw || null;

    const iconRaw = String(formData.get('icon') ?? '').trim();
    const icon = iconRaw || null;

    const imageRaw = String(formData.get('imagePath') ?? '').trim();
    const imagePath = imageRaw ? sanitizeLocalPath(imageRaw) : null;

    const imageAltRaw = String(formData.get('imageAlt') ?? '').trim();
    const imageAlt = imageAltRaw || null;

    // Unicité du slug (hors catégorie courante)
    const owner = await CategoryModel.findOne({ slug: nextSlug, deletedAt: null }).select({ _id: 1 }).lean();
    if (owner && String(owner._id) !== id) {
        throw new Error('Ce slug est déjà utilisé par une autre catégorie.');
    }

    const updated = await CategoryModel.findByIdAndUpdate(
        id,
        { $set: { name, slug: nextSlug, description, color, icon, imagePath, imageAlt } },
        { new: true }
    ).lean<CategoryDoc | null>();

    if (!updated) throw new Error('Catégorie introuvable après mise à jour.');

    // Revalidate zones qui consomment les catégories
    revalidatePath('/admin/blog/categories');
    revalidatePath('/admin/blog');
    revalidatePath('/admin/blog/posts');
    revalidatePath('/admin/blog/posts/new');
    revalidatePath('/admin/blog/categories/new');

    const origSlug = String(formData.get('origSlug') ?? '');
    if (origSlug && origSlug !== updated.slug) {
        redirect(`/admin/categories/${updated.slug}?renamed=1`);
    }
}

async function deleteCategory(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();

    const id = String(formData.get('id') ?? '');
    if (!id) throw new Error('ID manquant.');

    const deleted = await CategoryModel.findByIdAndDelete(id).lean<CategoryDoc | null>();
    if (!deleted) throw new Error('Catégorie introuvable ou déjà supprimée.');

    // Revalidate + retour liste
    revalidatePath('/admin/blog/categories');
    revalidatePath('/admin/blog');

    redirect('/admin/blog/categories?deleted=1');
}

/* =========================
   Page
   ========================= */
export default async function EditCategoryPage(props: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    const { slug } = await props.params;

    const doc = await CategoryModel.findOne({ slug, deletedAt: null })
        .select({
            _id: 1,
            name: 1,
            slug: 1,
            description: 1,
            color: 1,
            icon: 1,
            imagePath: 1,
            imageAlt: 1,
            createdAt: 1,
            updatedAt: 1,
        })
        .lean<CategoryDoc | null>();

    if (!doc) notFound();

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/blog/categories" className="hover:underline">
                                Catégories
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Éditer</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{doc.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">/{doc.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/blog/categories" className="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Retour liste
                        </Link>
                    </div>
                </div>
            </div>

            {/* Form edition + Preview côte à côte */}
            <form action={updateCategory} className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
                {/* === Formulaire === */}
                <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                    <input type="hidden" name="id" defaultValue={String(doc._id)} />
                    <input type="hidden" name="origSlug" defaultValue={doc.slug} />

                    <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Nom *</div>
                            <input name="name" defaultValue={doc.name} required className="w-full rounded-xl border bg-white px-3 py-2" placeholder="Ex : Émotions" />
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Slug</div>
                            <input name="slug" defaultValue={doc.slug} className="w-full rounded-xl border bg-white px-3 py-2" placeholder="ex: emotions" />
                            <p className="mt-1 text-[11px] text-gray-500">Si vide, il sera régénéré depuis le nom.</p>
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Couleur (hex)</div>
                            <input name="color" defaultValue={doc.color ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" placeholder="#9b87f5" />
                            <p className="mt-1 text-[11px] text-gray-500">Optionnel. Ex: #9b87f5</p>
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Icône (nom Lucide/emoji)</div>
                            <input name="icon" defaultValue={doc.icon ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" placeholder="sparkles" />
                            <p className="mt-1 text-[11px] text-gray-500">Optionnel (texte libre).</p>
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Image (chemin local /public)</div>
                            <input
                                name="imagePath"
                                defaultValue={doc.imagePath ?? ''}
                                className="w-full rounded-xl border bg-white px-3 py-2"
                                placeholder="/images/blog/categories/creation.jpg"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">
                                Exemple: <code>/images/blog/categories/…</code> — pas d’URL externe.
                            </p>
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Texte alternatif</div>
                            <input
                                name="imageAlt"
                                defaultValue={doc.imageAlt ?? ''}
                                className="w-full rounded-xl border bg-white px-3 py-2"
                                placeholder="Illustration de la catégorie Émotions"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <textarea
                            name="description"
                            defaultValue={doc.description}
                            className="w-full rounded-xl border bg-white px-3 py-2 h-28"
                            placeholder="À quoi sert cette catégorie…"
                        />
                    </label>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            <div>Créé : {fmtDate(doc.createdAt)}</div>
                            <div>MAJ : {fmtDate(doc.updatedAt)}</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                                Sauvegarder
                            </button>

                            {/* Suppression définitive (pas de form imbriqué) */}
                            <DeleteCategoryButton slug={doc.slug} afterDelete="redirect" redirectTo="/admin/categories" />
                        </div>
                    </div>
                </section>

                {/* === Preview === */}
                <aside className="rounded-2xl border border-brand-200 bg-white shadow-sm overflow-hidden">
                    <div className="relative aspect-[16/9] w-full bg-gray-100">
                        {doc.imagePath ? (
                            <Image
                                src={doc.imagePath}
                                alt={doc.imageAlt || doc.name}
                                fill
                                className="object-cover"
                                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                priority={false}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center text-white"
                                style={{
                                    background: doc.color ? `linear-gradient(135deg, ${doc.color} 0%, rgba(0,0,0,0.35) 100%)` : 'linear-gradient(135deg, #c7d2fe 0%, #fbcfe8 100%)',
                                }}
                            >
                                <div className="flex items-center gap-2 text-2xl drop-shadow">
                                    {/* Icône placeholder */}
                                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                                        <path d="M20 7H4v10h16V7ZM2 5h20v14H2V5Zm6 8 2.5-3 3.5 4.5h-10L8 13Z" />
                                    </svg>
                                    <span className="font-semibold">{doc.name}</span>
                                </div>
                            </div>
                        )}

                        <div className="absolute left-3 bottom-3 flex items-center gap-2">
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">/{doc.slug}</span>
                            {/* Compteur indicatif (non chargé ici) */}
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">articles —</span>
                        </div>
                    </div>

                    <div className="p-4">
                        <h3 className="line-clamp-1 text-base font-semibold sm:text-lg">{doc.name}</h3>
                        {doc.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{doc.description}</p>}

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Couleur</div>
                                <div className="font-medium">
                                    {doc.color ? (
                                        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]">
                                            <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: doc.color }} />
                                            {doc.color}
                                        </span>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Créée</div>
                                <div className="font-medium">{fmtDate(doc.createdAt)}</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">MAJ</div>
                                <div className="font-medium">{fmtDate(doc.updatedAt)}</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </form>

            {/* Danger zone : suppression via action serveur (optionnel si tu préfères DeleteCategoryButton) */}

            <form action={deleteCategory} className="hidden">
                <input type="hidden" name="id" defaultValue={String(doc._id)} />
            </form>
        </div>
    );
}
