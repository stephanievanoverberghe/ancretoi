// app/admin/programs/[slug]/page/page.tsx

import 'server-only';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import ProgramPageEditor from './page-editor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Params = { slug: string };

export default async function AdminProgramLandingPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;

    await requireAdmin();
    await dbConnect();

    const pageDoc = await ProgramPage.findOne({ programSlug: slug.toLowerCase() }).lean();
    const initialPage = pageDoc ? JSON.parse(JSON.stringify(pageDoc)) : null;

    return (
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Landing — {slug}</h1>
                <div className="flex gap-2">
                    <Link href={`/admin/programs/${slug}/units`} className="rounded border px-3 py-2 text-sm hover:bg-muted">
                        Configurer les unités (J1 → Jn)
                    </Link>
                    <Link href="/admin/programs" className="rounded border px-3 py-2 text-sm hover:bg-muted">
                        ← Back
                    </Link>
                </div>
            </div>

            <ProgramPageEditor slug={slug.toLowerCase()} initialPage={initialPage} />
        </div>
    );
}
