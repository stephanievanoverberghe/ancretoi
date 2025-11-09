// src/app/admin/blog/posts/new/page.tsx
import 'server-only';

import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { PostModel, CategoryModel } from '@/db/schemas';
import { PATHS } from '@/lib/paths';
import SlugPreview from './components/SlugPreview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ================= Helpers ================= */
function slugify(s: string) {
    return (s || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
}

function computeReadingTimeMin(text: string) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200)); // ~200 wpm
}

function parseTags(raw: string) {
    return Array.from(
        new Set(
            (raw || '')
                .split(/[,\n]/)
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
        )
    );
}

function sanitizeCoverPath(p: string) {
    const s = (p || '').trim();
    if (!s) return '';
    // Force chemin local en /public (ex: "/images/blog/slug/cover.jpg")
    if (/^https?:\/\//i.test(s)) throw new Error('La couverture doit être un chemin local (ex: /images/blog/mon-article/cover.jpg).');
    if (!s.startsWith('/')) return `/${s}`;
    return s;
}

/* ================= Server Action ================= */
async function createPostAction(formData: FormData) {
    'use server';

    const me = await requireAdmin();
    await dbConnect();

    const get = (k: string) => String(formData.get(k) ?? '').trim();

    // Identité
    const title = get('title');
    const slugWanted = slugify(get('slug') || title);

    // Catégorie (slug) & tags
    const categorySlug = get('category'); // slug de Category ou '' (aucune)
    const tags = parseTags(get('tags'));

    // Couverture
    const coverPath = sanitizeCoverPath(get('coverPath'));
    const coverAlt = get('coverAlt');

    // Corps & meta
    const summary = get('summary');
    const content = get('content');
    const isFeatured = get('isFeatured') === 'on';

    // SEO
    const seoTitle = get('seoTitle') || title;
    const seoDescription = get('seoDescription') || summary;
    const canonicalUrl = get('canonicalUrl');

    // Publication
    const status = (get('status') || 'draft') as 'draft' | 'published';
    const publishedAtRaw = get('publishedAt'); // optionnel (yyyy-mm-ddThh:mm)
    const publishedAt = status === 'published' ? (publishedAtRaw ? new Date(publishedAtRaw) : new Date()) : null;

    if (!title || !slugWanted) throw new Error('Titre et slug requis.');

    // Résolution catégorie -> categoryId (conforme au schéma IPost)
    let categoryId: string | null = null;
    if (categorySlug) {
        const cat = await CategoryModel.findOne({ slug: categorySlug }).select({ _id: 1 }).lean<{ _id: string } | null>();
        if (cat?._id) categoryId = String(cat._id);
    }

    // Unicité slug sur les posts actifs (deletedAt: null)
    let slug = slugWanted;
    let i = 2;
    while (await PostModel.exists({ slug, deletedAt: null })) {
        slug = `${slugWanted}-${i++}`;
    }

    const readingTimeMin = computeReadingTimeMin(content);

    await PostModel.create({
        title,
        slug,
        status,
        publishedAt,

        summary,
        content,

        coverPath,
        coverAlt,

        categoryId, // ✅ on stocke l'ObjectId, pas le slug
        tags,

        seoTitle,
        seoDescription,
        canonicalUrl,

        isFeatured,
        readingTimeMin,

        authorEmail: me.email,
        deletedAt: null,
    });

    // Revalidate Admin + Public
    revalidatePath(PATHS.adminBlog);
    revalidatePath(PATHS.adminBlogPosts);
    revalidatePath(PATHS.publicBlogIndex);
    revalidatePath(PATHS.publicPost(slug), 'page');

    redirect(PATHS.adminBlogPosts);
}

/* ================= Page ================= */
export default async function NewPostPage() {
    await requireAdmin();
    await dbConnect();

    const categories = await CategoryModel.find({}).select({ name: 1, slug: 1 }).sort({ name: 1 }).lean<{ name: string; slug: string }[]>();

    return (
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href={PATHS.adminBlog} className="hover:underline">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <Link href={PATHS.adminBlogPosts} className="hover:underline">
                        Articles
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Nouveau</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Nouvel article</h1>
                <p className="text-sm text-muted-foreground mt-1">Billet complet avec tags, catégorie, SEO, couverture locale et options de publication.</p>
            </div>

            {/* Form */}
            <form action={createPostAction} className="space-y-5 rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm">
                {/* Ligne 1 : Titre / Slug / Aperçu */}
                <div className="grid gap-4 md:grid-cols-[2fr,1fr,auto]">
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Titre *</div>
                        <input name="title" placeholder="Titre de l’article" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" required />
                    </label>
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Slug (auto si vide)</div>
                        <input name="slug" placeholder="ex: mon-bel-article" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                    </label>
                    <div className="flex items-end">
                        <SlugPreview />
                    </div>
                </div>

                {/* Ligne 2 : Catégorie / Tags */}
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Catégorie</div>
                        <select name="category" defaultValue="" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm">
                            <option value="">(Aucune)</option>
                            {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-gray-500">
                            Le <strong>slug</strong> sélectionné est résolu en <em>categoryId</em> à l’enregistrement.
                        </p>
                    </label>
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Tags (séparés par virgules ou lignes)</div>
                        <textarea name="tags" placeholder="nextjs, poésie, performance" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm h-20" />
                    </label>
                </div>

                {/* Ligne 3 : Couverture locale */}
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Image de couverture (chemin local)</div>
                        <input name="coverPath" placeholder="/images/blog/mon-article/cover.jpg" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                        <p className="mt-1 text-[11px] text-gray-500">
                            Le fichier doit exister dans <code>/public</code> (chemin commençant par <code>/</code>).
                        </p>
                    </label>
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Texte alternatif (accessibilité)</div>
                        <input name="coverAlt" placeholder="Brève description de l’image" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                    </label>
                </div>

                {/* Résumé */}
                <label className="block">
                    <div className="mb-1 text-sm text-muted-foreground">Résumé (chapeau)</div>
                    <textarea name="summary" placeholder="Quelques lignes d’intro…" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm h-24" />
                </label>

                {/* Contenu */}
                <label className="block">
                    <div className="mb-1 text-sm text-muted-foreground">Contenu (Markdown/texte)</div>
                    <textarea name="content" placeholder={`# Titre\n\nTon contenu…`} className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm h-72 font-mono" />
                </label>

                {/* SEO */}
                <fieldset className="grid gap-4 md:grid-cols-3 rounded-xl border p-4">
                    <legend className="text-sm font-medium px-1">SEO</legend>
                    <label className="block">
                        <div className="mb-1 text-xs text-muted-foreground">SEO Title</div>
                        <input name="seoTitle" placeholder="Titre SEO (sinon repris du Titre)" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="block md:col-span-2">
                        <div className="mb-1 text-xs text-muted-foreground">SEO Description</div>
                        <input
                            name="seoDescription"
                            placeholder="150–160 caractères (sinon repris du Résumé)"
                            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="block md:col-span-3">
                        <div className="mb-1 text-xs text-muted-foreground">Canonical URL (optionnel)</div>
                        <input name="canonicalUrl" placeholder="https://exemple.com/mon-article" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                    </label>
                </fieldset>

                {/* Publication */}
                <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto] items-end">
                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Statut</div>
                        <select name="status" defaultValue="draft" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm">
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                        </select>
                    </label>

                    <label className="block">
                        <div className="mb-1 text-sm text-muted-foreground">Date de publication (si publié)</div>
                        <input type="datetime-local" name="publishedAt" className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" name="isFeatured" />
                        <span className="text-sm">Mettre en avant</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                    <Link href={PATHS.adminBlogPosts} className="rounded-lg border px-3 py-2 text-sm hover:bg-brand-50">
                        Annuler
                    </Link>
                    <button className="rounded-lg border border-brand-300 bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" type="submit">
                        Créer
                    </button>
                </div>
            </form>
        </div>
    );
}
