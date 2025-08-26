'use client';

import { useForm, useFieldArray } from 'react-hook-form';

/* ======================= Types ======================= */

type Level = 'beginner' | 'intermediate' | 'advanced';
type Status = 'draft' | 'preflight' | 'published';

type Benefit = { icon?: string; title: string; text: string };
type QA = { q: string; a: string };
type Testimonial = { name: string; role?: string; text: string; avatar?: string };
type CurriculumItem = { label: string; summary?: string };

type PageForm = {
    programSlug: string;
    status: Status;

    hero: {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        ctaLabel?: string;
        ctaHref?: string;
        /** Dans le formulaire on manipule juste l’URL */
        heroImage?: string;
    };

    card: {
        image?: string; // URL
        tagline?: string;
        summary?: string;
        accentColor?: string;
    };

    meta: {
        durationDays?: number;
        estMinutesPerDay?: number;
        level?: Level;
        category?: string;
        tags?: string[];
        language?: string;
    };

    /** Section “page de garde” (texte d’intro en haut de la page) */
    pageGarde?: {
        heading?: string; // ex: RESET-7
        tagline?: string; // “7 jours pour …”
        format?: string; // “1 rdv/jour…” (ligne format)
        audience?: string; // “Créé pour : …”
        safetyNote?: string; // “Note sécurité : …”
    };

    /** Introduction longue (finalité, public, cadre…) */
    intro: {
        finalite?: string;
        pourQui?: string;
        pasPourQui?: string;
        commentUtiliser?: string;
        cadreSecurite?: string;
    };

    /** Conclusion longue (kit entretien, cap 7-14-30, etc.) */
    conclusion: {
        texte?: string;
        kitEntretien?: string;
        cap7_14_30?: string;
        siCaDeraille?: string;
        allerPlusLoin?: string;
    };

    highlights: Benefit[];
    curriculum: CurriculumItem[];
    testimonials: Testimonial[];
    faq: QA[];

    seo: {
        title?: string;
        description?: string;
        image?: string; // URL
    };
};

/** Type pour les données DB entrantes (souple) */
type ImageLike = { url?: string; alt?: string } | string | null | undefined;
type PgIncoming = Partial<{
    programSlug: string;
    status: Status;
    hero: {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        ctaLabel?: string;
        ctaHref?: string;
        heroImage?: ImageLike;
    } | null;
    card: {
        image?: ImageLike;
        tagline?: string;
        summary?: string;
        accentColor?: string;
    } | null;
    meta: {
        durationDays?: number | null;
        estMinutesPerDay?: number | null;
        level?: Level | null;
        category?: string | null;
        tags?: string[] | null;
        language?: string | null;
    } | null;

    pageGarde?: {
        heading?: string;
        tagline?: string;
        format?: string;
        audience?: string;
        safetyNote?: string;
    } | null;

    intro?: PageForm['intro'] | null;
    conclusion?: PageForm['conclusion'] | null;

    highlights?: Benefit[] | null;
    curriculum?: (CurriculumItem | string)[] | null;
    testimonials?: Testimonial[] | null;
    faq?: QA[] | null;

    seo?: PageForm['seo'] | null;
}>;

/* ======================= Helpers ======================= */

function imageToUrl(img: ImageLike): string {
    if (!img) return '';
    return typeof img === 'string' ? img : img.url ?? '';
}

function toCurriculum(list: (CurriculumItem | string)[] | null | undefined): CurriculumItem[] {
    if (!Array.isArray(list)) return [];
    return list.map((it) => (typeof it === 'string' ? { label: it } : { label: it.label, summary: it.summary }));
}

function toTagsCsv(arr: string[] | undefined): string {
    return (arr ?? []).join(', ');
}

