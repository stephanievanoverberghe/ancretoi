'use client';
import { useForm, useFieldArray } from 'react-hook-form';

type Benefit = { icon?: string; title: string; text: string };
type QA = { q: string; a: string };
type Testimonial = { name: string; role?: string; text: string; avatar?: string };
type Seo = { title?: string; description?: string; image?: string };
type CurriculumItem = { label: string };

type PageForm = {
    programSlug: string;
    hero: { eyebrow?: string; title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string; heroImage?: string };
    highlights: Benefit[];
    curriculum: CurriculumItem[];
    testimonials: Testimonial[];
    faq: QA[];
    seo: Seo;
    status: 'draft' | 'published';
};

export default function ProgramPageEditor({
    slug,
    initialPage,
}: {
    slug: string;
    // ⬇️ initialPage typé proprement (partiel + nullable)
    initialPage: Partial<PageForm> | null;
}) {
    const defaults: PageForm = {
        programSlug: slug,
        status: initialPage?.status ?? 'draft',
        hero: initialPage?.hero ?? {},
        highlights: initialPage?.highlights ?? [],
        curriculum: (initialPage?.curriculum as CurriculumItem[] | undefined) ?? [], // ⬅️
        testimonials: initialPage?.testimonials ?? [],
        faq: initialPage?.faq ?? [],
        seo: initialPage?.seo ?? {},
    };

    const form = useForm<PageForm>({ defaultValues: defaults });

    const hl = useFieldArray({ control: form.control, name: 'highlights' });
    const cur = useFieldArray({ control: form.control, name: 'curriculum' });

    async function onSubmit(v: PageForm) {
        await fetch('/api/admin/pages', {
            method: 'POST',
            headers: { 'content-type': 'application/json' }, // ⬅️ header
            body: JSON.stringify(v),
        });
        alert('Page enregistrée ✅');
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6 space-y-6">
            {/* ...Hero inchangé... */}

            <section className="space-y-2">
                <h2 className="font-semibold">Bénéfices</h2>
                {hl.fields.map((f, i) => (
                    <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded p-3">
                        <input {...form.register(`highlights.${i}.icon` as const)} placeholder="Icon/emoji" className="border rounded p-2" />
                        <input {...form.register(`highlights.${i}.title` as const)} placeholder="Titre" className="border rounded p-2" />
                        <input {...form.register(`highlights.${i}.text` as const)} placeholder="Texte" className="border rounded p-2" />
                    </div>
                ))}
                <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={() => hl.append({ title: '', text: '' })}>
                    + Ajout
                </button>
            </section>

            <section className="space-y-2">
                <h2 className="font-semibold">Curriculum (J1→J7)</h2>
                {cur.fields.map((f, i) => (
                    <input
                        key={f.id}
                        {...form.register(`curriculum.${i}.label` as const)} // ⬅️ .label
                        placeholder={`Jour ${i + 1} — libellé`}
                        className="border rounded p-2 w-full"
                    />
                ))}
                <button
                    type="button"
                    className="px-3 py-1 bg-gray-200 rounded"
                    onClick={() => cur.append({ label: '' })} // ⬅️ objet
                >
                    + Ajout
                </button>
            </section>

            {/* ...Témoignages / FAQ / SEO inchangés... */}

            <div className="flex items-center gap-2">
                <select {...form.register('status')} className="border rounded p-2">
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                </select>
                <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white">
                    Enregistrer
                </button>
            </div>

            <input type="hidden" {...form.register('programSlug')} />
        </form>
    );
}
