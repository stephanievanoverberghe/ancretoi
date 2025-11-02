// src/models/ProgramPage.ts
import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const ImageSchema = new Schema({ url: { type: String, required: true }, alt: { type: String, default: '' } }, { _id: false });
const FaqSchema = new Schema({ q: { type: String, required: true }, a: { type: String, required: true } }, { _id: false });
const BenefitSchema = new Schema({ icon: { type: String, default: '' }, title: { type: String, required: true }, text: { type: String, required: true } }, { _id: false });
const SeoSchema = new Schema({ title: { type: String, default: '' }, description: { type: String, default: '' }, image: { type: String, default: '' } }, { _id: false });
const CurriculumItemSchema = new Schema({ label: { type: String, required: true }, summary: { type: String, default: '' } }, { _id: false });

const PriceSchema = new Schema(
    {
        amountCents: { type: Number, default: null },
        currency: { type: String, default: 'EUR' },
        taxIncluded: { type: Boolean, default: true },
        compareAtCents: { type: Number, default: null },
        stripePriceId: { type: String, default: null },
    },
    { _id: false }
);

const ProgramPageSchema = new Schema(
    {
        programSlug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

        // ========== HERO (depuis marketing.hero) ==========
        hero: {
            eyebrow: { type: String, default: '' },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            ctaLabel: { type: String, default: '' }, // dérivé si ctaHref présent
            ctaHref: { type: String, default: '' },
            heroImage: { type: ImageSchema, default: null }, // string -> objet image normalisé
        },

        // ========== CARD (dérivée du marketing : objective/durationLabel + heroImage) ==========
        card: {
            image: { type: ImageSchema, default: null },
            tagline: { type: String, default: '' }, // marketing.durationLabel OU "X jours • Y min/j"
            summary: { type: String, default: '' }, // marketing.objective
            accentColor: { type: String, default: '' },
            badges: { type: [String], default: [] }, // [durationBadge, level]
        },

        // ========== META (depuis identité) ==========
        meta: {
            durationDays: { type: Number, min: 1, max: 365, default: 7 },
            estMinutesPerDay: { type: Number, min: 1, max: 180, default: 20 },
            level: { type: String, enum: ['Basique', 'Cible', 'Premium'], default: 'Basique' },
            category: { type: String, default: 'wellbeing' },
            tags: { type: [String], default: [] },
            language: { type: String, default: 'fr' },
        },

        // ========== CONTENU MARKETING ==========
        highlights: { type: [BenefitSchema], default: [] }, // inclut "Idéal si…" mappé en premier item si présent
        curriculum: { type: [CurriculumItemSchema], default: [] }, // { label: day.title, summary: '' }
        faq: { type: [FaqSchema], default: [] },
        seo: { type: SeoSchema, default: {} },

        price: { type: PriceSchema, default: { currency: 'EUR', taxIncluded: true } },
        status: { type: String, enum: ['draft', 'preflight', 'published'], default: 'draft', index: true },
    },
    { timestamps: true, versionKey: false }
);

export type ProgramPageDoc = InferSchemaType<typeof ProgramPageSchema> & { _id: Types.ObjectId };
const ProgramPageModel: Model<ProgramPageDoc> = (models.ProgramPage as Model<ProgramPageDoc>) || model<ProgramPageDoc>('ProgramPage', ProgramPageSchema);

export default ProgramPageModel;
