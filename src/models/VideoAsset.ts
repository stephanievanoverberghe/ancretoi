// src/models/VideoAsset.ts
import { Schema, model, models } from 'mongoose';

const VideoAssetSchema = new Schema(
    {
        provider: { type: String, enum: ['mux', 'bunny', 'vdocipher', 'file'], required: true },
        videoId: { type: String, required: true }, // id provider ou URL
        poster: String,
        captionsUrl: { type: String, required: true },
        chaptersUrl: String,
        transcriptUrl: String,
        thumbnailsVtt: String,
    },
    { timestamps: true }
);

VideoAssetSchema.index({ provider: 1, videoId: 1 }, { unique: true });

export default models.VideoAsset || model('VideoAsset', VideoAssetSchema);
