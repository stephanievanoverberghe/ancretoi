// src/models/BaselineScore.ts
import { Schema, model, models, Types } from 'mongoose';

const FourScores = { energie: Number, focus: Number, paix: Number, estime: Number };

const BaselineScoreSchema = new Schema(
    {
        enrollmentId: { type: Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
        j1: FourScores,
        j7: FourScores,
    },
    { timestamps: true }
);

export default models.BaselineScore || model('BaselineScore', BaselineScoreSchema);
