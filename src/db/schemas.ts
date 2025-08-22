import { Schema, model, models } from 'mongoose';

/** User */
const UserSchema = new Schema(
    {
        email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
        role: { type: String, default: 'user' },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

/** MagicToken — TTL 15 min, usage unique */
const MagicTokenSchema = new Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        token: { type: String, required: true, unique: true, index: true },
        used: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true, index: true },
        next: { type: String }, // redirection post-login
    },
    { timestamps: true }
);
// TTL index: Mongo supprime auto après expiration
MagicTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserModel = models.User || model('User', UserSchema);
export const MagicTokenModel = models.MagicToken || model('MagicToken', MagicTokenSchema);
