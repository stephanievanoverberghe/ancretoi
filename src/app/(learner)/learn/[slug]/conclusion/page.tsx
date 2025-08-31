// src/app/(learner)/learn/[slug]/conclusion/page.tsx
import 'server-only';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';

type RouteParams = { slug: string };
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ConclusionPage({ params }: { params: Promise<RouteParams> }) {
    await dbConnect();
    const { slug } = await params;
    const safeSlug = slug.toLowerCase();

    const user = await requireUser(`/learn/${safeSlug}/conclusion`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1, name: 1 }).lean<{ _id: unknown; name?: string | null } | null>();
    if (!userDoc?._id) redirect(`/learn/${safeSlug}`);

    const userId = String(userDoc._id);
    const enr = await Enrollment.findOne({ userId, programSlug: safeSlug })
        .select({ status: 1, currentDay: 1 })
        .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>();

    const totalPublished = await Unit.countDocuments({ programSlug: safeSlug, unitType: 'day', status: 'published' });

    // 🔒 si pas terminé, renvoyer vers la dernière leçon atteignable
    if (!enr || enr.status !== 'completed') {
        const current = Math.max(1, Math.min(totalPublished || 1, enr?.currentDay ?? 1));
        redirect(`/learn/${safeSlug}/day/${String(current).padStart(2, '0')}`);
    }

    const displayName = user.name ?? userDoc?.name ?? '';

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <header className="rounded-3xl border bg-white/70 p-6 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Bravo 🎉</p>
                <h1 className="mt-1 text-2xl font-semibold">Bilan & prochaines étapes</h1>
                <p className="mt-1 text-sm text-gray-600">{displayName ? `${displayName.split(' ')[0]}, ` : ''}tu as complété toutes les leçons publiées. Voici ta synthèse.</p>
            </header>

            <section className="rounded-2xl border bg-white/70 p-5 backdrop-blur">
                <h2 className="text-lg font-semibold">Synthèse rapide</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    <li>{totalPublished} leçon(s) complétée(s)</li>
                    <li>Notes & journaux enregistrés — tu peux les exporter ci-dessous</li>
                </ul>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href={`/notes?export=pdf`} className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700">
                        Exporter mon carnet (PDF)
                    </Link>
                    <Link href={`/notes?export=json`} className="rounded-xl border px-4 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">
                        Exporter mes données (JSON)
                    </Link>
                </div>
            </section>

            <section className="rounded-2xl border bg-white/70 p-5 backdrop-blur">
                <h3 className="text-base font-semibold">Et maintenant ?</h3>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href="/member" className="rounded-xl border px-4 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">
                        Retour au tableau de bord
                    </Link>
                    <Link href="/library" className="rounded-xl border px-4 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">
                        Voir les ressources
                    </Link>
                </div>
            </section>
        </div>
    );
}
