// src/app/(learner)/learn/[slug]/intro/page.tsx
import 'server-only';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import IntroClient from './IntroClient';

type RouteParams = { slug: string };
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function IntroPage({ params }: { params: Promise<RouteParams> }) {
    await dbConnect();
    const { slug } = await params;
    const safeSlug = slug.toLowerCase();

    const user = await requireUser(`/learn/${safeSlug}/intro`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) notFound();

    const page = await ProgramPage.findOne({ programSlug: safeSlug })
        .select({ hero: 1, card: 1, programSlug: 1 })
        .lean<{ hero?: { title?: string | null; subtitle?: string | null } | null } | null>();
    if (!page) notFound();

    const totalDays = await Unit.countDocuments({ programSlug: safeSlug, unitType: 'day' });

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* HERO INTRO */}
            <header className="rounded-3xl border border-border bg-card p-6 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{safeSlug}</p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">{page.hero?.title ?? 'Introduction'}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Avant de commencer : objectifs, bénéfices, et quelques rappels de sécurité.</p>
            </header>

            {/* INFOS UTILES */}
            <section className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                    <li>⏱ Durée totale estimée : {totalDays > 0 ? `${totalDays * 25}–${totalDays * 30} min` : 'à venir'}</li>
                    <li>📝 Notes intégrées (autosave)</li>
                    <li>🧘‍♀️ Bien-être : respiration 2 minutes en cas de surcharge</li>
                    <li>🛟 Sécurité : tu peux mettre en pause à tout moment</li>
                </ul>
            </section>

            <IntroClient slug={safeSlug} />
        </div>
    );
}
