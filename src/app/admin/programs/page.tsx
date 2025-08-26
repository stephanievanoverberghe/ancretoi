// app/admin/programs/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';

type ListItem = {
    programSlug: string;
    title?: string;
    status: 'draft' | 'published';
    unitsCount: number;
};

// Shape minimal qu’on lit depuis ProgramPage (pas de any)
type PgLean = {
    programSlug: string;
    status: 'draft' | 'published';
    hero?: { title?: string | null } | null;
};

export default async function ProgramsListPage() {
    await requireAdmin();
    await dbConnect();

    // On limite les champs lus (programSlug, status, hero) et on asserte le type lean
    const pages = (await ProgramPage.find().sort({ createdAt: -1 }).select({ programSlug: 1, status: 1, hero: 1 }).lean()) as PgLean[];

    const items: ListItem[] = await Promise.all(
        pages.map(async (p) => {
            const unitsCount = await Unit.countDocuments({
                programSlug: p.programSlug,
                unitType: 'day',
            });

            // hero.title peut être string | null | undefined → on coerce vers string | undefined
            const title = typeof p.hero?.title === 'string' && p.hero.title.length > 0 ? p.hero.title : undefined;

            return {
                programSlug: p.programSlug,
                title,
                status: p.status,
                unitsCount,
            };
        })
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Parcours (pages)</h2>
                <Link href="/admin/programs/new" className="rounded-lg border px-3 py-2 text-sm hover:bg-brand-50">
                    + Nouveau
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 text-left">Slug</th>
                            <th className="px-3 py-2 text-left">Titre (hero)</th>
                            <th className="px-3 py-2 text-left">Statut</th>
                            <th className="px-3 py-2 text-left">Unités</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p.programSlug} className="border-t">
                                <td className="px-3 py-2">{p.programSlug}</td>
                                <td className="px-3 py-2">{p.title ?? '—'}</td>
                                <td className="px-3 py-2">{p.status}</td>
                                <td className="px-3 py-2">{p.unitsCount}</td>
                                <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                        <Link href={`/admin/programs/${p.programSlug}/units`} className="text-brand-700 hover:underline">
                                            Jours
                                        </Link>
                                        <Link href={`/admin/programs/${p.programSlug}/page`} className="text-brand-700 hover:underline">
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
