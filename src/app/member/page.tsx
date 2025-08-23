import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const REGISTRY: Record<string, { title: string; desc?: string }> = {
    'reset-7': { title: 'RESET-7' },
    'boussole-10': { title: 'Boussole-10' },
};

export default async function MemberHome() {
    const sess = await getSession();
    if (!sess?.email) redirect('/login?next=/member');

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<{ _id: unknown; email: string }>();

    if (!user?._id) redirect('/login?next=/member');

    const enrollments = await Enrollment.find({
        userId: user._id,
        status: { $in: ['active', 'completed'] },
    })
        .select({ programSlug: 1, status: 1 })
        .lean<{ programSlug: string; status: string }[]>();

    if (!enrollments.length) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-semibold">Espace membre</h1>
                <p className="mt-2 text-sm text-gray-600">Aucun programme actif pour le moment.</p>
                <Link className="mt-4 inline-block underline" href="/">
                    Retour à l’accueil
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-4 text-3xl font-semibold">Mes programmes</h1>
            <div className="grid gap-4 sm:grid-cols-2">
                {enrollments.map(({ programSlug }) => {
                    const meta = REGISTRY[programSlug] ?? { title: programSlug };
                    return (
                        <div key={programSlug} className="rounded-xl border p-4">
                            <div className="text-xs uppercase tracking-wider text-gray-500">{programSlug}</div>
                            <h2 className="text-xl font-semibold">{meta.title}</h2>
                            {meta.desc && <p className="mt-1 text-sm text-gray-600">{meta.desc}</p>}
                            <div className="mt-3 flex gap-2">
                                <Link href={`/member/${programSlug}/day/1`} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                                    Ouvrir
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
