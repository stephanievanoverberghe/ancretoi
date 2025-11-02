// src/models/DayState.ts
import mongoose, { Schema, model, models, type InferSchemaType, type Types } from 'mongoose';

const DayStateSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        programSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
        day: { type: Number, required: true, min: 1, index: true },

        // Données libres (notes, champs simples si tu en ajoutes plus tard)
        data: { type: Map, of: String, default: {} },

        // Flux minimal
        practiced: { type: Boolean, default: false },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

DayStateSchema.index({ userId: 1, programSlug: 1, day: 1 }, { unique: true });

export type DayStateDoc = InferSchemaType<typeof DayStateSchema> & { _id: Types.ObjectId };
const DayState = (models.DayState as mongoose.Model<DayStateDoc>) || model<DayStateDoc>('DayState', DayStateSchema);
export default DayState;
