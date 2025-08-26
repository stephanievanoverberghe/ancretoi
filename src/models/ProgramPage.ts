// src/models/ProgramPage.ts
import { Schema, model, models } from 'mongoose';

const FaqSchema = new Schema({ q: String, a: String }, { _id: false });
const BenefitSchema = new Schema({ icon: String, title: String, text: String }, { _id: false });
const TestimonialSchema = new Schema({ name: String, role: String, text: String, avatar: String }, { _id: false });
const SeoSchema = new Schema({ title: String, description: String, image: String }, { _id: false });

const ProgramPageSchema = new Schema(
    {
        programSlug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // "reset-7"
        hero: {
            eyebrow: String,
            title: String,
            subtitle: String,
            ctaLabel: String,
            ctaHref: String,
            heroImage: String,
        },
        highlights: [BenefitSchema],
        curriculum: [String], // J1→J7 libellés
        testimonials: [TestimonialSchema],
        faq: [FaqSchema],
        seo: SeoSchema,
        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    },
    { timestamps: true }
);

export default models.ProgramPage || model('ProgramPage', ProgramPageSchema);
