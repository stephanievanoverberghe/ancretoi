import { Schema, model, models, type Model, type InferSchemaType, Types } from 'mongoose';

const JournalSliderSchema = new Schema(
    {
        key: { type: String, required: true },
        label: { type: String, required: true },
        min: { type: Number, default: 0 },
        max: { type: Number, default: 10 },
        step: { type: Number, default: 1 },
    },
    { _id: false }
);
const JournalQuestionSchema = new Schema(
    { key: { type: String, required: true }, label: { type: String, required: true }, placeholder: { type: String, default: '' } },
    { _id: false }
);
const JournalCheckSchema = new Schema({ key: { type: String, required: true }, label: { type: String, required: true } }, { _id: false });
const JournalSchema = new Schema(
    { sliders: { type: [JournalSliderSchema], default: [] }, questions: { type: [JournalQuestionSchema], default: [] }, checks: { type: [JournalCheckSchema], default: [] } },
    { _id: false }
);

const UnitSchema = new Schema(
    {
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
        unitType: { type: String, enum: ['day'], default: 'day', index: true },
        unitIndex: { type: Number, required: true, min: 1, index: true }, // J1=1...
        title: { type: String, required: true },
        durationMin: { type: Number, default: 25 },
        mantra: { type: String, default: '' },

        // Médias
        videoAssetId: { type: String, default: '' },
        audioAssetId: { type: String, default: '' },
        videoUrl: { type: String, default: '' },

        // Contenus
        contentParagraphs: { type: [String], default: [] }, // description courte (paragraphe 1)
        safetyNote: { type: String, default: '' },
        journalSchema: { type: JournalSchema, default: { sliders: [], questions: [], checks: [] } },

        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    },
    { timestamps: true }
);
UnitSchema.index({ programSlug: 1, unitIndex: 1 }, { unique: true });

export type UnitDoc = InferSchemaType<typeof UnitSchema> & { _id: Types.ObjectId };
const UnitModel = (models.Unit as Model<UnitDoc>) || model<UnitDoc>('Unit', UnitSchema);
export default UnitModel;
