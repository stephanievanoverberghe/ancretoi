// src/models/Resource.ts
import { Schema, model, models, type Model } from 'mongoose';

export type ResourceKind = 'article' | 'video' | 'audio' | 'exercise' | 'tool';

export type ResourceDoc = {
    _id: unknown;
    slug: string;
    title: string;
    kind: ResourceKind; // article | video | audio | exercise | tool
    description?: string;
    minutes?: number; // durée / lecture
    tags?: string[];
    coverUrl?: string;
    url?: string; // lien externe (facultatif)
    createdAt: Date;
    updatedAt: Date;
};

const ResourceSchema = new Schema<ResourceDoc>(
    {
        slug: { type: String, required: true, unique: true, index: true },
        title: { type: String, required: true },
        kind: { type: String, required: true, enum: ['article', 'video', 'audio', 'exercise', 'tool'] },
        description: { type: String },
        minutes: { type: Number },
        tags: [{ type: String }],
        coverUrl: { type: String },
        url: { type: String },
    },
    { timestamps: true }
);

export default (models.Resource as Model<ResourceDoc>) || model<ResourceDoc>('Resource', ResourceSchema);
