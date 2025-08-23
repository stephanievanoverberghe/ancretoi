import { dbConnect } from '@/db/connect';
import Enrollment from '@/models/Enrollment';
import { getSession } from '@/lib/session';
import ResumeLink from './resumeLink/page';

export default async function MemberDashboard() {
    const sess = await getSession();
    if (!sess?.email) return null;

    await dbConnect();
    const enrollments = await Enrollment.find({
        status: { $in: ['active', 'completed'] },
        // éventuellement .find({ userId: ... }) selon ton modèle
    })
        .select({ programSlug: 1, status: 1, _id: 0 })
        .lean();

    if (!enrollments?.length) {
        return <div className="p-6">No active program yet.</div>;
    }

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-4">
            <h1 className="text-3xl font-semibold">Member space</h1>
            {enrollments.map((e) => (
                <div key={e.programSlug} className="rounded-2xl border p-4">
                    <div className="text-xs uppercase tracking-wider text-gray-500">Program</div>
                    <h2 className="text-xl font-semibold">{e.programSlug}</h2>
                    <p className="text-sm text-gray-600">Status: {e.status}</p>
                    <ResumeLink programSlug={e.programSlug} />
                </div>
            ))}
        </div>
    );
}
