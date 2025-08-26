// src/models/Unit.ts
import { Schema, model, models, Types } from 'mongoose';

const FieldSchema = new Schema(
    {
        id: String,
        type: { type: String, enum: ['text_short', 'text_long', 'slider', 'checkbox', 'chips', 'score_group'], required: true },
        label: String,
        required: { type: Boolean, default: false },
        placeholder: String,
        min: Number,
        max: Number,
        step: Number,
        minLen: Number,
        maxLen: Number,
        options: { type: [String], default: [] },
    },
    { _id: false }
);

const UnitSchema = new Schema(
    {
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true }, // "reset-7"
        unitType: { type: String, enum: ['day'], default: 'day' },
        unitIndex: { type: Number, min: 1, max: 90, required: true }, // 1..7 pour R7
        title: { type: String, required: true, trim: true },
        introText: { type: String, default: '' }, // texte d’accompagnement (300–500 mots)
        mantra: { type: String, default: '' },
        durationMin: { type: Number, default: 20 },
        videoAssetId: { type: Types.ObjectId, ref: 'VideoAsset' },
        journalSchema: { fields: { type: [FieldSchema], default: [] } },
        status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
        version: { type: String, default: '1.0' },
    },
    { timestamps: true }
);

UnitSchema.index({ programSlug: 1, unitType: 1, unitIndex: 1 }, { unique: true });

export default models.Unit || model('Unit', UnitSchema);
