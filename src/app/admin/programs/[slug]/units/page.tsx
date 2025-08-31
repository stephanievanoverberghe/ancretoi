// app/admin/programs/[slug]/units/page.tsx

import 'server-only';
import { dbConnect } from '@/db/connect';
import Unit from '@/models/Unit';
import { requireAdmin } from '@/lib/authz';
import UnitsEditor from './units-editor';

type Params = { slug: string };

export default async function UnitsPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;

    await requireAdmin();
    await dbConnect();

    const units = await Unit.find({
        programSlug: slug.toLowerCase(),
        unitType: 'day',
    })
        .sort({ unitIndex: 1 })
        .lean();

    return <UnitsEditor slug={slug.toLowerCase()} initialUnits={JSON.parse(JSON.stringify(units))} />;
}
