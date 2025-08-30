import 'server-only';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { redirect, notFound } from 'next/navigation';
import UpdateSuccessModal from '../../components/UpdateSuccessModal';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function formatCsv(arr?: string[] | null) {
    return Array.isArray(arr) ? arr.join(', ') : '';
}

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

            // 🔥 comparateur (form fields)
            objectif: getStr('objectif'),
            charge: getStr('charge'),
            ideal_si: getStr('ideal_si'),
            cta: getStr('cta'),

            amountCents: getNumNullable('amountCents'),
            currency: (getStr('currency') || page.price?.currency || 'EUR').toUpperCase(),
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
                    // ✅ comparateur
                    compare: {
                        objectif: data.objectif || page.compare?.objectif || undefined,
                        charge: data.charge || page.compare?.charge || undefined,
                        idealSi: data.ideal_si || page.compare?.idealSi || undefined,
                        ctaLabel: data.cta || page.compare?.ctaLabel || undefined,
                    },
                    price: {
                        amountCents: data.amountCents ?? null,
                        currency: (data.currency ?? 'EUR').toUpperCase(),
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

    return (
        <div className="max-w-2xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Éditer : {page.programSlug}</h1>
            <UpdateSuccessModal />

            <form action={updateProgram} className="grid gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Slug</div>
                        <input disabled value={page.programSlug} className="border rounded p-2 w-full bg-gray-50" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Statut</div>
                        <select name="status" className="border rounded p-2 w-full" defaultValue={page.status ?? 'draft'}>
                            <option value="draft">draft</option>
                            <option value="preflight">preflight</option>
                            <option value="published">published</option>
                        </select>
                    </label>
                </div>

                <label className="block">
                    <div className="text-sm text-muted-foreground mb-1">Titre (hero.title)</div>
                    <input name="title" defaultValue={page.hero?.title ?? ''} className="border rounded p-2 w-full" />
                </label>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Jours (durationDays)</div>
                        <input name="durationDays" type="number" min={1} max={365} defaultValue={page.meta?.durationDays ?? 7} className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Minutes / jour</div>
                        <input name="estMinutesPerDay" type="number" min={1} max={180} defaultValue={page.meta?.estMinutesPerDay ?? 20} className="border rounded p-2 w-full" />
                    </label>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Niveau</div>
                        <select name="level" className="border rounded p-2 w-full" defaultValue={page.meta?.level ?? 'Basique'}>
                            <option value="Basique">Basique</option>
                            <option value="Cible">Cible</option>
                            <option value="Premium">Premium</option>
                        </select>
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Catégorie</div>
                        <input name="category" defaultValue={page.meta?.category ?? 'wellbeing'} className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Tags (CSV)</div>
                        <input name="tags" defaultValue={formatCsv(page.meta?.tags)} className="border rounded p-2 w-full" />
                    </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Hero image PATH</div>
                        <input name="heroImageUrl" defaultValue={page.hero?.heroImage?.url ?? ''} className="border rounded p-2 w-full" />
                        <input name="heroImageAlt" defaultValue={page.hero?.heroImage?.alt ?? ''} className="border rounded p-2 w-full mt-2" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card image PATH</div>
                        <input name="cardImageUrl" defaultValue={page.card?.image?.url ?? ''} className="border rounded p-2 w-full" />
                        <input name="cardImageAlt" defaultValue={page.card?.image?.alt ?? ''} className="border rounded p-2 w-full mt-2" />
                    </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card tagline</div>
                        <input name="cardTagline" defaultValue={page.card?.tagline ?? ''} className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Card summary</div>
                        <input name="cardSummary" defaultValue={page.card?.summary ?? ''} className="border rounded p-2 w-full" />
                    </label>
                </div>

                <label className="block">
                    <div className="text-sm text-muted-foreground mb-1">Couleur d’accent (card)</div>
                    <input name="accentColor" defaultValue={page.card?.accentColor ?? ''} className="border rounded p-2 w-full" />
                </label>

                {/* ✅ Comparateur */}
                <fieldset className="mt-2 grid gap-3 border rounded-lg p-3">
                    <legend className="text-sm font-medium">Comparateur</legend>
                    <div className="grid md:grid-cols-2 gap-3">
                        <label className="block">
                            <div className="text-sm text-muted-foreground mb-1">Objectif</div>
                            <input name="objectif" defaultValue={page.compare?.objectif ?? ''} className="border rounded p-2 w-full" />
                        </label>
                        <label className="block">
                            <div className="text-sm text-muted-foreground mb-1">Charge/j</div>
                            <input name="charge" defaultValue={page.compare?.charge ?? ''} className="border rounded p-2 w-full" />
                        </label>
                    </div>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Idéal si…</div>
                        <input name="ideal_si" defaultValue={page.compare?.idealSi ?? ''} className="border rounded p-2 w-full" />
                    </label>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">CTA (facultatif)</div>
                        <input name="cta" defaultValue={page.compare?.ctaLabel ?? ''} className="border rounded p-2 w-full" />
                    </label>
                </fieldset>

                {/* Prix */}
                <fieldset className="mt-4 grid gap-3 border rounded-lg p-3">
                    <legend className="text-sm font-medium">Prix</legend>
                    <div className="grid md:grid-cols-2 gap-3">
                        <label className="block">
                            <div className="text-sm text-muted-foreground mb-1">Montant (centimes)</div>
                            <input name="amountCents" type="number" min={0} defaultValue={page.price?.amountCents ?? ''} className="border rounded p-2 w-full" />
                        </label>
                        <label className="block">
                            <div className="text-sm text-muted-foreground mb-1">Devise</div>
                            <input name="currency" defaultValue={(page.price?.currency ?? 'EUR').toUpperCase()} className="border rounded p-2 w-full" />
                        </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" name="taxIncluded" defaultChecked={page.price?.taxIncluded ?? true} />
                            <input type="hidden" name="taxIncluded" value="false" />
                            <span className="text-sm">TTC</span>
                        </label>
                        <label className="block">
                            <div className="text-sm text-muted-foreground mb-1">Prix barré (centimes)</div>
                            <input name="compareAtCents" type="number" min={0} defaultValue={page.price?.compareAtCents ?? ''} className="border rounded p-2 w-full" />
                        </label>
                    </div>
                    <label className="block">
                        <div className="text-sm text-muted-foreground mb-1">Stripe Price ID</div>
                        <input name="stripePriceId" defaultValue={page.price?.stripePriceId ?? ''} className="border rounded p-2 w-full" />
                    </label>
                </fieldset>

                <div className="pt-2">
                    <button className="px-4 py-2 rounded bg-purple-600 text-white">Enregistrer</button>
                </div>
            </form>
        </div>
    );
}
