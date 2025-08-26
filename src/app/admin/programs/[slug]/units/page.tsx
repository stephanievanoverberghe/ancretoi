import 'server-only';
import { dbConnect } from '@/db/connect';
import Unit from '@/models/Unit';
import { requireAdmin } from '@/lib/authz';
import UnitsEditor from './units-editor';

export default async function UnitsPage({ params }: { params: { slug: string } }) {
    await requireAdmin();
    await dbConnect();

    const units = await Unit.find({ programSlug: params.slug.toLowerCase(), unitType: 'day' }).sort({ unitIndex: 1 }).lean();

    return <UnitsEditor slug={params.slug.toLowerCase()} initialUnits={JSON.parse(JSON.stringify(units))} />;
}
