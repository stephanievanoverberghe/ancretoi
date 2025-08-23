import { Schema, model, models, Types } from 'mongoose';

const EnrollmentSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
        programSlug: { type: String, index: true, required: true },
        status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, programSlug: 1 }, { unique: true });

export default models.Enrollment || model('Enrollment', EnrollmentSchema);
