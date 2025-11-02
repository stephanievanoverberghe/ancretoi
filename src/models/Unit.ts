// src/models/Unit.ts
import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const UnitSchema = new Schema(
    {
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
        unitType: { type: String, enum: ['day'], default: 'day', index: true },
        unitIndex: { type: Number, required: true, min: 1, index: true }, // J1=1...

        title: { type: String, required: true },
        durationMin: { type: Number, default: 20 }, // mappé depuis estMinutesPerDay
        mantra: { type: String, default: '' },

        // Médias (FORM: videoUrl seulement)
        videoUrl: { type: String, default: '' },

        // Contenu (FORM: description -> 1er paragraphe)
        contentParagraphs: { type: [String], default: [] },

        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    },
    { timestamps: true, versionKey: false }
);

UnitSchema.index({ programSlug: 1, unitIndex: 1 }, { unique: true });

export type UnitDoc = InferSchemaType<typeof UnitSchema> & { _id: Types.ObjectId };
const UnitModel: Model<UnitDoc> = (models.Unit as Model<UnitDoc>) || model<UnitDoc>('Unit', UnitSchema);
export default UnitModel;
