// src/models/Newsletter.ts
import { Schema, models, model, type Model, type InferSchemaType } from 'mongoose';

const NewsletterSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        source: { type: String, default: 'site' },
        tags: [{ type: String }],
        consentAt: { type: Date, default: null },

        // Statut & tokens
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'unsubscribed', 'bounced', 'complained'],
            default: 'pending',
            index: true,
        },
        confirmToken: { type: String, index: true },
        unsubToken: { type: String, index: true },
        confirmedAt: { type: Date },
        unsubscribedAt: { type: Date },

        meta: {
            ip: { type: String, default: null },
            userAgent: { type: String, default: null },
        },
    },
    { timestamps: true, strict: true }
);

export type NewsletterDoc = InferSchemaType<typeof NewsletterSchema>;

export default (models.Newsletter as Model<NewsletterDoc>) || model<NewsletterDoc>('Newsletter', NewsletterSchema);
