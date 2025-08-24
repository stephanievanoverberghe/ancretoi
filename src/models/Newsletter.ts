// src/models/Newsletter.ts
import mongoose, { Schema, type Model } from 'mongoose';

export type NewsletterDoc = {
    email: string;
    status: 'pending' | 'confirmed' | 'unsubscribed';
    source?: string;
    tags?: string[];
    confirmToken?: string | null;
    unsubToken?: string | null;
    consentAt?: Date | null;
    confirmedAt?: Date | null;
    unsubscribedAt?: Date | null;
    meta?: { ip?: string | null; userAgent?: string | null };
    createdAt?: Date;
    updatedAt?: Date;
};

const NewsletterSchema = new Schema<NewsletterDoc>(
    {
        email: { type: String, required: true, unique: true, index: true },
        status: { type: String, enum: ['pending', 'confirmed', 'unsubscribed'], default: 'pending', index: true },
        source: { type: String },
        tags: [{ type: String }],
        confirmToken: { type: String, index: true, sparse: true },
        unsubToken: { type: String, index: true, sparse: true },
        consentAt: { type: Date, default: null },
        confirmedAt: { type: Date, default: null },
        unsubscribedAt: { type: Date, default: null },
        meta: {
            ip: { type: String, default: null },
            userAgent: { type: String, default: null },
        },
    },
    { timestamps: true }
);

export default (mongoose.models.Newsletter as Model<NewsletterDoc>) || mongoose.model<NewsletterDoc>('Newsletter', NewsletterSchema);
