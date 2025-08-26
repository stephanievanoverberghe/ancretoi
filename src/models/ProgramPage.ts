// src/models/ProgramPage.ts
import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const FaqSchema = new Schema({ q: String, a: String }, { _id: false });

const BenefitSchema = new Schema({ icon: String, title: String, text: String }, { _id: false });

const TestimonialSchema = new Schema({ name: String, role: String, text: String, avatar: String }, { _id: false });

const SeoSchema = new Schema({ title: String, description: String, image: String }, { _id: false });

// curriculum = objets { label }
const CurriculumItemSchema = new Schema({ label: { type: String, required: true } }, { _id: false });

const ProgramPageSchema = new Schema(
    {
        programSlug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        hero: {
            eyebrow: String,
            title: String,
            subtitle: String,
            ctaLabel: String,
            ctaHref: String,
            heroImage: String,
        },
        highlights: [BenefitSchema],
        curriculum: [CurriculumItemSchema],
        testimonials: [TestimonialSchema],
        faq: [FaqSchema],
        seo: SeoSchema,
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
            index: true,
        },
    },
    { timestamps: true }
);

// ✅ Type dérivé du schema (pas de any)
export type ProgramPageDoc = InferSchemaType<typeof ProgramPageSchema> & {
    _id: Types.ObjectId;
};

// ✅ Model typé
const ProgramPageModel = (models.ProgramPage as Model<ProgramPageDoc>) || model<ProgramPageDoc>('ProgramPage', ProgramPageSchema);

export default ProgramPageModel;
