// src/app/inspirations/page.tsx
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';

export default async function Inspirations() {
    await dbConnect();
    const inspi = await InspirationModel.find({ status: 'published', deletedAt: null }).sort({ createdAt: -1 }).select({ title: 1, videoUrl: 1, tags: 1, _id: 0 }).lean();

    return (
        <div className="mx-auto max-w-4xl space-y-4 py-16 sm:py-20 lg:py-24">
            <h1 className="font-serif text-3xl">Inspirations</h1>
            <div className="grid gap-4 sm:grid-cols-2">
                {inspi.map((v) => (
                    <a key={v.videoUrl} href={v.videoUrl} target="_blank" rel="noreferrer" className="card p-4 hover:bg-brand-50">
                        <div className="font-semibold">{v.title}</div>
                        {!!v.tags?.length && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {v.tags.map((t: string) => (
                                    <span key={t} className="badge-accent">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </a>
                ))}
            </div>
            {!inspi.length && <p className="text-muted-foreground">Bientôt des vidéos inspirantes ✨</p>}
        </div>
    );
}
