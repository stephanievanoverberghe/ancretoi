// src/models/DayState.ts
import mongoose, { Schema, model, models, type InferSchemaType, type Types } from 'mongoose';

const SlidersSchema = new Schema(
    {
        energie: { type: Number, min: 0, max: 10, default: 0 },
        focus: { type: Number, min: 0, max: 10, default: 0 },
        paix: { type: Number, min: 0, max: 10, default: 0 },
        estime: { type: Number, min: 0, max: 10, default: 0 },
    },
    { _id: false }
);

const DayStateSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        programSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
        day: { type: Number, required: true, min: 1, index: true },

        // Données de la leçon / du jour
        data: { type: Map, of: String, default: {} }, // réponses libres (texte)
        sliders: { type: SlidersSchema, default: {} }, // métriques 0–10
        practiced: { type: Boolean, default: false }, // “j’ai pratiqué”
        mantra3x: { type: Boolean, default: false }, // mantra répété 3×
        completed: { type: Boolean, default: false }, // validation du jour
    },
    { timestamps: true }
);

// Unicité : un état par (user, programme, jour)
DayStateSchema.index({ userId: 1, programSlug: 1, day: 1 }, { unique: true });

export type DayStateDoc = InferSchemaType<typeof DayStateSchema> & { _id: Types.ObjectId };

const DayState = (models.DayState as mongoose.Model<DayStateDoc>) || model<DayStateDoc>('DayState', DayStateSchema);

export default DayState;
