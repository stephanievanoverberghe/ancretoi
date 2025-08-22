import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
    {
        email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
        name: { type: String, trim: true },
        role: { type: String, default: 'user' },
        passwordHash: { type: String, default: null },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const UserModel = models.User || model('User', UserSchema);
