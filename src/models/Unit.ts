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

const ScriptStepSchema = new Schema(
    {
        label: { type: String, required: true }, // ex: "Accroche", "Respiration guidée"
        seconds: { type: Number, default: 0 }, // durée indicative (option)
    },
    { _id: false }
);

const UnitSchema = new Schema(
    {
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
        unitType: { type: String, enum: ['day'], default: 'day' },
        unitIndex: { type: Number, min: 1, max: 365, required: true },
        // Affichage
        title: { type: String, required: true, trim: true }, // ex: "J1 — Clarté & intention"
        eyebrow: { type: String, default: '' }, // mini sur-titre optionnel
        durationMin: { type: Number, default: 20 }, // durée cible

        // Contenu
        objectives: { type: [String], default: [] }, // puces “Objectifs”
        introText: { type: String, default: '' }, // “Texte d’accompagnement” (markdown accepté)
        mantra: { type: String, default: '' }, // mantra du jour
        safetyNote: { type: String, default: '' }, // encadré sécurité

        // Vidéo & script
        videoAssetId: { type: Types.ObjectId, ref: 'VideoAsset' },
        videoScript: { type: [ScriptStepSchema], default: [] }, // étapes du script vidéo

        // Journal guidé
        journalSchema: { fields: { type: [FieldSchema], default: [] } },

        status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
        version: { type: String, default: '1.0' },
    },
    { timestamps: true }
);

UnitSchema.index({ programSlug: 1, unitType: 1, unitIndex: 1 }, { unique: true });

export default models.Unit || model('Unit', UnitSchema);
