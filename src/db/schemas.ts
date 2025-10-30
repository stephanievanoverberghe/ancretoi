// src/db/schemas.ts
import { Schema, model, models, Types } from 'mongoose';

export type UserRole = 'user' | 'admin';

/* ---------- USERS ---------- */
const UserSchema = new Schema(
    {
        email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
        name: { type: String, trim: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
        passwordHash: { type: String, default: null },
        deletedAt: { type: Date, default: null }, // archivage soft
        suspendedAt: { type: Date, default: null }, // suspension
        avatarUrl: { type: String, default: null },
        theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
        marketing: { type: Boolean, default: false },
        productUpdates: { type: Boolean, default: true },
        limits: {
            maxConcurrentPrograms: { type: Number, default: null },
            features: { type: [String], default: [] },
        },
    },
    { timestamps: true }
);

UserSchema.add({
    passwordChangedAt: { type: Date, default: null },
});

/* ---------- OPTIONAL: PROGRAMS (minimal) ---------- */
const ProgramSchema = new Schema(
    {
        slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        title: { type: String, required: true, trim: true },
        coverUrl: { type: String, default: null },
        meta: {
            level: { type: String, enum: ['Basique', 'Cible', 'Premium', null], default: null },
            // tu peux ajouter durationDays / estMinutesPerDay si tu les as
        },
        stats: {
            unitsCount: { type: Number, default: 0 },
        },
        status: { type: String, enum: ['draft', 'preflight', 'published'], default: 'draft' },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

/* ---------- BLOG POSTS ---------- */
const PostSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },

        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },

        summary: { type: String, default: '' },
        content: { type: String, default: '' },

        // Couverture locale (dans /public)
        coverPath: { type: String, default: '' }, // ex: "/images/blog/slug/cover.jpg"
        coverAlt: { type: String, default: '' },

        // Taxonomie
        category: { type: String, default: '' }, // libre ou fais un enum si tu veux
        tags: { type: [String], default: [] }, // array de strings en minuscule

        // SEO
        seoTitle: { type: String, default: '' },
        seoDescription: { type: String, default: '' },
        canonicalUrl: { type: String, default: '' },

        // Divers
        isFeatured: { type: Boolean, default: false },
        readingTimeMin: { type: Number, default: 1 },

        // Dates & auteur
        publishedAt: { type: Date, default: null, index: true },
        authorEmail: { type: String, default: '' },

        // Soft delete
        deletedAt: { type: Date, default: null, index: true },
    },
    {
        timestamps: true, // createdAt, updatedAt
        strict: true,
        versionKey: false,
    }
);

// Normalise tags en minuscule et trim
PostSchema.pre('save', function (next) {
    if (Array.isArray(this.tags)) {
        this.tags = this.tags.map((t: string) => (t || '').trim().toLowerCase()).filter(Boolean);
    }
    next();
});

/* ---------- INSPIRATIONAL VIDEOS ---------- */
const InspirationSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true },
        videoUrl: { type: String, required: true },
        summary: { type: String, default: '' },
        tags: { type: [String], default: [] },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: null },
        curatorEmail: { type: String, index: true },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

InspirationSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const UserModel = models.User || model('User', UserSchema);
export const ProgramModel = models.Program || model('Program', ProgramSchema);
export const PostModel = models.Post || model('Post', PostSchema);
export const InspirationModel = models.Inspiration || model('Inspiration', InspirationSchema);
export const PasswordResetModel =
    models.PasswordReset ||
    model(
        'PasswordReset',
        new Schema(
            {
                userId: { type: Types.ObjectId, ref: 'User', index: true, required: true },
                tokenHash: { type: String, unique: true, required: true }, // sha256(token)
                expiresAt: { type: Date, required: true },
                usedAt: { type: Date, default: null },
            },
            { timestamps: true }
        ).index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    );
