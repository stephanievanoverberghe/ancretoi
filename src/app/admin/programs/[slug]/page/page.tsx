import 'server-only';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { requireAdmin } from '@/lib/authz';
import ProgramPageEditor from './page-editor';

export default async function ProgramLandingEditor({ params }: { params: { slug: string } }) {
    await requireAdmin();
    await dbConnect();

    const page = await ProgramPage.findOne({ programSlug: params.slug.toLowerCase() }).lean();
    return <ProgramPageEditor slug={params.slug.toLowerCase()} initialPage={JSON.parse(JSON.stringify(page || null))} />;
}