function csvToTags(csv: string): string[] {
    return csv
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

/* ======================= Component ======================= */

export default function ProgramPageEditor({ slug, initialPage }: { slug: string; initialPage: PgIncoming | null }) {
    const defaults: PageForm = {
        programSlug: slug,
        status: initialPage?.status ?? 'draft',

        hero: {
            eyebrow: initialPage?.hero?.eyebrow ?? '',
            title: initialPage?.hero?.title ?? '',
            subtitle: initialPage?.hero?.subtitle ?? '',
            ctaLabel: initialPage?.hero?.ctaLabel ?? '',
            ctaHref: initialPage?.hero?.ctaHref ?? '',
            heroImage: imageToUrl(initialPage?.hero?.heroImage),
        },

        card: {
            image: imageToUrl(initialPage?.card?.image),
            tagline: initialPage?.card?.tagline ?? '',
            summary: initialPage?.card?.summary ?? '',
            accentColor: initialPage?.card?.accentColor ?? '',
        },

        meta: {
            durationDays: initialPage?.meta?.durationDays ?? 7,
            estMinutesPerDay: initialPage?.meta?.estMinutesPerDay ?? 20,
            level: (initialPage?.meta?.level as Level) ?? 'beginner',
            category: initialPage?.meta?.category ?? 'wellbeing',
            tags: Array.isArray(initialPage?.meta?.tags) ? initialPage?.meta?.tags : [],
            language: initialPage?.meta?.language ?? 'fr',
        },

        pageGarde: {
            heading: initialPage?.pageGarde?.heading ?? initialPage?.hero?.title ?? '',
            tagline: initialPage?.pageGarde?.tagline ?? '',
            format: initialPage?.pageGarde?.format ?? '',
            audience: initialPage?.pageGarde?.audience ?? '',
            safetyNote: initialPage?.pageGarde?.safetyNote ?? '',
        },

        intro: {
            finalite: initialPage?.intro?.finalite ?? '',
            pourQui: initialPage?.intro?.pourQui ?? '',
            pasPourQui: initialPage?.intro?.pasPourQui ?? '',
            commentUtiliser: initialPage?.intro?.commentUtiliser ?? '',
            cadreSecurite: initialPage?.intro?.cadreSecurite ?? '',
        },

        conclusion: {
            texte: initialPage?.conclusion?.texte ?? '',
            kitEntretien: initialPage?.conclusion?.kitEntretien ?? '',
            cap7_14_30: initialPage?.conclusion?.cap7_14_30 ?? '',
            siCaDeraille: initialPage?.conclusion?.siCaDeraille ?? '',
            allerPlusLoin: initialPage?.conclusion?.allerPlusLoin ?? '',
        },

        highlights: initialPage?.highlights ?? [],
        curriculum: toCurriculum(initialPage?.curriculum),
        testimonials: initialPage?.testimonials ?? [],
        faq: initialPage?.faq ?? [],

        seo: {
            title: initialPage?.seo?.title ?? '',
            description: initialPage?.seo?.description ?? '',
            image: initialPage?.seo?.image ?? '',
        },
    };

    const form = useForm<PageForm>({ defaultValues: defaults });

    const highlights = useFieldArray<PageForm, 'highlights'>({
        control: form.control,
        name: 'highlights',
    });
    const curriculum = useFieldArray<PageForm, 'curriculum'>({
        control: form.control,
        name: 'curriculum',
    });
    const faq = useFieldArray<PageForm, 'faq'>({
        control: form.control,
        name: 'faq',
    });
    const testimonials = useFieldArray<PageForm, 'testimonials'>({
        control: form.control,
        name: 'testimonials',
    });

    async function onSubmit(values: PageForm) {
        // On poste tel que l’API /api/admin/pages l’attend (héros/card : URLs string)
        const payload = {
            programSlug: values.programSlug.toLowerCase(),
            status: values.status,
            hero: {
                eyebrow: values.hero.eyebrow?.trim() || undefined,
                title: values.hero.title?.trim() || undefined,
                subtitle: values.hero.subtitle?.trim() || undefined,
                ctaLabel: values.hero.ctaLabel?.trim() || undefined,
                ctaHref: values.hero.ctaHref?.trim() || undefined,
                heroImage: values.hero.heroImage?.trim() || undefined,
            },
            card: {
                image: values.card.image?.trim() || undefined,
                tagline: values.card.tagline?.trim() || undefined,
                summary: values.card.summary?.trim() || undefined,
                accentColor: values.card.accentColor?.trim() || undefined,
            },
            meta: {
                durationDays: Number(values.meta.durationDays ?? 7),
                estMinutesPerDay: Number(values.meta.estMinutesPerDay ?? 20),
                level: values.meta.level ?? 'beginner',
                category: values.meta.category?.trim() || 'wellbeing',
                tags: values.meta.tags ?? [],
                language: values.meta.language ?? 'fr',
            },
            pageGarde: {
                heading: values.pageGarde?.heading?.trim() || undefined,
                tagline: values.pageGarde?.tagline?.trim() || undefined,
                format: values.pageGarde?.format?.trim() || undefined,
                audience: values.pageGarde?.audience?.trim() || undefined,
                safetyNote: values.pageGarde?.safetyNote?.trim() || undefined,
            },
            intro: {
                finalite: values.intro.finalite?.trim() || undefined,
                pourQui: values.intro.pourQui?.trim() || undefined,
                pasPourQui: values.intro.pasPourQui?.trim() || undefined,
                commentUtiliser: values.intro.commentUtiliser?.trim() || undefined,
                cadreSecurite: values.intro.cadreSecurite?.trim() || undefined,
            },
            conclusion: {
                texte: values.conclusion.texte?.trim() || undefined,
                kitEntretien: values.conclusion.kitEntretien?.trim() || undefined,
                cap7_14_30: values.conclusion.cap7_14_30?.trim() || undefined,
                siCaDeraille: values.conclusion.siCaDeraille?.trim() || undefined,
                allerPlusLoin: values.conclusion.allerPlusLoin?.trim() || undefined,
            },
            highlights:
                values.highlights?.map((b) => ({
                    icon: b.icon?.trim() || undefined,
                    title: b.title?.trim() || '',
                    text: b.text?.trim() || '',
                })) ?? [],
            curriculum:
                values.curriculum?.map((c) => ({
                    label: c.label?.trim() || '',
                    summary: c.summary?.trim() || undefined,
                })) ?? [],
            testimonials: values.testimonials ?? [],
            faq: values.faq ?? [],
            seo: {
                title: values.seo.title?.trim() || undefined,
                description: values.seo.description?.trim() || undefined,
                image: values.seo.image?.trim() || undefined,
            },
        };

        const res = await fetch('/api/admin/pages', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            alert(`Erreur enregistrement: ${res.status} — ${text}`);
            return;
        }
        alert('Page enregistrée ✅');
    }

    // binding "tags" en input CSV (UI simple)
    const tagsCsv = toTagsCsv(form.watch('meta.tags'));
    const onTagsChange = (v: string) => form.setValue('meta.tags', csvToTags(v));

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* META & STATUS */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg">Meta</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    <input type="number" min={1} max={365} {...form.register('meta.durationDays', { valueAsNumber: true })} placeholder="Jours" className="border rounded p-2" />
                    <input
                        type="number"
                        min={1}
                        max={180}
                        {...form.register('meta.estMinutesPerDay', { valueAsNumber: true })}
                        placeholder="Minutes/jour"
                        className="border rounded p-2"
                    />
                    <select {...form.register('meta.level')} className="border rounded p-2">
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                    </select>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <input {...form.register('meta.category')} placeholder="Catégorie (ex. wellbeing)" className="border rounded p-2" />
                    <input value={tagsCsv} onChange={(e) => onTagsChange(e.target.value)} placeholder="Tags (séparés par virgules)" className="border rounded p-2" />
                    <select {...form.register('status')} className="border rounded p-2">
                        <option value="draft">draft</option>
                        <option value="preflight">preflight</option>
                        <option value="published">published</option>
                    </select>
                </div>
            </section>

            {/* PAGE DE GARDE */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg">Page de garde</h2>
                <input {...form.register('pageGarde.heading')} placeholder="Titre principal (ex. RESET-7)" className="border rounded p-2 w-full" />
                <input {...form.register('pageGarde.tagline')} placeholder="Tagline (ex. 7 jours pour…)" className="border rounded p-2 w-full" />
                <input {...form.register('pageGarde.format')} placeholder="Format (ex. 1 rdv/jour …)" className="border rounded p-2 w-full" />
                <input {...form.register('pageGarde.audience')} placeholder="Créé pour : freelances, soignants…" className="border rounded p-2 w-full" />
                <textarea {...form.register('pageGarde.safetyNote')} placeholder="Note sécurité…" className="border rounded p-2 w-full" />
            </section>

            {/* HERO */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg">Hero</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <input {...form.register('hero.eyebrow')} placeholder="Eyebrow" className="border rounded p-2" />
                    <input {...form.register('hero.title')} placeholder="Titre (affiché dans le hero)" className="border rounded p-2" />
                </div>
                <textarea {...form.register('hero.subtitle')} placeholder="Sous-titre" className="border rounded p-2 w-full" />
                <div className="grid gap-3 md:grid-cols-2">
                    <input {...form.register('hero.ctaLabel')} placeholder="CTA Label" className="border rounded p-2" />
                    <input {...form.register('hero.ctaHref')} placeholder="CTA Href (/checkout/reset-7…)" className="border rounded p-2" />
                </div>
                <input {...form.register('hero.heroImage')} placeholder="Hero image URL ou /images/..." className="border rounded p-2 w-full" />
            </section>

            {/* CARD (catalogue) */}
            <section className="space-y-3">
                <h2 className="font-semibold text-lg">Card (catalogue)</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <input {...form.register('card.image')} placeholder="Card image URL ou /images/..." className="border rounded p-2" />
                    <input {...form.register('card.accentColor')} placeholder="Couleur #hex" className="border rounded p-2" />
                </div>
                <input {...form.register('card.tagline')} placeholder="Tagline courte" className="border rounded p-2 w-full" />
                <input {...form.register('card.summary')} placeholder="Résumé court" className="border rounded p-2 w-full" />
            </section>

            {/* BÉNÉFICES */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">Bénéfices</h2>
                {highlights.fields.map((f, i) => (
                    <div key={f.id} className="grid gap-2 md:grid-cols-3 border rounded p-3">
                        <input {...form.register(`highlights.${i}.icon`)} placeholder="Icon/emoji" className="border rounded p-2" />
                        <input {...form.register(`highlights.${i}.title`, { required: true })} placeholder="Titre" className="border rounded p-2" />
                        <input {...form.register(`highlights.${i}.text`, { required: true })} placeholder="Texte" className="border rounded p-2" />
                    </div>
                ))}
                <div className="flex gap-2">
                    <button type="button" className="rounded bg-gray-200 px-3 py-1" onClick={() => highlights.append({ title: '', text: '' })}>
                        + Ajouter
                    </button>
                    {!!highlights.fields.length && (
                        <button type="button" className="rounded bg-gray-100 px-3 py-1" onClick={() => highlights.remove(highlights.fields.length - 1)}>
                            − Retirer dernier
                        </button>
                    )}
                </div>
            </section>

            {/* CURRICULUM */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">Curriculum (J1 → Jn)</h2>
                {curriculum.fields.map((f, i) => (
                    <div key={f.id} className="grid gap-2 md:grid-cols-2">
                        <input {...form.register(`curriculum.${i}.label`, { required: true })} placeholder={`Jour ${i + 1} — libellé`} className="border rounded p-2" />
                        <input {...form.register(`curriculum.${i}.summary`)} placeholder="Résumé (facultatif)" className="border rounded p-2" />
                    </div>
                ))}
                <div className="flex gap-2">
                    <button type="button" className="rounded bg-gray-200 px-3 py-1" onClick={() => curriculum.append({ label: '' })}>
                        + Ajouter jour
                    </button>
                    {!!curriculum.fields.length && (
                        <button type="button" className="rounded bg-gray-100 px-3 py-1" onClick={() => curriculum.remove(curriculum.fields.length - 1)}>
                            − Retirer dernier
                        </button>
                    )}
                </div>
            </section>

            {/* INTRO */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">Introduction</h2>
                <textarea {...form.register('intro.finalite')} placeholder="Finalité (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('intro.pourQui')} placeholder="Pour qui (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('intro.pasPourQui')} placeholder="Pas pour qui (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('intro.commentUtiliser')} placeholder="Comment l’utiliser (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('intro.cadreSecurite')} placeholder="Cadre & sécurité (md)" className="border rounded p-2 w-full" />
            </section>

            {/* CONCLUSION */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">Conclusion</h2>
                <textarea {...form.register('conclusion.texte')} placeholder="Texte (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('conclusion.kitEntretien')} placeholder="Kit d’entretien (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('conclusion.cap7_14_30')} placeholder="Cap 7–14–30 (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('conclusion.siCaDeraille')} placeholder="Si ça déraille (md)" className="border rounded p-2 w-full" />
                <textarea {...form.register('conclusion.allerPlusLoin')} placeholder="Aller plus loin (md)" className="border rounded p-2 w-full" />
            </section>

            {/* FAQ */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">FAQ</h2>
                {faq.fields.map((f, i) => (
                    <div key={f.id} className="grid gap-2 md:grid-cols-2 border rounded p-3">
                        <input {...form.register(`faq.${i}.q`, { required: true })} placeholder="Question" className="border rounded p-2" />
                        <input {...form.register(`faq.${i}.a`, { required: true })} placeholder="Réponse" className="border rounded p-2" />
                    </div>
                ))}
                <div className="flex gap-2">
                    <button type="button" className="rounded bg-gray-200 px-3 py-1" onClick={() => faq.append({ q: '', a: '' })}>
                        + Ajouter
                    </button>
                    {!!faq.fields.length && (
                        <button type="button" className="rounded bg-gray-100 px-3 py-1" onClick={() => faq.remove(faq.fields.length - 1)}>
                            − Retirer dernier
                        </button>
                    )}
                </div>
            </section>

            {/* TÉMOIGNAGES */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">Témoignages</h2>
                {testimonials.fields.map((f, i) => (
                    <div key={f.id} className="grid gap-2 md:grid-cols-4 border rounded p-3">
                        <input {...form.register(`testimonials.${i}.name`, { required: true })} placeholder="Nom" className="border rounded p-2" />
                        <input {...form.register(`testimonials.${i}.role`)} placeholder="Rôle" className="border rounded p-2" />
                        <input {...form.register(`testimonials.${i}.text`, { required: true })} placeholder="Texte" className="border rounded p-2" />
                        <input {...form.register(`testimonials.${i}.avatar`)} placeholder="Avatar URL" className="border rounded p-2" />
                    </div>
                ))}
                <div className="flex gap-2">
                    <button type="button" className="rounded bg-gray-200 px-3 py-1" onClick={() => testimonials.append({ name: '', text: '' })}>
                        + Ajouter
                    </button>
                    {!!testimonials.fields.length && (
                        <button type="button" className="rounded bg-gray-100 px-3 py-1" onClick={() => testimonials.remove(testimonials.fields.length - 1)}>
                            − Retirer dernier
                        </button>
                    )}
                </div>
            </section>

            {/* SEO */}
            <section className="space-y-2">
                <h2 className="font-semibold text-lg">SEO</h2>
                <input {...form.register('seo.title')} placeholder="SEO Title" className="border rounded p-2 w-full" />
                <input {...form.register('seo.description')} placeholder="SEO Description" className="border rounded p-2 w-full" />
                <input {...form.register('seo.image')} placeholder="SEO Image URL" className="border rounded p-2 w-full" />
            </section>

            <div className="flex items-center gap-2">
                <button type="submit" className="rounded bg-purple-600 px-4 py-2 text-white">
                    Enregistrer
                </button>
            </div>

            <input type="hidden" {...form.register('programSlug')} />
        </form>
    );
}
