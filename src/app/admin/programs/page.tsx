import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { ProgramModel } from '@/db/schemas';

type ProgramListItem = {
    _id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    createdAt: Date;
};
type ProgramRaw = {
    _id: unknown;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    createdAt: string | Date;
};

export default async function ProgramsListPage() {
    await requireAdmin();
    await dbConnect();

    const raw = await ProgramModel.find({}).select({ title: 1, slug: 1, status: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean<ProgramRaw[]>();

    const items: ProgramListItem[] = raw.map((d) => ({
        _id: String(d._id),
        title: d.title,
        slug: d.slug,
        status: d.status,
        createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt),
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Parcours</h2>
                <Link href="/admin/programs/new" className="button">
                    Nouveau parcours
                </Link>
            </div>

            <div className="card p-4">
                {!items.length ? (
                    <p className="text-muted-foreground">Aucun parcours.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {items.map((p) => (
                            <li key={p._id} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        /{p.slug} • {p.status}
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
