// src/app/admin/programs/[slug]/import/page.tsx
import 'server-only';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import { z } from 'zod';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { slug: string };

const zImage = z.union([
    z.string().min(1), // "/images/..." ou "https://..."
    z.object({ url: z.string().min(1), alt: z.string().optional(), width: z.number().optional(), height: z.number().optional() }),
]);

const zStep = z.object({
    kind: z.enum(['note', 'breath', 'visualize', 'prompt', 'movement', 'silence', 'other']).optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    seconds: z.number().int().optional(),
});

const zField = z.object({
    id: z.string().min(1),
    type: z.enum(['text_short', 'text_long', 'slider', 'checkbox', 'chips', 'score_group']),
    label: z.string().min(1),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    minLen: z.number().optional(),
    maxLen: z.number().optional(),
    options: z.array(z.string()).optional(),
});

const zResource = z.object({
    label: z.string().min(1),
    url: z.string().min(1),
});

const zProgramPage = z.object({
    // programSlug est optionnel dans le payload: on forcera celui de l'URL
    hero: z
        .object({
            eyebrow: z.string().optional(),
            title: z.string().optional(),
            subtitle: z.string().optional(),
            ctaLabel: z.string().optional(),
            ctaHref: z.string().optional(),
            heroImage: zImage.optional(),
        })
        .optional(),
    card: z
        .object({
            image: zImage.optional(),
            tagline: z.string().optional(),
            summary: z.string().optional(),
            accentColor: z.string().optional(),
            badges: z.array(z.string()).optional(),
        })
        .optional(),
    meta: z
        .object({
            durationDays: z.number().int().min(1).max(365).optional(),
            estMinutesPerDay: z.number().int().min(1).max(180).optional(),
            level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
            language: z.string().optional(),
            instructors: z.array(z.string()).optional(),
        })
        .optional(),
    highlights: z.array(z.object({ icon: z.string().optional(), title: z.string(), text: z.string() })).optional(),
    curriculum: z.array(z.object({ label: z.string(), summary: z.string().optional() })).optional(),
    testimonials: z.array(z.object({ name: z.string(), role: z.string().optional(), text: z.string(), avatar: z.string().optional() })).optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    seo: z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional() }).optional(),
    intro: z
        .object({
            finalite: z.string().optional(),
            pourQui: z.string().optional(),
            pasPourQui: z.string().optional(),
            commentUtiliser: z.string().optional(),
            cadreSecurite: z.string().optional(),
        })
        .optional(),
    conclusion: z
        .object({
            texte: z.string().optional(),
            kitEntretien: z.string().optional(),
            cap7_14_30: z.string().optional(),
            siCaDeraille: z.string().optional(),
            allerPlusLoin: z.string().optional(),
        })
        .optional(),
    status: z.enum(['draft', 'preflight', 'published']).optional(),
    version: z.string().optional(),
    publishedAt: z.string().datetime().optional(),
});

const zUnit = z.object({
    unitIndex: z.number().int().min(1).max(365),
    title: z.string().min(1),
    objectives: z.array(z.string()).optional().default([]),
    videoScript: z.array(zStep).optional().default([]),
    safetyNotes: z.string().optional().default(''),
    supportText: z.string().optional().default(''),
    resources: z.array(zResource).optional().default([]),
    introText: z.string().optional().default(''),
    mantra: z.string().optional().default(''),
    durationMin: z.number().int().min(1).max(180).optional().default(20),
    journalSchema: z
        .object({ fields: z.array(zField).optional().default([]) })
        .optional()
        .default({ fields: [] }),
    status: z.enum(['draft', 'published']).optional().default('draft'),
});

const zPayload = z.object({
    page: zProgramPage,
    units: z.array(zUnit).min(1),
});

function toImageObj(v?: unknown) {
    if (!v) return undefined;
    if (typeof v === 'string') return { url: v, alt: '' };
    const o = v as { url?: string; alt?: string; width?: number; height?: number };
    if (o.url) return o;
    return undefined;
}

