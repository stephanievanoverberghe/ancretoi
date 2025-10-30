// src/app/api/blog/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Query = {
    q?: string;
    category?: string;
    tag?: string;
    page?: string; // 1-based
    perPage?: string; // default 12
};

type MongoFilter = Record<string, unknown>;

function escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilter(params: URLSearchParams): MongoFilter {
    const q = (params.get('q') || '').trim();
    const category = (params.get('category') || '').trim();
    const tag = (params.get('tag') || '').trim();

    const andParts: MongoFilter[] = [{ status: 'published' }, { deletedAt: null }];

    if (q) {
        const rx = new RegExp(escapeRegex(q), 'i');
        andParts.push({ $or: [{ title: rx }, { summary: rx }, { content: rx }] });
    }
    if (category) andParts.push({ category });
    if (tag) andParts.push({ tags: tag });

    return andParts.length ? { $and: andParts } : {};
}

export async function GET(req: Request) {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const { page = '1', perPage = '12' } = Object.fromEntries(searchParams) as Query;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const perPageNum = Math.min(48, Math.max(1, parseInt(perPage || '12', 10)));

    const filter = buildFilter(searchParams);

    const [items, total, categories, tags] = await Promise.all([
        PostModel.find(filter)
            .select({
                slug: 1,
                title: 1,
                summary: 1,
                coverPath: 1,
                coverAlt: 1,
                readingTimeMin: 1,
                publishedAt: 1,
                category: 1,
                tags: 1,
                _id: 0,
            })
            .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
            .skip((pageNum - 1) * perPageNum)
            .limit(perPageNum)
            .lean(),
        PostModel.countDocuments(filter),
        PostModel.distinct('category', { status: 'published', deletedAt: null }),
        PostModel.distinct('tags', { status: 'published', deletedAt: null }),
    ]);

    return NextResponse.json({
        items,
        total,
        page: pageNum,
        perPage: perPageNum,
        categories: (categories as (string | null | undefined)[]).filter((v): v is string => Boolean(v)).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })),
        tags: (tags as (string | null | undefined)[]).filter((v): v is string => Boolean(v)).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })),
    });
}
