// src/db/schemas.ts
import { Schema, model, models, Types, type Model } from 'mongoose';

/* =========================================================
   Helpers
   ========================================================= */
export type UserRole = 'user' | 'admin';
export type UserTheme = 'system' | 'light' | 'dark';

export function slugify(input: string): string {
    return (input || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/* =========================================================
   USERS
   ========================================================= */
export interface IUser {
    _id: Types.ObjectId;
    email: string;
    name?: string | null;
    role: UserRole;
    passwordHash?: string | null;
    passwordChangedAt?: Date | null;
    deletedAt?: Date | null;
    suspendedAt?: Date | null;
    avatarUrl?: string | null;
    theme: UserTheme;
    marketing: boolean;
    productUpdates: boolean;
    limits: {
        maxConcurrentPrograms: number | null;
        features: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, unique: true, index: true, required: true, lowercase: true, trim: true },
        name: { type: String, trim: true, default: null },
        role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
        passwordHash: { type: String, default: null },
        passwordChangedAt: { type: Date, default: null },
        deletedAt: { type: Date, default: null },
        suspendedAt: { type: Date, default: null },
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

/* =========================================================
   PROGRAMS (optionnel)
   ========================================================= */
export interface IProgram {
    _id: Types.ObjectId;
    slug: string;
    title: string;
    coverUrl: string | null;
    meta: {
        level: 'Basique' | 'Cible' | 'Premium' | null;
    };
    stats: { unitsCount: number };
    status: 'draft' | 'preflight' | 'published';
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
    {
        slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        title: { type: String, required: true, trim: true },
        coverUrl: { type: String, default: null },
        meta: {
            level: { type: String, enum: ['Basique', 'Cible', 'Premium', null], default: null },
        },
        stats: { unitsCount: { type: Number, default: 0 } },
        status: { type: String, enum: ['draft', 'preflight', 'published'], default: 'draft' },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

/* =========================================================
   CATEGORIES (taxonomie réutilisable)
   ========================================================= */
export interface ICategory {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    color: string | null;
    icon: string | null;

    // Image d'illustration (dans /public)
    imagePath: string | null; // ex: /images/categories/slug/cover.jpg
    imageAlt: string | null;

    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
        description: { type: String, default: '' },
        color: { type: String, default: null },
        icon: { type: String, default: null },

        imagePath: { type: String, default: null },
        imageAlt: { type: String, default: null },
    },
    { timestamps: true }
);

CategorySchema.pre('validate', function (next) {
    if (!this.slug && this.name) this.slug = slugify(this.name);
    next();
});

/* =========================================================
   BLOG POSTS
   ========================================================= */
export interface IPost {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    summary: string;
    content: string;

    // Cover (local /public)
    coverPath: string;
    coverAlt: string;

    // Taxonomie
    categoryId: Types.ObjectId | null; // ref Category
    tags: string[];

    // SEO
    seoTitle: string;
    seoDescription: string;
    canonicalUrl: string;

    // Divers
    isFeatured: boolean;
    readingTimeMin: number;

    // Dates & auteur
    publishedAt: Date | null;
    authorEmail: string;

    // Soft delete
    deletedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true, index: true },

        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },

        summary: { type: String, default: '' },
        content: { type: String, default: '' },

        coverPath: { type: String, default: '' },
        coverAlt: { type: String, default: '' },

        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
        tags: { type: [String], default: [] },

        seoTitle: { type: String, default: '' },
        seoDescription: { type: String, default: '' },
        canonicalUrl: { type: String, default: '' },

        isFeatured: { type: Boolean, default: false },
        readingTimeMin: { type: Number, default: 1 },

        publishedAt: { type: Date, default: null, index: true },
        authorEmail: { type: String, default: '' },

        deletedAt: { type: Date, default: null, index: true },
    },
    {
        timestamps: true,
        strict: true,
        versionKey: false,
    }
);

PostSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
PostSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text' });

PostSchema.pre('save', function (next) {
    if (Array.isArray(this.tags)) {
        this.tags = this.tags.map((t) => (t || '').trim().toLowerCase()).filter(Boolean);
    }
    next();
});

/* =========================================================
   INSPIRATIONS (vidéos)
   ========================================================= */
export interface IInspiration {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    videoUrl: string;
    summary: string;
    tags: string[];
    status: 'draft' | 'published';
    publishedAt: Date | null;
    curatorEmail?: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const InspirationSchema = new Schema<IInspiration>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, lowercase: true, trim: true },
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

/* =========================================================
   PASSWORD RESET
   ========================================================= */
export interface IPasswordReset {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        tokenHash: { type: String, unique: true, required: true }, // sha256(token)
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date, default: null },
    },
    { timestamps: true }
).index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* =========================================================
   Models (zéro any)
   ========================================================= */
export const UserModel: Model<IUser> = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);

export const ProgramModel: Model<IProgram> = (models.Program as Model<IProgram>) || model<IProgram>('Program', ProgramSchema);

export const CategoryModel: Model<ICategory> = (models.Category as Model<ICategory>) || model<ICategory>('Category', CategorySchema);

export const PostModel: Model<IPost> = (models.Post as Model<IPost>) || model<IPost>('Post', PostSchema);

export const InspirationModel: Model<IInspiration> = (models.Inspiration as Model<IInspiration>) || model<IInspiration>('Inspiration', InspirationSchema);

export const PasswordResetModel: Model<IPasswordReset> = (models.PasswordReset as Model<IPasswordReset>) || model<IPasswordReset>('PasswordReset', PasswordResetSchema);
