// src/app/admin/blog/[slug]/page.tsx
import 'server-only';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';
import DeletePostButton from '@/components/admin/DeletePostButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type PostDoc = {
    _id: Types.ObjectId;
    title?: string | null;
    slug: string;
    status: 'draft' | 'published';
    summary?: string | null;
    content?: string | null;
    coverPath?: string | null;
    coverAlt?: string | null;
    category?: string | null;
    tags?: string[] | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    canonicalUrl?: string | null;
    isFeatured?: boolean | null;
    readingTimeMin?: number | null;
    publishedAt?: string | Date | null;
    authorEmail?: string | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
};

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function computeReadingTimeMin(text: string) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
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
    if (/^https?:\/\//i.test(s)) throw new Error('La couverture doit être un chemin local (ex: /images/blog/slug/cover.jpg).');
    if (!s.startsWith('/')) return `/${s}`;
    return s;
}

const fmt = (d?: string | Date | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

async function updatePost(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();

    const id = String(formData.get('id') ?? '');
    if (!id) throw new Error('ID manquant.');

    const title = String(formData.get('title') ?? '').trim();
    if (!title) throw new Error('Titre requis.');

    const slugRaw = String(formData.get('slug') ?? '').trim();
    const nextSlug = slugRaw ? slugify(slugRaw) : slugify(title);

    const status = String(formData.get('status') ?? 'draft') as 'draft' | 'published';
    const publishedAtInput = String(formData.get('publishedAt') ?? '').trim();
    const publishedAt = status === 'published' ? (publishedAtInput ? new Date(publishedAtInput) : new Date()) : null;

    const coverPath = sanitizeCoverPath(String(formData.get('coverPath') ?? ''));
    const coverAlt = String(formData.get('coverAlt') ?? '').trim();

    const summary = String(formData.get('summary') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();

    const category = String(formData.get('category') ?? '').trim();
    const tags = parseTags(String(formData.get('tags') ?? ''));

    const isFeatured = String(formData.get('isFeatured') ?? '') === 'on';

    const seoTitle = String(formData.get('seoTitle') ?? '').trim() || title;
    const seoDescription = String(formData.get('seoDescription') ?? '').trim() || summary;
    const canonicalUrl = String(formData.get('canonicalUrl') ?? '').trim();

    const readingTimeMin = computeReadingTimeMin(content);

    const updated = await PostModel.findByIdAndUpdate(
        id,
        {
            $set: {
                title,
                slug: nextSlug,
                status,
                publishedAt,
                summary,
                content,
                coverPath,
                coverAlt,
                category,
                tags,
                seoTitle,
                seoDescription,
                canonicalUrl,
                isFeatured,
                readingTimeMin,
            },
        },
        { new: true }
    ).lean<PostDoc | null>();

    if (!updated) throw new Error('Document introuvable après mise à jour.');

    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${updated.slug}`, 'page');

    const origSlug = String(formData.get('origSlug') ?? '');
    if (origSlug && origSlug !== updated.slug) {
        redirect(`/admin/blog/${updated.slug}?renamed=1`);
    }
}

export default async function EditPostPage(props: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    const { slug } = await props.params;

    const doc = await PostModel.findOne({ slug, deletedAt: null })
        .select({
            _id: 1,
            title: 1,
            slug: 1,
            status: 1,
            summary: 1,
            content: 1,
            coverPath: 1,
            coverAlt: 1,
            category: 1,
            tags: 1,
            seoTitle: 1,
            seoDescription: 1,
            canonicalUrl: 1,
            isFeatured: 1,
            readingTimeMin: 1,
            publishedAt: 1,
            authorEmail: 1,
            createdAt: 1,
            updatedAt: 1,
        })
        .lean<PostDoc | null>();

    if (!doc) notFound();

    return (
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/blog" className="hover:underline">
                                Articles
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Éditer</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{doc.title || 'Sans titre'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">/{doc.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/blog" className="rounded-lg border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Retour liste
                        </Link>
                        {doc.status === 'published' ? (
                            <Link href={`/blog/${doc.slug}`} target="_blank" className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700">
                                Ouvrir public
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Form */}
            <form action={updatePost} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                <input type="hidden" name="id" defaultValue={String(doc._id)} />
                <input type="hidden" name="origSlug" defaultValue={doc.slug} />

                {/* Identité */}
                <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Titre *</div>
                        <input name="title" defaultValue={doc.title ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" required />
                    </label>
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Slug</div>
                        <input name="slug" defaultValue={doc.slug} className="w-full rounded-xl border bg-white px-3 py-2" />
                        <p className="mt-1 text-[11px] text-gray-500">Si vide, généré depuis le titre.</p>
                    </label>
                </section>

                {/* Catégorie & Tags */}
                <section className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Catégorie</div>
                        <input name="category" defaultValue={doc.category ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Tags</div>
                        <textarea name="tags" defaultValue={(doc.tags ?? []).join(', ')} className="w-full rounded-xl border bg-white px-3 py-2 h-20" />
                    </label>
                </section>

                {/* Cover */}
                <section className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Image de couverture (chemin local)</div>
                        <input name="coverPath" defaultValue={doc.coverPath ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" />
                        <p className="mt-1 text-[11px] text-gray-500">
                            Le fichier doit exister dans <code>/public</code>.
                        </p>
                    </label>
                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Texte alternatif</div>
                        <input name="coverAlt" defaultValue={doc.coverAlt ?? ''} className="w-full rounded-xl border bg-white px-3 py-2" />
                    </label>
                </section>

                {/* Résumé & Contenu */}
                <label className="block">
                    <div className="text-sm text-gray-600 mb-1">Résumé</div>
                    <textarea name="summary" defaultValue={doc.summary ?? ''} className="w-full rounded-xl border bg-white px-3 py-2 h-24" />
                </label>
                <label className="block">
                    <div className="text-sm text-gray-600 mb-1">Contenu (Markdown/texte)</div>
                    <textarea name="content" defaultValue={doc.content ?? ''} className="w-full rounded-xl border bg-white px-3 py-2 h-72 font-mono" />
                </label>

                {/* SEO */}
                <fieldset className="grid gap-4 md:grid-cols-3 rounded-xl border p-4">
                    <legend className="text-sm font-medium px-1">SEO</legend>
                    <label className="block">
                        <div className="mb-1 text-xs text-muted-foreground">SEO Title</div>
                        <input name="seoTitle" defaultValue={doc.seoTitle ?? ''} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="block md:col-span-2">
                        <div className="mb-1 text-xs text-muted-foreground">SEO Description</div>
                        <input name="seoDescription" defaultValue={doc.seoDescription ?? ''} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="block md:col-span-3">
                        <div className="mb-1 text-xs text-muted-foreground">Canonical URL</div>
                        <input name="canonicalUrl" defaultValue={doc.canonicalUrl ?? ''} className="w-full rounded-lg border bg-white px-3 py-2 text-sm" />
                    </label>
                </fieldset>

                {/* Publication */}
                <section className="grid gap-4 md:grid-cols-[1fr,1fr,auto] items-end">
                    <fieldset className="block">
                        <div className="text-sm text-gray-600 mb-1">Statut</div>
                        <div className="grid grid-cols-2 overflow-hidden rounded-xl border bg-gray-50">
                            {(['draft', 'published'] as const).map((v) => (
                                <label key={v} className="relative">
                                    <input type="radio" name="status" value={v} defaultChecked={doc.status === v} className="peer absolute inset-0 h-0 w-0 opacity-0" />
                                    <div className="cursor-pointer select-none px-3 py-2 text-center text-sm text-gray-700 peer-checked:bg-white peer-checked:text-brand-600 peer-checked:shadow-inner">
                                        {v === 'draft' ? 'Brouillon' : 'Publié'}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className="block">
                        <div className="text-sm text-gray-600 mb-1">Date de publication (si publié)</div>
                        <input
                            type="datetime-local"
                            name="publishedAt"
                            defaultValue={doc.publishedAt ? new Date(doc.publishedAt).toISOString().slice(0, 16) : ''}
                            className="w-full rounded-xl border bg-white px-3 py-2"
                        />
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" name="isFeatured" defaultChecked={!!doc.isFeatured} />
                        <span className="text-sm">Mettre en avant</span>
                    </label>
                </section>

                {/* Meta info + actions */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                        <div>Créé : {fmt(doc.createdAt)}</div>
                        <div>MAJ : {fmt(doc.updatedAt)}</div>
                        <div>Publié : {fmt(doc.publishedAt)}</div>
                        {doc.authorEmail ? <div>Auteur : {doc.authorEmail}</div> : null}
                        {doc.readingTimeMin ? <div>Lecture : ~{doc.readingTimeMin} min</div> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="submit" className="btn cursor-pointer">
                            Sauvegarder
                        </button>
                        <DeletePostButton slug={doc.slug} afterDelete="redirect" redirectTo="/admin/blog" />
                    </div>
                </div>
            </form>
        </div>
    );
}
