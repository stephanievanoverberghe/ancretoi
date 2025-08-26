import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { ProgramModel } from '@/db/schemas';

type ProgramListItem = {
    _id: string;
    slug: string;
    title: string;
    status: 'draft' | 'published';
    unitsCount?: number;
};

export default async function ProgramsListPage() {
    await requireAdmin();
    await dbConnect();

    const items = await ProgramModel.find().sort({ createdAt: -1 }).lean<ProgramListItem[]>(); // ⬅️ lean typé

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Parcours</h2>
                <Link href="/admin/programs/new" className="rounded-lg border px-3 py-2 text-sm hover:bg-brand-50">
                    + Nouveau
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 text-left">Slug</th>
                            <th className="px-3 py-2 text-left">Titre</th>
                            <th className="px-3 py-2 text-left">Statut</th>
                            <th className="px-3 py-2 text-left">Unités</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p._id} className="border-t">
                                <td className="px-3 py-2">{p.slug}</td>
                                <td className="px-3 py-2">{p.title}</td>
                                <td className="px-3 py-2">{p.status}</td>
                                <td className="px-3 py-2">{p.unitsCount ?? '—'}</td>
                                <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/programs/${p.slug}/units`} className="text-brand-700 hover:underline">
                                            Jours
                                        </Link>
                                        <Link href={`/admin/pages/${p.slug}`} className="text-brand-700 hover:underline">
                                            Landing
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!items.length && (
                            <tr>
                                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={5}>
                                    Aucun programme
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
