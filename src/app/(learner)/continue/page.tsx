import 'server-only';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import { getNextStepForUser } from '@/lib/learn/getNextStep';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ContinuePage() {
    await dbConnect();
    const user = await requireUser('/continue');

    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

    if (!userDoc?._id) redirect('/login?next=/member');

    const next = await getNextStepForUser(userDoc._id);
    redirect(next.href);
}
