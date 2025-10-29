import 'server-only';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';
import SlugPreview from './components/SlugPreview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ======================= Utils ======================= */
function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

async function findAvailableSlug(baseSlug: string) {
    // Essaie base, puis base-2, base-3, ...
    let candidate = baseSlug;
    let i = 2;
    // On ne regarde que les non-supprimées
    while (await InspirationModel.exists({ slug: candidate, deletedAt: null })) {
        candidate = `${baseSlug}-${i++}`;
    }
    return candidate;
}

/* ======================= Page ======================= */
export default async function NewInspirationPage() {
    await requireAdmin();
    await dbConnect();

    async function createInspiration(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        // helpers
        const getStr = (k: string) => String(formData.get(k) ?? '').trim();
        const cleanOpt = (s: string) => (s.length ? s : undefined);

        const raw = {
            title: getStr('title'),
            // slug demandé (ou généré depuis titre)
            slugWanted: slugify(getStr('slug') || getStr('title')),
            videoUrl: getStr('videoUrl'),
            summary: cleanOpt(getStr('summary')),
            tagsCsv: getStr('tags'),
            status: (getStr('status') || 'draft') as 'draft' | 'published',
        };

        const tags =
            raw.tagsCsv.length > 0
                ? raw.tagsCsv
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [];

        // Validation
        const zUrl = z.string().trim().url({ message: 'URL invalide' });

        const Schema = z.object({
            title: z.string().min(1, 'Titre requis'),
            slugWanted: z.string().min(1, 'Slug requis'),
            videoUrl: zUrl,
            summary: z.string().optional(),
            tags: z.array(z.string()).default([]),
            status: z.enum(['draft', 'published']).default('draft'),
        });

        const data = Schema.parse({ ...raw, tags });

        // 1) Choisir un slug disponible AVANT insert
        const baseSlug = data.slugWanted;
        const slug = await findAvailableSlug(baseSlug);

        const now = new Date();

        // 2) Tenter la création; si E11000 on retente avec suffixe
        let created = null;
        try {
            created = await InspirationModel.create({
                title: data.title,
                slug,
                videoUrl: data.videoUrl,
                summary: data.summary,
                tags: data.tags,
                status: data.status,
                publishedAt: data.status === 'published' ? now : null,
                deletedAt: null,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            const isDup = /E11000 duplicate key error/.test(msg);
            if (!isDup) throw e;

            // Conflit malgré la pré-vérif -> on retente avec un autre suffixe unique (course condition)
            const fallback = await findAvailableSlug(baseSlug);
            created = await InspirationModel.create({
                title: data.title,
                slug: fallback,
                videoUrl: data.videoUrl,
                summary: data.summary,
                tags: data.tags,
                status: data.status,
                publishedAt: data.status === 'published' ? now : null,
                deletedAt: null,
            });
        }

        // Redirige vers l’édition
        redirect(`/admin/inspirations/${created.slug}`);
    }

    /* ======================= UI ======================= */
    return (
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
            {/* ===== Header / Breadcrumb ===== */}
            <div className="rounded-2xl border border-violet-200/40 bg-gradient-to-br from-violet-600/10 via-violet-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-gray-500">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/inspirations" className="hover:underline">
                                Inspirations
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-gray-700">Nouvelle</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Nouvelle inspiration</h1>
                        <p className="text-sm text-gray-600 mt-1">Ajoute une vidéo (YouTube/Vimeo/MP4), son résumé, les tags et le statut.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/inspirations" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Retour liste
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== Form ===== */}
            <form action={createInspiration} className="relative">
                {/* CTA sticky mobile */}
                <div className="md:hidden sticky bottom-3 z-20 flex justify-center">
                    <button className="rounded-xl bg-violet-600 px-5 py-3 text-white shadow-lg shadow-violet-600/20 ring-1 ring-black/5" type="submit">
                        Créer l’inspiration
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* ---- Card: Identité & Statut ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Identité</h2>
                            <span className="text-xs text-gray-500">Obligatoire</span>
                        </div>

                        <div className="grid gap-4">
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Titre *</div>
                                <input name="title" placeholder="RAIN — Accueillir l’émotion" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" required />
                                <p className="mt-1 text-[11px] text-gray-500">Affiché dans la liste et la page publique.</p>
                            </label>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Slug</div>
                                <input name="slug" placeholder="auto si vide" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">Généré depuis le titre si laissé vide (kebab-case).</p>
                            </label>

                            <fieldset className="block">
                                <div className="text-sm text-gray-600 mb-1">Statut</div>
                                <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                    {(
                                        [
                                            { v: 'draft', label: 'Brouillon' },
                                            { v: 'published', label: 'Publié' },
                                        ] as const
                                    ).map((opt) => (
                                        <label key={opt.v} className="relative">
                                            <input
                                                type="radio"
                                                name="status"
                                                value={opt.v}
                                                defaultChecked={opt.v === 'draft'}
                                                className="peer absolute inset-0 h-0 w-0 opacity-0"
                                            />
                                            <div className="cursor-pointer select-none px-3 py-2 text-center text-sm text-gray-700 peer-checked:bg-white peer-checked:text-brand-600 peer-checked:shadow-inner">
                                                {opt.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="pt-1">
                                <SlugPreview />
                            </div>
                        </div>
                    </section>

                    {/* ---- Card: Média ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Média</h2>
                            <span className="text-xs text-gray-500">Obligatoire</span>
                        </div>

                        <div className="grid gap-4">
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">URL vidéo *</div>
                                <input
                                    name="videoUrl"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                                    required
                                />
                                <p className="mt-1 text-[11px] text-gray-500">YouTube, Vimeo, ou MP4 accessible publiquement (URL complète).</p>
                            </label>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                                Astuce : pour YouTube, la miniature sera auto-déduite côté “Liste”.
                            </div>
                        </div>
                    </section>

                    {/* ---- Card: Contenu ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm md:col-span-2 order-1 md:order-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Contenu</h2>
                            <span className="text-xs text-gray-500">Recommandé</span>
                        </div>

                        <div className="grid gap-4">
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Résumé</div>
                                <textarea name="summary" placeholder="2–3 phrases max (optionnel)" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-28" />
                                <p className="mt-1 text-[11px] text-gray-500">Utilisé en meta/preview et en Quick View.</p>
                            </label>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Tags (séparés par des virgules)</div>
                                <input name="tags" placeholder="respiration, RAIN, limites" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Ex : <code>bien-être, grounding, souffle</code>
                                </p>
                            </label>
                        </div>
                    </section>
                </div>

                {/* Desktop Submit */}
                <div className="mt-6 hidden md:flex justify-end">
                    <button className="btn cursor-pointer" type="submit">
                        Créer l’inspiration
                    </button>
                </div>
            </form>
        </div>
    );
}