export default async function ImportUnitsPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    await requireAdmin();
    await dbConnect();

    async function importAction(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        const raw = String(formData.get('json') || '').trim();
        if (!raw) throw new Error('JSON vide');

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error('JSON invalide');
        }

        const safe = zPayload.parse(parsed);
        const programSlug = slug.toLowerCase();

        // Upsert ProgramPage
        const p = safe.page;
        await ProgramPage.findOneAndUpdate(
            { programSlug },
            {
                $setOnInsert: { programSlug },
                $set: {
                    status: p.status ?? 'preflight',
                    hero: p.hero
                        ? {
                              eyebrow: p.hero.eyebrow,
                              title: p.hero.title,
                              subtitle: p.hero.subtitle,
                              ctaLabel: p.hero.ctaLabel,
                              ctaHref: p.hero.ctaHref,
                              heroImage: toImageObj(p.hero.heroImage),
                          }
                        : undefined,
                    card: p.card
                        ? {
                              image: toImageObj(p.card.image),
                              tagline: p.card.tagline,
                              summary: p.card.summary,
                              accentColor: p.card.accentColor,
                              badges: p.card.badges ?? [],
                          }
                        : undefined,
                    meta: p.meta
                        ? {
                              durationDays: p.meta.durationDays ?? 7,
                              estMinutesPerDay: p.meta.estMinutesPerDay ?? 20,
                              level: p.meta.level ?? 'beginner',
                              category: p.meta.category ?? 'wellbeing',
                              tags: p.meta.tags ?? [],
                              language: p.meta.language ?? 'fr',
                              instructors: p.meta.instructors ?? [],
                          }
                        : undefined,
                    highlights: p.highlights ?? [],
                    curriculum: p.curriculum ?? [],
                    testimonials: p.testimonials ?? [],
                    faq: p.faq ?? [],
                    seo: p.seo ?? {},
                    intro: p.intro ?? {},
                    conclusion: p.conclusion ?? {},
                    version: p.version ?? '1.0',
                    publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
                },
            },
            { new: true, upsert: true }
        ).lean();

        // Upsert Units (bulk)
        const ops = safe.units.map((u) => ({
            updateOne: {
                filter: { programSlug, unitType: 'day', unitIndex: u.unitIndex },
                update: {
                    $set: {
                        programSlug,
                        unitType: 'day',
                        title: u.title,
                        objectives: u.objectives ?? [],
                        videoScript: u.videoScript ?? [],
                        safetyNotes: u.safetyNotes ?? '',
                        supportText: u.supportText ?? '',
                        resources: u.resources ?? [],
                        introText: u.introText ?? '',
                        mantra: u.mantra ?? '',
                        durationMin: u.durationMin ?? 20,
                        journalSchema: u.journalSchema ?? { fields: [] },
                        status: u.status ?? 'draft',
                    },
                },
                upsert: true,
            },
        }));
        await Unit.bulkWrite(ops, { ordered: false });

        redirect(`/admin/programs/${programSlug}/units`);
    }

    return (
        <div className="max-w-3xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Importer le contenu — {slug}</h1>
            <form action={importAction} className="space-y-3">
                <textarea name="json" rows={18} placeholder="Collez ici le JSON (voir modèle ci-dessous)…" className="w-full border rounded p-3 font-mono text-sm" />
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded bg-purple-600 text-white">Importer en base</button>
                </div>
            </form>

            <details className="mt-6 rounded border p-4">
                <summary className="cursor-pointer font-medium">Voir modèle JSON — RESET-7</summary>
                <pre className="mt-3 whitespace-pre-wrap text-sm">
                    {`{
  "page": {
    "hero": {
      "title": "RESET-7",
      "subtitle": "7 jours pour retrouver énergie, focus et paix.",
      "ctaLabel": "Commencer",
      "ctaHref": "/checkout/reset-7",
      "heroImage": "/images/programs/reset-7/hero.webp"
    },
    "card": {
      "image": "/images/programs/reset-7/card.jpg",
      "tagline": "Micro-parcours guidé",
      "summary": "Des pratiques simples, 20 min/jour, résultats concrets.",
      "accentColor": "#6D28D9",
      "badges": ["7 jours", "Débutant"]
    },
    "meta": {
      "durationDays": 7,
      "estMinutesPerDay": 20,
      "level": "beginner",
      "category": "wellbeing",
      "tags": ["respiration","routine","ancrage"],
      "language": "fr",
      "instructors": ["Stéphanie V."]
    },
    "highlights": [
      { "icon": "🌱", "title": "Simple", "text": "Pas de blabla : une pratique, un déclic." },
      { "icon": "🧭", "title": "Guidé", "text": "Vidéo + journal intégré chaque jour." },
      { "icon": "🛟", "title": "Sécure", "text": "Cadre clair, écoute du corps, pas à pas." }
    ],
    "curriculum": [
      { "label": "J1 • Baseline & respiration", "summary": "Se situer, poser l’ancre." },
      { "label": "J2 • Corps & présence", "summary": "Scanner, micro-mouvements." },
      { "label": "J3 • Attention", "summary": "Focus & dispersion." },
      { "label": "J4 • Émotions", "summary": "Accueillir sans s’y noyer." },
      { "label": "J5 • Habitudes", "summary": "Rituels & friction." },
      { "label": "J6 • Plan 30j", "summary": "Prolonger au quotidien." },
      { "label": "J7 • Bilan", "summary": "Comparer J1/J7 + lettre à soi." }
    ],
    "intro": {
      "finalite": "Objectif et bénéfices attendus…",
      "pourQui": "Public visé…",
      "pasPourQui": "Contre-indications…",
      "commentUtiliser": "Rythme, matériel, posture…",
      "cadreSecurite": "Écoute de soi, limites, recours…"
    },
    "conclusion": {
      "texte": "Vous avez complété RESET-7…",
      "kitEntretien": "Routine courte…",
      "cap7_14_30": "Rendez-vous d’auto-check…",
      "siCaDeraille": "Que faire si…",
      "allerPlusLoin": "Programmes suivants…"
    },
    "status": "preflight"
  },
  "units": [
    {
      "unitIndex": 1,
      "title": "J1 — Baseline & respiration",
      "objectives": ["Mesurer J1","Découvrir la respiration ancre"],
      "videoScript": [
        {"kind":"note","title":"Accueil","text":"Bienvenue…","seconds":30},
        {"kind":"breath","title":"Respiration 4-2-6","text":"Assis, dos long…","seconds":300},
        {"kind":"prompt","title":"Intégration","text":"Ce que je remarque maintenant…","seconds":120}
      ],
      "safetyNotes": "Si vertiges : réduire l’amplitude, reprendre respiration naturelle.",
      "supportText": "Rappel : le but n’est pas la performance…",
      "resources": [{"label":"Timer respiration","url":"/resources/timer-4-2-6"}],
      "mantra": "Je m’ancre ici & maintenant.",
      "durationMin": 20,
      "journalSchema": {
        "fields": [
          {"id":"intention","type":"text_short","label":"Intention du jour","required":true},
          {"id":"ressenti","type":"text_long","label":"Ressenti après pratique"},
          {"id":"score_energie","type":"slider","label":"Énergie","min":0,"max":10,"step":1},
          {"id":"score_focus","type":"slider","label":"Focus","min":0,"max":10,"step":1},
          {"id":"score_paix","type":"slider","label":"Paix","min":0,"max":10,"step":1},
          {"id":"score_estime","type":"slider","label":"Estime","min":0,"max":10,"step":1}
        ]
      },
      "status": "published"
    },
    { "unitIndex": 2, "title": "J2 — Corps & présence", "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" },
    { "unitIndex": 3, "title": "J3 — Attention",        "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" },
    { "unitIndex": 4, "title": "J4 — Émotions",         "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" },
    { "unitIndex": 5, "title": "J5 — Habitudes",        "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" },
    { "unitIndex": 6, "title": "J6 — Plan 30j",         "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" },
    { "unitIndex": 7, "title": "J7 — Bilan",            "objectives": [], "journalSchema": { "fields": [] }, "status":"draft" }
  ]
}`}
                </pre>
            </details>
        </div>
    );
}
