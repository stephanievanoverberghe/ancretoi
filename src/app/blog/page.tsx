// src/app/blog/page.tsx
import 'server-only';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';
import BlogHero from '@/components/blog/BlogHero';
import BlogGalleryClient from '@/components/blog/BlogGalleryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ---------- Types ---------- */
export type BlogItem = {
    slug: string;
    title?: string | null;
    summary?: string | null;
    coverPath?: string | null;
    coverAlt?: string | null;
    readingTimeMin?: number | null;
    publishedAt?: string | Date | null;
    category?: string | null;
    tags?: string[] | null;
};

export default async function BlogPage() {
    await dbConnect();

    const docs = await PostModel.find({
        status: 'published',
        deletedAt: null,
    })
        .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
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
        .lean<BlogItem[]>();

    const featured = docs[0] ?? null;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
            <BlogHero featured={featured} />

            <section id="grid" className="mt-10 sm:mt-12">
                <BlogGalleryClient items={docs} />
            </section>

            {!docs.length && <p className="text-center text-muted-foreground mt-16">Bientôt des articles ✨</p>}
        </div>
    );
}
