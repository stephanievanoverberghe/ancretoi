// src/models/State.ts
import { Schema, model, models, Types } from 'mongoose';

const StateSchema = new Schema(
    {
        enrollmentId: { type: Types.ObjectId, ref: 'Enrollment', required: true, index: true },
        unitId: { type: Types.ObjectId, ref: 'Unit', required: true, index: true },
        data: { type: Schema.Types.Mixed, default: {} }, // réponses (selon journalSchema)
        sliders: { type: Map, of: Number, default: {} }, // energie/focus/paix/estime/intensity...
        practiced: { type: Boolean, default: false },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

StateSchema.index({ enrollmentId: 1, unitId: 1 }, { unique: true });

export default models.State || model('State', StateSchema);
