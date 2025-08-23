import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';

type InspirationListItem = {
    _id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    createdAt: Date;
};
type InspirationRaw = {
    _id: unknown;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    createdAt: string | Date;
};

export default async function InspirationsListPage() {
    await requireAdmin();
    await dbConnect();

    const raw = await InspirationModel.find({ deletedAt: null }).select({ title: 1, slug: 1, status: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean<InspirationRaw[]>();

    const items: InspirationListItem[] = raw.map((d) => ({
        _id: String(d._id),
        title: d.title,
        slug: d.slug,
        status: d.status,
        createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt),
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Inspirations</h2>
                <Link href="/admin/inspirations/new" className="button">
                    Nouvelle inspiration
                </Link>
            </div>

            <div className="card p-4">
                {!items.length ? (
                    <p className="text-muted-foreground">Aucune inspiration.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((it) => (
                            <li key={it._id} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        /{it.slug} • {it.status}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
