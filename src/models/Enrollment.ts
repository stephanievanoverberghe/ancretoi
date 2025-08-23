import { Schema, model, models, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'paused';

const EnrollmentSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
        programSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
        status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active', index: true },
        startedAt: { type: Date, default: null },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Un utilisateur ne peut avoir qu'une inscription par programme
EnrollmentSchema.index({ userId: 1, programSlug: 1 }, { unique: true });

const Enrollment = models.Enrollment || model('Enrollment', EnrollmentSchema);
export default Enrollment;
