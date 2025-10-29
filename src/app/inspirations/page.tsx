// src/app/inspirations/page.tsx
import 'server-only';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';
import InspirationsHero from '@/components/inspirations/InspirationsHero';
import InspirationsGalleryClient from '@/components/inspirations/InspirationsGalleryClient';

type InspirationLean = {
    title: string;
    slug?: string; // si tu veux un détail plus tard par slug
    videoUrl: string;
    summary?: string | null;
    tags?: string[] | null;
    createdAt?: Date | string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function InspirationsPage() {
    await dbConnect();

    const docs = await InspirationModel.find({
        status: 'published',
        deletedAt: null,
    })
        .sort({ createdAt: -1 })
        .select({ title: 1, slug: 1, videoUrl: 1, summary: 1, tags: 1, createdAt: 1, _id: 0 })
        .lean<InspirationLean[]>();

    // dernière publiée
    const latest = docs[0] ?? null;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <InspirationsHero latest={latest} />

            <section id="grid" className="mt-10 sm:mt-12">
                <InspirationsGalleryClient items={docs} />
            </section>

            {!docs.length && <p className="text-center text-muted-foreground mt-16">Bientôt des vidéos inspirantes ✨</p>}
        </div>
    );
}
