// app/admin/programs/[slug]/edit/page.tsx
import 'server-only';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { redirect, notFound } from 'next/navigation';
import UpdateSuccessModal from '../../components/UpdateSuccessModal';
import Link from 'next/link';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ======================= Utils ======================= */
function formatCsv(arr?: string[] | null) {
    return Array.isArray(arr) ? arr.join(', ') : '';
}
function uppercase3(s?: string | null): string {
    return (s ?? 'EUR').toUpperCase();
}

/* ======================= Types (DB slice) ======================= */
type PgEdit = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null; heroImage?: { url?: string | null; alt?: string | null } | null } | null;
    card?: {
        image?: { url?: string | null; alt?: string | null } | null;
        tagline?: string | null;
        summary?: string | null;
        accentColor?: string | null;
    } | null;
    meta?: {
        durationDays?: number | null;
        estMinutesPerDay?: number | null;
        level?: 'Basique' | 'Cible' | 'Premium' | null;
        category?: string | null;
        tags?: string[] | null;
    } | null;
    price?: {
        amountCents?: number | null;
        currency?: string | null;
        taxIncluded?: boolean | null;
        compareAtCents?: number | null;
        stripePriceId?: string | null;
    } | null;
    compare?: {
        objectif?: string | null;
        charge?: string | null;
        idealSi?: string | null;
        ctaLabel?: string | null;
    } | null;
};

