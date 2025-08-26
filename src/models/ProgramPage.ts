// src/models/ProgramPage.ts
import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const ImageSchema = new Schema({ url: { type: String, required: true }, alt: String, width: Number, height: Number }, { _id: false });
const FaqSchema = new Schema({ q: String, a: String }, { _id: false });
const BenefitSchema = new Schema({ icon: String, title: String, text: String }, { _id: false });
const TestimonialSchema = new Schema({ name: String, role: String, text: String, avatar: String }, { _id: false });
const SeoSchema = new Schema({ title: String, description: String, image: String }, { _id: false });
const CurriculumItemSchema = new Schema({ label: { type: String, required: true }, summary: String }, { _id: false });

const IntroSchema = new Schema({ finalite: String, pourQui: String, pasPourQui: String, commentUtiliser: String, cadreSecurite: String }, { _id: false });
const ConclusionSchema = new Schema({ texte: String, kitEntretien: String, cap7_14_30: String, siCaDeraille: String, allerPlusLoin: String }, { _id: false });

const ProgramPageSchema = new Schema(
    {
        programSlug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        hero: { eyebrow: String, title: String, subtitle: String, ctaLabel: String, ctaHref: String, heroImage: ImageSchema },
        card: { image: ImageSchema, tagline: String, summary: String, accentColor: String, badges: { type: [String], default: [] } },
        meta: {
            durationDays: { type: Number, min: 1, max: 365, default: 7 },
            estMinutesPerDay: { type: Number, min: 1, max: 180, default: 20 },
            level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
            category: { type: String, default: 'wellbeing' },
            tags: { type: [String], default: [] },
            language: { type: String, default: 'fr' },
            instructors: { type: [String], default: [] },
        },
        highlights: [BenefitSchema],
        curriculum: [CurriculumItemSchema],
        testimonials: [TestimonialSchema],
        faq: [FaqSchema],
        seo: SeoSchema,
        intro: IntroSchema,
        conclusion: ConclusionSchema,
        status: { type: String, enum: ['draft', 'preflight', 'published'], default: 'draft', index: true },
        version: { type: String, default: '1.0' },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export type ProgramPageDoc = InferSchemaType<typeof ProgramPageSchema> & { _id: Types.ObjectId };
const ProgramPageModel = (models.ProgramPage as Model<ProgramPageDoc>) || model<ProgramPageDoc>('ProgramPage', ProgramPageSchema);
export default ProgramPageModel;
