import 'server-only';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';
import DeleteInspirationButton from '@/components/admin/DeleteInspirationButton'; // ⬅️ AJOUT

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ---------- Types ---------- */
type InspDoc = {
    _id: Types.ObjectId;
    title?: string | null;
    slug: string;
    status: 'draft' | 'published';
    videoUrl?: string | null;
    summary?: string | null;
    tags?: string[] | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    publishedAt?: string | Date | null;
    curatorEmail?: string | null;
};

/* ---------- Utils ---------- */
function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
const toIso = (d?: string | Date | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');

/* ---------- Actions serveur ---------- */
async function updateInspiration(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();

    const id = String(formData.get('id') ?? '');
    const title = String(formData.get('title') ?? '').trim();
    const slugRaw = String(formData.get('slug') ?? '').trim();
    const status = String(formData.get('status') ?? 'draft') as 'draft' | 'published';
    const videoUrl = String(formData.get('videoUrl') ?? '').trim();
    const summary = String(formData.get('summary') ?? '').trim();
    const tagsCsv = String(formData.get('tags') ?? '');

    if (!id) throw new Error('ID manquant.');
    if (!title) throw new Error('Titre requis.');
    if (!videoUrl) throw new Error('URL vidéo requise.');

    const nextSlug = slugRaw ? slugify(slugRaw) : slugify(title);
    const tags = tagsCsv
        ? tagsCsv
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
        : [];

    const publishedPatch = status === 'published' ? ({ status: 'published', publishedAt: new Date() } as const) : ({ status: 'draft', publishedAt: null } as const);

    const updated = (await InspirationModel.findByIdAndUpdate(
        id,
        {
            $set: {
                title,
                slug: nextSlug,
                videoUrl,
                summary: summary || null,
                tags,
                ...publishedPatch,
            },
        },
        { new: true, lean: true }
    )) as InspDoc | null;

    if (!updated) throw new Error('Document introuvable après mise à jour.');

    revalidatePath('/admin/inspirations');
    revalidatePath('/inspirations');
    revalidatePath(`/inspirations/${updated.slug}`, 'page');

    const origSlug = String(formData.get('origSlug') ?? '');
    if (origSlug && origSlug !== updated.slug) {
        redirect(`/admin/inspirations/${updated.slug}?renamed=1`);
    }
}

/* ---------- Page ---------- */
export default async function EditInspirationPage({ params }: { params: { slug: string } }) {
    await requireAdmin();
    await dbConnect();

    const doc = await InspirationModel.findOne({ slug: params.slug, deletedAt: null })
        .select({
            _id: 1,
            title: 1,
            slug: 1,
            status: 1,
            videoUrl: 1,
            summary: 1,
            tags: 1,
            createdAt: 1,
            updatedAt: 1,
            publishedAt: 1,
            curatorEmail: 1,
        })
        .lean<InspDoc | null>();

    if (!doc) notFound();

    const tagsCsv = (Array.isArray(doc.tags) ? doc.tags : []).join(', ');

    return (
        <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/inspirations" className="hover:underline">
                                Inspirations
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Éditer</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{doc.title || 'Sans titre'}</h1>
                        <p className="text-sm text-muted-foreground mt-1">/{doc.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/inspirations" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Retour liste
                        </Link>
                        {doc.status === 'published' ? (
                            <Link href={`/inspirations/${doc.slug}`} className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700" target="_blank">
                                Ouvrir public
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Form */}
            <form action={updateInspiration} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Identité */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Identité</h2>
                        <span className="text-xs text-gray-500">Obligatoire</span>
                    </div>

                    <input type="hidden" name="id" defaultValue={String(doc._id)} />
                    <input type="hidden" name="origSlug" defaultValue={doc.slug} />

                    <div className="grid gap-4">
                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Titre *</div>
                            <input
                                name="title"
                                defaultValue={doc.title ?? ''}
                                placeholder="Ex. RAIN — Accueillir l’émotion"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                                required
                            />
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Slug</div>
                            <input name="slug" defaultValue={doc.slug} placeholder="auto si vide" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                            <p className="mt-1 text-[11px] text-gray-500">Si vide, généré depuis le titre.</p>
                        </label>

                        <fieldset className="block">
                            <div className="text-sm text-gray-600 mb-1">Statut</div>
                            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
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
                    </div>
                </section>

                {/* Vidéo & contenu */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Vidéo & contenu</h2>
                        <span className="text-xs text-gray-500">Obligatoire / Recommandé</span>
                    </div>

                    <div className="grid gap-4">
                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">URL vidéo *</div>
                            <input
                                name="videoUrl"
                                defaultValue={doc.videoUrl ?? ''}
                                placeholder="YouTube/Vimeo/MP4"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                                required
                            />
                            <p className="mt-1 text-[11px] text-gray-500">Les miniatures auto fonctionnent pour YouTube.</p>
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Résumé</div>
                            <textarea
                                name="summary"
                                defaultValue={doc.summary ?? ''}
                                placeholder="2–3 phrases max (optionnel)"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-28"
                            />
                        </label>

                        <label className="block">
                            <div className="text-sm text-gray-600 mb-1">Tags</div>
                            <input
                                name="tags"
                                defaultValue={tagsCsv}
                                placeholder="respiration, RAIN, limites"
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                            />
                        </label>
                    </div>
                </section>

                {/* Méta / actions */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm md:col-span-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            <div>Créé : {toIso(doc.createdAt)}</div>
                            <div>MAJ : {toIso(doc.updatedAt)}</div>
                            <div>Publié : {toIso(doc.publishedAt)}</div>
                            {doc.curatorEmail ? <div>Par : {doc.curatorEmail}</div> : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button type="submit" className="btn cursor-pointer">
                                Sauvegarder
                            </button>

                            {/* ⬇️ ICI : le bouton avec modale */}
                            <DeleteInspirationButton slug={doc.slug} afterDelete="redirect" redirectTo="/admin/inspirations" />
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}
