// src/server/blog.ts
import 'server-only';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { CategoryModel, PostModel, type IPost } from '@/db/schemas';

export type CreatePostInput = {
    title: string;
    slugWanted?: string;
    status: 'draft' | 'published';
    summary?: string;
    content?: string;
    coverPath?: string;
    coverAlt?: string;
    categorySlug?: string; // reçu du form
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
    isFeatured?: boolean;
    publishedAt?: Date | null;
    authorEmail: string;
};

export type UpdatePostInput = Partial<CreatePostInput> & {
    slug: string; // slug actuel (clé)
};

export function slugify(s: string) {
    return (s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

export function parseTags(raw?: string | string[]) {
    const base = Array.isArray(raw) ? raw.join(',') : raw || '';
    return Array.from(
        new Set(
            base
                .split(/[,\n]/)
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
        )
    );
}

export function sanitizeCoverPath(p?: string) {
    const s = (p || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) {
        throw new Error('La couverture doit être un chemin local (ex: /images/blog/mon-article/cover.jpg).');
    }
    return s.startsWith('/') ? s : `/${s}`;
}

export function readingTimeMin(text?: string) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

async function findAvailableSlug(base: string) {
    let candidate = base;
    let i = 2;
    while (await PostModel.exists({ slug: candidate, deletedAt: null })) {
        candidate = `${base}-${i++}`;
    }
    return candidate;
}

async function categorySlugToId(categorySlug?: string) {
    if (!categorySlug) return null;
    const cat = await CategoryModel.findOne({ slug: categorySlug, deletedAt: null }).select({ _id: 1 }).lean();
    return cat ? (cat._id as Types.ObjectId) : null;
}

/* ========================= CRUD ========================= */

export async function createPost(input: CreatePostInput) {
    await dbConnect();

    if (!input.title) throw new Error('Titre requis.');

    const baseSlug = slugify(input.slugWanted || input.title);
    const slug = await findAvailableSlug(baseSlug);

    const categoryId = await categorySlugToId(input.categorySlug || undefined);

    const doc = await PostModel.create({
        title: input.title,
        slug,
        status: input.status ?? 'draft',
        summary: input.summary || '',
        content: input.content || '',
        coverPath: sanitizeCoverPath(input.coverPath),
        coverAlt: input.coverAlt || '',
        categoryId,
        tags: parseTags(input.tags),
        seoTitle: input.seoTitle || input.title,
        seoDescription: input.seoDescription || input.summary || '',
        canonicalUrl: input.canonicalUrl || '',
        isFeatured: !!input.isFeatured,
        readingTimeMin: readingTimeMin(input.content),
        publishedAt: input.status === 'published' ? input.publishedAt || new Date() : null,
        authorEmail: input.authorEmail,
        deletedAt: null,
    });

    return doc;
}

export async function updatePost(input: UpdatePostInput) {
    await dbConnect();

    const cur = await PostModel.findOne({ slug: input.slug, deletedAt: null });
    if (!cur) throw new Error('Article introuvable.');

    // recalcul du slug si titre/slugWanted changent
    let nextSlug = cur.slug;
    if (input.slugWanted || input.title) {
        const base = slugify(input.slugWanted || input.title || cur.title);
        if (base !== cur.slug) nextSlug = await findAvailableSlug(base);
    }

    const categoryId = typeof input.categorySlug !== 'undefined' ? await categorySlugToId(input.categorySlug || undefined) : cur.categoryId;

    cur.title = input.title ?? cur.title;
    cur.slug = nextSlug;
    cur.status = input.status ?? cur.status;
    cur.summary = input.summary ?? cur.summary;
    cur.content = input.content ?? cur.content;
    cur.coverPath = typeof input.coverPath !== 'undefined' ? sanitizeCoverPath(input.coverPath) : cur.coverPath;
    cur.coverAlt = input.coverAlt ?? cur.coverAlt;
    cur.categoryId = categoryId;
    if (typeof input.tags !== 'undefined') cur.tags = parseTags(input.tags);

    cur.seoTitle = input.seoTitle ?? (cur.seoTitle || cur.title);
    cur.seoDescription = input.seoDescription ?? (cur.seoDescription || cur.summary || '');
    cur.canonicalUrl = input.canonicalUrl ?? cur.canonicalUrl;
    if (typeof input.isFeatured !== 'undefined') cur.isFeatured = !!input.isFeatured;

    if (typeof input.content !== 'undefined') cur.readingTimeMin = readingTimeMin(input.content);

    // publication
    if (input.status === 'published' && !cur.publishedAt) {
        cur.publishedAt = input.publishedAt || new Date();
    }
    if (input.status === 'draft') {
        cur.publishedAt = null;
    }

    await cur.save();
    return cur;
}

export async function softDeletePost(slug: string) {
    await dbConnect();
    const doc = await PostModel.findOne({ slug, deletedAt: null }).select({ _id: 1 });
    if (!doc) return { deleted: 0 };
    await PostModel.updateOne({ _id: doc._id }, { $set: { deletedAt: new Date() } });
    return { deleted: 1 };
}

export async function restorePost(idOrSlug: string) {
    await dbConnect();

    const raw = (idOrSlug || '').trim();
    if (!raw) throw new Error('Paramètre vide.');

    // 1) par _id
    if (Types.ObjectId.isValid(raw)) {
        const curById = await PostModel.findOne({ _id: new Types.ObjectId(raw), deletedAt: { $ne: null } });
        if (!curById) throw new Error('Introuvable (ou pas archivé).');

        const desired = curById.slug || slugify(curById.title || 'article');
        let nextSlug = desired;

        const exists = await PostModel.exists({ slug: desired, deletedAt: null, _id: { $ne: curById._id } });
        if (exists) {
            let i = 2;
            while (await PostModel.exists({ slug: `${desired}-${i}`, deletedAt: null })) i++;
            nextSlug = `${desired}-${i}`;
        }

        curById.deletedAt = null;
        curById.slug = nextSlug;
        await curById.save();
        return { restored: true, slug: nextSlug };
    }

    // 2) par slug normalisé
    const normalized = slugify(raw);
    let cur = await PostModel.findOne({ slug: normalized, deletedAt: { $ne: null } });

    // 3) filet de sécurité : slug tel-quel
    if (!cur) {
        cur = await PostModel.findOne({ slug: raw, deletedAt: { $ne: null } });
        if (!cur) throw new Error('Introuvable (ou pas archivé).');
    }

    const desired = cur.slug || slugify(cur.title || 'article');
    let nextSlug = desired;

    const exists = await PostModel.exists({ slug: desired, deletedAt: null, _id: { $ne: cur._id } });
    if (exists) {
        let i = 2;
        while (await PostModel.exists({ slug: `${desired}-${i}`, deletedAt: null })) i++;
        nextSlug = `${desired}-${i}`;
    }

    cur.deletedAt = null;
    cur.slug = nextSlug;
    await cur.save();

    return { restored: true, slug: nextSlug };
}

export async function getPost(slug: string) {
    await dbConnect();
    return await PostModel.findOne({ slug, deletedAt: null }).lean();
}

export async function listPosts() {
    await dbConnect();
    return await PostModel.find({ deletedAt: null })
        .select({
            title: 1,
            slug: 1,
            status: 1,
            coverPath: 1,
            publishedAt: 1,
            updatedAt: 1,
            seoTitle: 1,
            isFeatured: 1,
            categoryId: 1,
            tags: 1,
        })
        .sort({ updatedAt: -1 })
        .lean();
}

export async function suggestSlug(base: string) {
    const s = slugify(base);
    return await findAvailableSlug(s);
}

// ========= lecture d’un post archivé =========
export async function getArchivedPost(idOrSlug: string) {
    await dbConnect();
    const raw = (idOrSlug || '').trim();
    if (!raw) return null;

    if (Types.ObjectId.isValid(raw)) {
        return await PostModel.findOne({ _id: new Types.ObjectId(raw), deletedAt: { $ne: null } }).lean<IPost | null>();
    }
    return await PostModel.findOne({ slug: raw, deletedAt: { $ne: null } }).lean<IPost | null>();
}

// ========= suppression définitive =========
export async function hardDeletePost(idOrSlug: string) {
    await dbConnect();
    const raw = (idOrSlug || '').trim();
    if (!raw) return { deleted: 0 };

    if (Types.ObjectId.isValid(raw)) {
        const res = await PostModel.deleteOne({ _id: new Types.ObjectId(raw), deletedAt: { $ne: null } });
        return { deleted: res.deletedCount ?? 0 };
    }
    const res = await PostModel.deleteOne({ slug: raw, deletedAt: { $ne: null } });
    return { deleted: res.deletedCount ?? 0 };
}
