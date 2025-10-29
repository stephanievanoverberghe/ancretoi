// app/admin/programs/new/page.tsx
import 'server-only';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';

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
        .replace(/^-+|-+$/g, '');
}
function uppercase3(s?: string | null): string {
    return (s ?? 'EUR').toUpperCase();
}

/* ======================= Page ======================= */
export default async function NewProgramPage() {
    await requireAdmin();
    await dbConnect();

    async function createProgram(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        // helpers (sans any)
        const getAll = (k: string) => formData.getAll(k).map((v) => String(v ?? '').trim());
        const getStr = (k: string) => String(formData.get(k) ?? '').trim();
        const getNumInt = (k: string, fallback: number) => {
            const raw = String(formData.get(k) ?? '').trim();
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : fallback;
        };
        const getNumNullable = (k: string) => {
            const raw = String(formData.get(k) ?? '').trim();
            if (raw === '') return null;
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : null;
        };
        // lit la DERNIÈRE valeur envoyée (utile si hidden + checkbox partagent le même name)
        const getBool = (k: string, def = true) => {
            const values = getAll(k);
            const v = (values.length ? values[values.length - 1] : String(formData.get(k) ?? '')).toLowerCase();
            if (v === 'true' || v === '1' || v === 'on') return true;
            if (v === 'false' || v === '0' || v === 'off') return false;
            return def;
        };
        const cleanOpt = (s: string) => (s.length ? s : undefined);

        const raw = {
            slug: slugify(getStr('slug')),
            status: getStr('status') || 'draft',
            title: getStr('title'),

            durationDays: getNumInt('durationDays', 7),
            estMinutesPerDay: getNumInt('estMinutesPerDay', 20),
            level: (getStr('level') || 'Basique') as 'Basique' | 'Cible' | 'Premium',
            category: getStr('category') || 'wellbeing',
            tagsCsv: getStr('tags'),

            heroImageUrl: cleanOpt(getStr('heroImageUrl')),
            heroImageAlt: getStr('heroImageAlt'),
            cardImageUrl: cleanOpt(getStr('cardImageUrl')),
            cardImageAlt: getStr('cardImageAlt'),
            cardTagline: getStr('cardTagline'),
            cardSummary: getStr('cardSummary'),
            accentColor: getStr('accentColor'),

            // ✅ comparateur
            objectif: getStr('objectif'),
            charge: getStr('charge'),
            ideal_si: getStr('ideal_si'),
            cta: getStr('cta'),

            amountCents: getNumNullable('amountCents'),
            currency: uppercase3(getStr('currency') || 'EUR'),
            taxIncluded: getBool('taxIncluded', true),
            compareAtCents: getNumNullable('compareAtCents'),
            stripePriceId: cleanOpt(getStr('stripePriceId')),
        };

        const tags =
            raw.tagsCsv.length > 0
                ? raw.tagsCsv
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
        const zNullableCents = z.union([z.number().int().min(0), z.null()]).optional();

        const Schema = z.object({
            slug: z.string().min(1, 'Slug requis'),
            status: z.enum(['draft', 'preflight', 'published']).default('draft'),
            title: z.string().min(1, 'Titre requis'),
            durationDays: z.number().int().min(1).max(365),
            estMinutesPerDay: z.number().int().min(1).max(180),
            level: z.enum(['Basique', 'Cible', 'Premium']).default('Basique'),
            category: z.string().min(1),
            tags: z.array(z.string()).default([]),

            heroImageUrl: zUrlOrPath,
            heroImageAlt: z.string().optional(),
            cardImageUrl: zUrlOrPath,
            cardImageAlt: z.string().optional(),
            cardTagline: z.string().optional(),
            cardSummary: z.string().optional(),
            accentColor: z.string().optional(),

            // ✅ comparateur
            objectif: z.string().optional(),
            charge: z.string().optional(),
            ideal_si: z.string().optional(),
            cta: z.string().optional(),

            amountCents: zNullableCents,
            currency: z.string().length(3).optional().default('EUR'),
            taxIncluded: z.boolean().optional().default(true),
            compareAtCents: zNullableCents,
            stripePriceId: z.string().optional(),
        });

        const data = Schema.parse({ ...raw, tags });
        const programSlug = data.slug;

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
                        badges: [`${data.durationDays} jours`, data.level].filter(Boolean),
                    },
                    meta: {
                        durationDays: data.durationDays,
                        estMinutesPerDay: data.estMinutesPerDay,
                        level: data.level,
                        category: data.category,
                        tags: data.tags ?? [],
                        language: 'fr',
                    },
                    // ✅ comparateur
                    compare: {
                        objectif: data.objectif,
                        charge: data.charge,
                        idealSi: data.ideal_si,
                        ctaLabel: data.cta,
                    },
                    // Prix
                    price: {
                        amountCents: data.amountCents ?? null,
                        currency: uppercase3(data.currency ?? 'EUR'),
                        taxIncluded: data.taxIncluded ?? true,
                        compareAtCents: data.compareAtCents ?? null,
                        stripePriceId: data.stripePriceId ?? null,
                    },
                },
            },
            { new: true, upsert: true }
        ).lean();

        // On enchaîne directement sur la page d'édition au même design
        redirect(`/admin/programs/${programSlug}/edit?created=1`);
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
                            <Link href="/admin/programs" className="hover:underline">
                                Programmes
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-gray-700">Nouveau</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Nouveau programme</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Crée l’entrée programme : <em>Hero</em>, <em>Card</em>, <em>Meta</em>, <em>Comparateur</em> et (optionnel) <em>Prix</em>.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/programs" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Retour liste
                        </Link>
                    </div>
                </div>
            </div>

            {/* ===== Form ===== */}
            <form action={createProgram} className="relative">
                {/* CTA sticky mobile */}
                <div className="md:hidden sticky bottom-3 z-20 flex justify-center">
                    <button className="rounded-xl bg-violet-600 px-5 py-3 text-white shadow-lg shadow-violet-600/20 ring-1 ring-black/5" type="submit">
                        Créer le programme
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
                                <div className="text-sm text-gray-600 mb-1">Slug</div>
                                <input name="slug" placeholder="reset-7" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Généralement en kebab-case. Ex : <code>reset-7</code>.
                                </p>
                            </label>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Titre (hero.title)</div>
                                <input name="title" placeholder="RESET-7" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">Affiché en grand dans le Hero.</p>
                            </label>

                            {/* Segmented status (labels FR, valeurs techniques) */}
                            <fieldset className="block">
                                <div className="text-sm text-gray-600 mb-1">Statut</div>
                                <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                    {(
                                        [
                                            { v: 'draft', label: 'Brouillon' },
                                            { v: 'preflight', label: 'Prévol' },
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
                        </div>
                    </section>

                    {/* ---- Card: Visuels ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Visuels</h2>
                            <span className="text-xs text-gray-500">Optionnels</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Hero image PATH</div>
                                    <input name="heroImageUrl" placeholder="/images/programs/reset-7/hero.jpg" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                    <input name="heroImageAlt" placeholder="Texte alternatif" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>

                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card image PATH</div>
                                    <input name="cardImageUrl" placeholder="/images/programs/reset-7/card.jpg" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                    <input name="cardImageAlt" placeholder="Texte alternatif" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card tagline</div>
                                    <input name="cardTagline" placeholder="7 jours pour…" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card summary</div>
                                    <input name="cardSummary" placeholder="Un mini-parcours pour…" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Couleur d’accent (card)</div>
                                <input name="accentColor" placeholder="#6D28D9" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">Hexa. Utilisée pour les surlignages de la carte.</p>
                            </label>
                        </div>
                    </section>

                    {/* ---- Card: Meta ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Meta</h2>
                            <span className="text-xs text-gray-500">Obligatoire</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Jours (durationDays)</div>
                                    <input name="durationDays" type="number" defaultValue={7} min={1} max={365} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Minutes / jour</div>
                                    <input
                                        name="estMinutesPerDay"
                                        type="number"
                                        defaultValue={20}
                                        min={1}
                                        max={180}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Niveau</div>
                                    <select name="level" defaultValue="Basique" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                                        <option value="Basique">Basique</option>
                                        <option value="Cible">Cible</option>
                                        <option value="Premium">Premium</option>
                                    </select>
                                </label>
                                <label className="block md:col-span-2">
                                    <div className="text-sm text-gray-600 mb-1">Catégorie</div>
                                    <input name="category" placeholder="wellbeing" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Tags (séparés par des virgules)</div>
                                <input name="tags" placeholder="respiration, routine, 7j" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Ex : <code>respiration, routine, 7j</code>.
                                </p>
                            </label>
                        </div>
                    </section>

                    {/* ---- Card: Comparateur ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Comparateur</h2>
                            <span className="text-xs text-gray-500">Recommandé</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Objectif</div>
                                    <input name="objectif" placeholder="Réinitialiser ton rythme" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Charge/jour</div>
                                    <input name="charge" placeholder="10–15 min/j" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Idéal si…</div>
                                <input name="ideal_si" placeholder="Tu veux poser 3 micro-rituels tenables" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                            </label>
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">CTA (facultatif)</div>
                                <input name="cta" placeholder="Voir RESET-7" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                            </label>
                        </div>
                    </section>

                    {/* ---- Card: Prix ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Prix</h2>
                            <span className="text-xs text-gray-500">Optionnel</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Montant (centimes)</div>
                                    <input name="amountCents" type="number" min={0} placeholder="12900" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                    <p className="text-[11px] text-gray-500 mt-1">Laisse vide pour “Bientôt”.</p>
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Devise (3 lettres)</div>
                                    <input name="currency" defaultValue="EUR" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    {/* IMPORTANT: hidden puis checkbox (on lira la dernière valeur via getAll) */}
                                    <input type="hidden" name="taxIncluded" value="false" />
                                    <input type="checkbox" name="taxIncluded" defaultChecked />
                                    <span className="text-sm text-gray-700">TTC (taxIncluded)</span>
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Prix barré (centimes)</div>
                                    <input name="compareAtCents" type="number" min={0} placeholder="15900" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Stripe Price ID</div>
                                <input name="stripePriceId" placeholder="price_123..." className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                            </label>
                        </div>
                    </section>
                </div>

                {/* Desktop Submit */}
                <div className="mt-6 hidden md:flex justify-end">
                    <button className="btn cursor-pointer" type="submit">
                        Créer le programme
                    </button>
                </div>
            </form>
        </div>
    );
}
