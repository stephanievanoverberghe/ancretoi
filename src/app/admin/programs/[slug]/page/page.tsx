// app/admin/programs/[slug]/page/page.tsx
import 'server-only';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { requireAdmin } from '@/lib/authz';
import ProgramPageEditor from './page-editor';

type Params = { slug: string };

export default async function ProgramLandingEditor({ params }: { params: Promise<Params> }) {
    const { slug } = await params;

    await requireAdmin();
    await dbConnect();

    const page = await ProgramPage.findOne({ programSlug: slug.toLowerCase() }).lean();
    const initial = page ? JSON.parse(JSON.stringify(page)) : null;

    return <ProgramPageEditor slug={slug.toLowerCase()} initialPage={initial} />;
}
