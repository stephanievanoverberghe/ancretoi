import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const ImageSchema = new Schema(
    { url: { type: String, required: true }, alt: { type: String, default: '' }, width: { type: Number, default: null }, height: { type: Number, default: null } },
    { _id: false }
);
const FaqSchema = new Schema({ q: { type: String, default: '' }, a: { type: String, default: '' } }, { _id: false });
const BenefitSchema = new Schema({ icon: { type: String, default: '' }, title: { type: String, default: '' }, text: { type: String, default: '' } }, { _id: false });
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

        hero: {
            eyebrow: { type: String, default: '' },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            ctaLabel: { type: String, default: '' },
            ctaHref: { type: String, default: '' },
            heroImage: { type: ImageSchema, default: null },
        },

        card: {
            image: { type: ImageSchema, default: null },
            tagline: { type: String, default: '' },
            summary: { type: String, default: '' },
            accentColor: { type: String, default: '' },
            badges: { type: [String], default: [] },
        },

        meta: {
            durationDays: { type: Number, min: 1, max: 365, default: 7 },
            estMinutesPerDay: { type: Number, min: 1, max: 180, default: 20 },
            level: { type: String, enum: ['Basique', 'Cible', 'Premium'], default: 'Basique' },
            category: { type: String, default: 'wellbeing' },
            tags: { type: [String], default: [] },
            language: { type: String, default: 'fr' },
            instructors: { type: [String], default: [] },
        },

        highlights: { type: [BenefitSchema], default: [] },
        curriculum: { type: [CurriculumItemSchema], default: [] },
        faq: { type: [FaqSchema], default: [] },
        seo: { type: SeoSchema, default: {} },

        price: { type: PriceSchema, default: { currency: 'EUR', taxIncluded: true } },
        status: { type: String, enum: ['draft', 'preflight', 'published'], default: 'draft', index: true },

        version: { type: String, default: '1.0' },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export type ProgramPageDoc = InferSchemaType<typeof ProgramPageSchema> & { _id: Types.ObjectId };
const ProgramPageModel = (models.ProgramPage as Model<ProgramPageDoc>) || model<ProgramPageDoc>('ProgramPage', ProgramPageSchema);
export default ProgramPageModel;
