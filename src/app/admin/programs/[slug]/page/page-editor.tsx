// src/app/admin/programs/new/page.tsx
import 'server-only';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BUILD_LABEL = 'NewProgramPage v2 (server action)';

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default async function NewProgramPage() {
    await requireAdmin();
    await dbConnect();

    async function createProgram(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        const getStr = (k: string) => String(formData.get(k) ?? '').trim();
        const getNum = (k: string, fallback: number) => {
            const v = Number(formData.get(k));
            return Number.isFinite(v) ? v : fallback;
        };

        // Lecture brute
        const raw = {
            slug: slugify(getStr('slug')),
            title: getStr('title'),
            status: getStr('status') || 'draft',
            durationDays: getNum('durationDays', 7),
            estMinutesPerDay: getNum('estMinutesPerDay', 20),
            level: getStr('level') || 'beginner',
            category: getStr('category') || 'wellbeing',
            tags: getStr('tags'), // CSV -> normalisé plus bas
            heroImageUrl: getStr('heroImageUrl'),
            heroImageAlt: getStr('heroImageAlt'),
            cardImageUrl: getStr('cardImageUrl'),
            cardImageAlt: getStr('cardImageAlt'),
            cardTagline: getStr('cardTagline'),
            cardSummary: getStr('cardSummary'),
            accentColor: getStr('accentColor'),
        };

        // Normalisation tags
        const tags =
            raw.tags.length > 0
                ? raw.tags
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [];

        // Validation
        const zUrlOrPath = z
            .string()
            .trim()
            .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / ou http(s)://')
            .optional();

        const Schema = z.object({
            slug: z.string().min(1, 'Slug requis'),
            title: z.string().min(1, 'Titre requis'),
            status: z.enum(['draft', 'preflight', 'published']).default('draft'),
            durationDays: z.number().int().min(1).max(365),
            estMinutesPerDay: z.number().int().min(1).max(180),
            level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
            category: z.string().min(1),
            tags: z.array(z.string()).optional().default([]),
            heroImageUrl: zUrlOrPath,
            heroImageAlt: z.string().optional(),
            cardImageUrl: zUrlOrPath,
            cardImageAlt: z.string().optional(),
            cardTagline: z.string().optional(),
            cardSummary: z.string().optional(),
            accentColor: z.string().optional(),
        });

        const data = Schema.parse({ ...raw, tags });

        const programSlug = data.slug;

        // Upsert en base
        await ProgramPage.findOneAndUpdate(
            { programSlug },
            {
                $setOnInsert: { programSlug },
                $set: {
                    status: data.status,
                    'hero.title': data.title,
                    ...(data.heroImageUrl ? { 'hero.heroImage': { url: data.heroImageUrl, alt: data.heroImageAlt ?? '' } } : {}),
                    card: {
                        image: data.cardImageUrl ? { url: data.cardImageUrl, alt: data.cardImageAlt ?? '' } : undefined,
                        tagline: data.cardTagline || undefined,
                        summary: data.cardSummary || undefined,
                        accentColor: data.accentColor || undefined,
                        badges: [`${data.durationDays} jours`, data.level === 'beginner' ? 'Débutant' : data.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'].filter(Boolean),
                    },
                    meta: {
                        durationDays: data.durationDays,
                        estMinutesPerDay: data.estMinutesPerDay,
                        level: data.level,
                        category: data.category,
                        tags: data.tags ?? [],
                        language: 'fr',
                    },
                },
            },
            { new: true, upsert: true }
        ).lean();

        // Redirection directe vers l’éditeur de la landing (pas d’API, pas de JSON)
        redirect(`/admin/programs/${programSlug}/page?created=1`);
    }

    return (
        <div className="max-w-2xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Nouveau programme</h1>
            <div className="text-xs text-muted-foreground">{BUILD_LABEL}</div>

            <form action={createProgram} className="grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Slug</div>
                        <input name="slug" placeholder="reset-7" className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Statut</div>
                        <select name="status" className="border rounded p-2 w-full" defaultValue="draft">
                            <option value="draft">draft</option>
                            <option value="preflight">preflight</option>
                            <option value="published">published</option>
                        </select>
                    </label>
                </div>

                <label className="block">
                    <div className="text-sm text-muted-foreground mb-1">Titre (hero.title)</div>
                    <input name="title" placeholder="RESET-7" className="border rounded p-2 w-full" />
                </label>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Jours (durationDays)</div>
                        <input name="durationDays" type="number" defaultValue={7} min={1} max={365} className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Minutes / jour</div>
                        <input name="estMinutesPerDay" type="number" defaultValue={20} min={1} max={180} className="border rounded p-2 w-full" />
                    </label>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Niveau</div>
                        <select name="level" className="border rounded p-2 w-full" defaultValue="beginner">
                            <option value="beginner">Débutant</option>
                            <option value="intermediate">Intermédiaire</option>
                            <option value="advanced">Avancé</option>
                        </select>
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Catégorie</div>
                        <input name="category" placeholder="wellbeing" className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Tags (séparés par des virgules)</div>
                        <input name="tags" placeholder="respiration, routine, 7j" className="border rounded p-2 w-full" />
                    </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Hero image PATH</div>
                        <input name="heroImageUrl" placeholder="/images/programs/reset-7/hero.jpg" className="border rounded p-2 w-full" />
                        <input name="heroImageAlt" placeholder="Texte alternatif" className="border rounded p-2 w-full mt-2" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card image PATH</div>
                        <input name="cardImageUrl" placeholder="/images/programs/reset-7/card.jpg" className="border rounded p-2 w-full" />
                        <input name="cardImageAlt" placeholder="Texte alternatif" className="border rounded p-2 w-full mt-2" />
                    </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card tagline</div>
                        <input name="cardTagline" placeholder="7 jours pour..." className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card summary</div>
                        <input name="cardSummary" placeholder="Un mini-parcours pour..." className="border rounded p-2 w-full" />
                    </label>
                </div>

                <label className="block">
                    <div className="text-sm text-muted-foreground mb-1">Couleur d’accent (card)</div>
                    <input name="accentColor" placeholder="#6D28D9" className="border rounded p-2 w-full" />
                </label>

                <div className="pt-2">
                    <button className="px-4 py-2 rounded bg-purple-600 text-white">Créer</button>
                </div>
            </form>
        </div>
    );
}
