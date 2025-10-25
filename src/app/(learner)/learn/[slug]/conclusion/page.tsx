// src/app/(learner)/learn/[slug]/conclusion/page.tsx
import 'server-only';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import ResetProgramClient from './ResetProgramClient';

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
    const firstName = displayName ? displayName.split(' ')[0] : '';

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* HERO */}
            <header className="rounded-3xl border border-border bg-card p-6 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-brand-600">Bravo 🎉</p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">Bilan & prochaines étapes</h1>
                <p className="mt-1 text-sm text-muted-foreground">{firstName ? `${firstName}, ` : ''}tu as complété toutes les leçons publiées. Voici ta synthèse.</p>
            </header>

            {/* SYNTHÈSE + EXPORTS */}
            <section className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
                <h2 className="text-lg font-semibold text-foreground">Synthèse rapide</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>{totalPublished} leçon(s) complétée(s)</li>
                    <li>Notes & journaux enregistrés — tu peux les exporter ci-dessous</li>
                </ul>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href={`/notes?export=pdf`} className="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
                        Exporter mon carnet (PDF)
                    </Link>
                    <Link href={`/notes?export=json`} className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Exporter mes données (JSON)
                    </Link>
                </div>
            </section>

            {/* CTA SUIVANTS + RÉINITIALISATION */}
            <section className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
                <h3 className="text-base font-semibold text-foreground">Et maintenant ?</h3>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href="/member" className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Retour au tableau de bord
                    </Link>
                    <Link href="/library" className="rounded-xl px-4 py-2 text-sm font-medium text-center text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                        Voir les ressources
                    </Link>
                </div>

                {/* Ligne séparatrice douce */}
                <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Bloc réinitialisation */}
                <div className="rounded-xl border border-border/80 bg-brand-50/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground">Recommencer ce programme</h4>
                            <p className="text-xs text-muted-foreground">Supprime tes réponses et remets la progression au jour 1. Tu seras redirigé·e vers l’introduction.</p>
                        </div>
                        <ResetProgramClient slug={safeSlug} />
                    </div>
                </div>
            </section>
        </div>
    );
}