/* ======================= Page ======================= */
export default async function EditProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    const { slug } = await params;
    const doc = await ProgramPage.findOne({ programSlug: slug }).lean<PgEdit | null>();
    if (!doc) notFound();
    const page = doc as PgEdit;

    async function updateProgram(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        const getStr = (k: string) => String(formData.get(k) ?? '').trim();
        const getNumNullable = (k: string) => {
            const raw = String(formData.get(k) ?? '').trim();
            if (raw === '') return null;
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : null;
        };
        const getNumInt = (k: string, fallback: number) => {
            const raw = String(formData.get(k) ?? '').trim();
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : fallback;
        };
        const getBool = (k: string, def = true) => {
            const v = String(formData.get(k) ?? '')
                .trim()
                .toLowerCase();
            if (v === 'true' || v === '1' || v === 'on') return true;
            if (v === 'false' || v === '0' || v === 'off') return false;
            return def;
        };
        const cleanOpt = (s: string) => (s.length ? s : undefined);

        const raw = {
            status: getStr('status') || page.status || 'draft',
            title: getStr('title') || page.hero?.title || '',

            durationDays: getNumInt('durationDays', page.meta?.durationDays ?? 7),
            estMinutesPerDay: getNumInt('estMinutesPerDay', page.meta?.estMinutesPerDay ?? 20),
            level: (getStr('level') as 'Basique' | 'Cible' | 'Premium') || (page.meta?.level as 'Basique' | 'Cible' | 'Premium' | undefined) || 'Basique',
            category: getStr('category') || page.meta?.category || 'wellbeing',
            tagsCsv: getStr('tags'),

            heroImageUrl: cleanOpt(getStr('heroImageUrl')),
            heroImageAlt: getStr('heroImageAlt'),
            cardImageUrl: cleanOpt(getStr('cardImageUrl')),
            cardImageAlt: getStr('cardImageAlt'),
            cardTagline: getStr('cardTagline'),
            cardSummary: getStr('cardSummary'),
            accentColor: getStr('accentColor'),

            // comparateur
            objectif: getStr('objectif'),
            charge: getStr('charge'),
            ideal_si: getStr('ideal_si'),
            cta: getStr('cta'),

            amountCents: getNumNullable('amountCents'),
            currency: uppercase3(getStr('currency') || page.price?.currency || 'EUR'),
            taxIncluded: getBool('taxIncluded', page.price?.taxIncluded ?? true),
            compareAtCents: getNumNullable('compareAtCents'),
            stripePriceId: cleanOpt(getStr('stripePriceId')),
        };

        const zUrlOrPath = z
            .string()
            .trim()
            .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / ou http(s)://')
            .optional();
        const zNullableCents = z.union([z.number().int().min(0), z.null()]).optional();

        const Schema = z.object({
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

        const tags =
            raw.tagsCsv.length > 0
                ? raw.tagsCsv
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                : page.meta?.tags ?? [];

        const data = Schema.parse({ ...raw, tags });

        await ProgramPage.findOneAndUpdate(
            { programSlug: slug },
            {
                $set: {
                    status: data.status,
                    'hero.title': data.title,
                    ...(data.heroImageUrl ? { 'hero.heroImage': { url: data.heroImageUrl, alt: data.heroImageAlt ?? '' } } : {}),
                    card: {
                        image: data.cardImageUrl ? { url: data.cardImageUrl, alt: data.cardImageAlt ?? '' } : page.card?.image ?? undefined,
                        tagline: data.cardTagline || page.card?.tagline || undefined,
                        summary: data.cardSummary || page.card?.summary || undefined,
                        accentColor: data.accentColor || page.card?.accentColor || undefined,
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
                    compare: {
                        objectif: data.objectif || page.compare?.objectif || undefined,
                        charge: data.charge || page.compare?.charge || undefined,
                        idealSi: data.ideal_si || page.compare?.idealSi || undefined,
                        ctaLabel: data.cta || page.compare?.ctaLabel || undefined,
                    },
                    price: {
                        amountCents: data.amountCents ?? null,
                        currency: uppercase3(data.currency ?? 'EUR'),
                        taxIncluded: data.taxIncluded ?? true,
                        compareAtCents: data.compareAtCents ?? null,
                        stripePriceId: data.stripePriceId ?? null,
                    },
                },
            },
            { new: true }
        ).lean();

        redirect(`/admin/programs/${slug}/edit?updated=1`);
    }

    /* ======================= UI ======================= */
    const statusLabel: Record<PgEdit['status'], string> = {
        draft: 'Brouillon',
        preflight: 'Prévol',
        published: 'Publié',
    };

    const StatusBadge = ({ value }: { value: PgEdit['status'] }) => {
        const map: Record<PgEdit['status'], string> = {
            draft: 'bg-gray-100 text-gray-700 ring-gray-200',
            preflight: 'bg-amber-50 text-amber-800 ring-amber-200',
            published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        };
        return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${map[value]}`}>{statusLabel[value]}</span>;
    };

    return (
        <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
            {/* ===== Header / Breadcrumb + Kicker ===== */}
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
                            <span className="text-gray-700">{page.programSlug}</span>
                        </div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Éditer : {page.programSlug}</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Ajuste le <em>Hero</em>, le <em>Card</em>, la <em>Meta</em>, le <em>Comparateur</em> et le <em>Prix</em>. Les modifications sont sauvegardées au submit.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge value={page.status} />
                        <Link href={`/programs/${page.programSlug}`} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Voir la landing
                        </Link>
                    </div>
                </div>
            </div>

            <UpdateSuccessModal />

            {/* ===== Form ===== */}
            <form action={updateProgram} className="relative">
                {/* CTA sticky on mobile */}
                <div className="md:hidden sticky bottom-3 z-20 flex justify-center">
                    <button className="rounded-xl bg-violet-600 px-5 py-3 text-white shadow-lg shadow-violet-600/20 ring-1 ring-black/5" type="submit">
                        Enregistrer les modifications
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
                                <input disabled value={page.programSlug} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700" />
                            </label>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Titre (hero.title)</div>
                                <input
                                    name="title"
                                    defaultValue={page.hero?.title ?? ''}
                                    placeholder="Ex. RESET-7"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">Affiché en grand dans le Hero.</p>
                            </label>

                            {/* Segmented status */}
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
                                                defaultChecked={(page.status ?? 'draft') === opt.v}
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

                    {/* ---- Card: Hero & Card visuels ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Visuels</h2>
                            <span className="text-xs text-gray-500">Optionnels</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Hero image PATH</div>
                                    <input
                                        name="heroImageUrl"
                                        defaultValue={page.hero?.heroImage?.url ?? ''}
                                        placeholder="/images/hero.jpg ou https://…"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                    <input
                                        name="heroImageAlt"
                                        defaultValue={page.hero?.heroImage?.alt ?? ''}
                                        placeholder="Texte alternatif"
                                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>

                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card image PATH</div>
                                    <input
                                        name="cardImageUrl"
                                        defaultValue={page.card?.image?.url ?? ''}
                                        placeholder="/images/card.jpg ou https://…"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                    <input
                                        name="cardImageAlt"
                                        defaultValue={page.card?.image?.alt ?? ''}
                                        placeholder="Texte alternatif"
                                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card tagline</div>
                                    <input
                                        name="cardTagline"
                                        defaultValue={page.card?.tagline ?? ''}
                                        placeholder="7 jours pour…"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Card summary</div>
                                    <input
                                        name="cardSummary"
                                        defaultValue={page.card?.summary ?? ''}
                                        placeholder="Un mini-parcours pour…"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Couleur d’accent (card)</div>
                                <input
                                    name="accentColor"
                                    defaultValue={page.card?.accentColor ?? ''}
                                    placeholder="#6D28D9"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                />
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
                                    <input
                                        name="durationDays"
                                        type="number"
                                        min={1}
                                        max={365}
                                        defaultValue={page.meta?.durationDays ?? 7}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Minutes / jour</div>
                                    <input
                                        name="estMinutesPerDay"
                                        type="number"
                                        min={1}
                                        max={180}
                                        defaultValue={page.meta?.estMinutesPerDay ?? 20}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Niveau</div>
                                    <select name="level" defaultValue={page.meta?.level ?? 'Basique'} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                                        <option value="Basique">Basique</option>
                                        <option value="Cible">Cible</option>
                                        <option value="Premium">Premium</option>
                                    </select>
                                </label>
                                <label className="block md:col-span-2">
                                    <div className="text-sm text-gray-600 mb-1">Catégorie</div>
                                    <input name="category" defaultValue={page.meta?.category ?? 'wellbeing'} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Tags (CSV)</div>
                                <input
                                    name="tags"
                                    defaultValue={formatCsv(page.meta?.tags)}
                                    placeholder="respiration, routine, 7j"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                />
                                <p className="mt-1 text-[11px] text-gray-500">Sépare par des virgules.</p>
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
                                    <input
                                        name="objectif"
                                        defaultValue={page.compare?.objectif ?? ''}
                                        placeholder="Réinitialiser ton rythme"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Charge/jour</div>
                                    <input
                                        name="charge"
                                        defaultValue={page.compare?.charge ?? ''}
                                        placeholder="10–15 min/j"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Idéal si…</div>
                                <input
                                    name="ideal_si"
                                    defaultValue={page.compare?.idealSi ?? ''}
                                    placeholder="Tu veux poser 3 micro-rituels tenables"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                />
                            </label>
                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">CTA (facultatif)</div>
                                <input
                                    name="cta"
                                    defaultValue={page.compare?.ctaLabel ?? ''}
                                    placeholder="Voir RESET-7"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                />
                            </label>
                        </div>
                    </section>

                    {/* ---- Card: Prix ---- */}
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 ring-1 ring-black/5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-900">Prix</h2>
                            <span className="text-xs text-gray-500">Optionnel (géré ailleurs possible)</span>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Montant (centimes)</div>
                                    <input
                                        name="amountCents"
                                        type="number"
                                        min={0}
                                        defaultValue={page.price?.amountCents ?? ''}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Devise</div>
                                    <input name="currency" defaultValue={uppercase3(page.price?.currency)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                                </label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    {/* checkbox + hidden fallback */}
                                    <input type="hidden" name="taxIncluded" value="false" />
                                    <input type="checkbox" name="taxIncluded" defaultChecked={page.price?.taxIncluded ?? true} />
                                    <span className="text-sm text-gray-700">TTC</span>
                                </label>
                                <label className="block">
                                    <div className="text-sm text-gray-600 mb-1">Prix barré (centimes)</div>
                                    <input
                                        name="compareAtCents"
                                        type="number"
                                        min={0}
                                        defaultValue={page.price?.compareAtCents ?? ''}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <div className="text-sm text-gray-600 mb-1">Stripe Price ID</div>
                                <input name="stripePriceId" defaultValue={page.price?.stripePriceId ?? ''} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
                            </label>
                        </div>
                    </section>
                </div>

                {/* Desktop Submit */}
                <div className="mt-6 hidden md:flex justify-end">
                    <button className="btn cursor-pointer" type="submit">
                        Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>
    );
}
