// src/models/Enrollment.ts
import { Schema, model, models, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'paused';

const EnrollmentSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
        status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active', index: true },
        startedAt: { type: Date, default: null }, // 1ère fois “Commencer”
        completedAt: { type: Date, default: null },
        currentDay: { type: Number, default: 1, min: 1, max: 90 },
        introEngaged: { type: Boolean, default: false }, // ✅ état persistant du check de l’intro
    },
    { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, programSlug: 1 }, { unique: true });

const Enrollment = models.Enrollment || model('Enrollment', EnrollmentSchema);
export default Enrollment;
