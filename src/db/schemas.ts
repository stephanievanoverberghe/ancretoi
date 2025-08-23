import { Schema, model, models, Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

/* ---------- USERS ---------- */
const UserSchema = new Schema(
    {
        email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
        name: { type: String, trim: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
        passwordHash: { type: String, default: null },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

UserSchema.add({
    passwordChangedAt: { type: Date, default: null }, // invalider sessions anciennes
});

// Jeton de reset (usage unique, TTL)
const PasswordResetSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
        tokenHash: { type: String, unique: true, required: true }, // sha256(token)
        expiresAt: { type: Date, required: true, index: true },
        usedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
// TTL automatique (document supprimé après expiration)
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ---------- PROGRAMS (PARCOURS) ---------- */
const ProgramSchema = new Schema(
    {
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        title: { type: String, required: true, trim: true },
        summary: { type: String, default: '' },
        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    },
    { timestamps: true }
);

/* ---------- BLOG POSTS ---------- */
const PostSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        summary: { type: String, default: '' },
        coverUrl: { type: String, default: '' },
        content: { type: String, default: '' }, // markdown/texte
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: null },
        authorEmail: { type: String, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

/* ---------- INSPIRATIONAL VIDEOS ---------- */
const InspirationSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        videoUrl: { type: String, required: true }, // YouTube/Vimeo/URL mp4
        summary: { type: String, default: '' },
        tags: { type: [String], default: [] },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: null },
        curatorEmail: { type: String, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const UserModel = models.User || model('User', UserSchema);
export const ProgramModel = models.Program || model('Program', ProgramSchema);
export const PostModel = models.Post || model('Post', PostSchema);
export const InspirationModel = models.Inspiration || model('Inspiration', InspirationSchema);
export const PasswordResetModel = models.PasswordReset || model('PasswordReset', PasswordResetSchema);
