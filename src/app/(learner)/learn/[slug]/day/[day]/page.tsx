// src/app/(learner)/learn/[slug]/day/[day]/page.tsx

import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';
import LearnDayClient from './LessonClient';

type Params = { slug: string; day: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LearnDayPage({ params }: { params: Promise<Params> }) {
    await dbConnect();

    // Next 15: params est async
    const { slug, day } = await params;
    const safeSlug = slug.toLowerCase();

    // Auth
    const user = await requireUser(`/learn/${safeSlug}/day/${day}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) notFound();

    // Jours publiés, triés croissant
    const units = await Unit.find({ programSlug: safeSlug, unitType: 'day', status: 'published' })
        .select({
            _id: 1,
            unitIndex: 1,
            title: 1,
            mantra: 1,
            durationMin: 1,
            videoAssetId: 1,
            audioAssetId: 1,
            contentParagraphs: 1,
            safetyNote: 1,
            journalSchema: 1,
        })
        .sort({ unitIndex: 1 })
        .lean<
            {
                _id: unknown;
                unitIndex: number;
                title?: string;
                mantra?: string;
                durationMin?: number;
                videoAssetId?: string;
                audioAssetId?: string;
                contentParagraphs?: string[];
                safetyNote?: string;
                journalSchema?: {
                    sliders?: { key: string; label: string; min?: number; max?: number; step?: number }[];
                    questions?: { key: string; label: string; placeholder?: string }[];
                    checks?: { key: string; label: string }[];
                };
            }[]
        >();

    if (units.length === 0) {
        // pas de contenu publié → vue d’ensemble
        redirect(`/learn/${safeSlug}`);
    }

    // Jour demandé (doit exister dans les publiés)
    const requested = Number.parseInt(day, 10);
    if (!Number.isFinite(requested) || requested < 1) notFound();

    const unit = units.find((u) => u.unitIndex === requested);
    if (!unit) {
        // le jour demandé n'est pas publié → on pousse vers le 1er publié
        redirect(`/learn/${safeSlug}/day/${units[0].unitIndex}`);
    }

    // Gating séquentiel via enrollment
    const enr = await Enrollment.findOne({ userId: String(userDoc._id), programSlug: safeSlug })
        .select({ status: 1, currentDay: 1 })
        .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>();

    const isCompleted = enr?.status === 'completed';
    const publishedIndices = units.map((u) => u.unitIndex);
    const lastPublished = publishedIndices[publishedIndices.length - 1];
    const currentDay = Math.max(1, Math.min(lastPublished, enr?.currentDay ?? 1));

    // Si non terminé et tentative d'ouvrir un jour futur → redirige vers currentDay
    if (!isCompleted && requested > currentDay) {
        redirect(`/learn/${safeSlug}/day/${currentDay}`);
    }

    // prev / next sur la liste publiée
    const pos = units.findIndex((u) => u.unitIndex === unit.unitIndex);
    const prev = pos > 0 ? units[pos - 1] : null;
    const next = pos < units.length - 1 ? units[pos + 1] : null;

    // État (brouillon / complété)
    const state = await DayState.findOne({
        userId: userDoc._id,
        programSlug: safeSlug,
        day: unit.unitIndex,
    })
        .select({ data: 1, sliders: 1, practiced: 1, mantra3x: 1, completed: 1, updatedAt: 1 })
        .lean<{
            data?: Record<string, string>;
            sliders?: { energie?: number; focus?: number; paix?: number; estime?: number };
            practiced?: boolean;
            mantra3x?: boolean;
            completed?: boolean;
            updatedAt?: Date;
        } | null>();

    const totalDays = units.length;
    const prevHref = prev ? `/learn/${safeSlug}/day/${prev.unitIndex}` : null;
    const nextHref = next ? `/learn/${safeSlug}/day/${next.unitIndex}` : null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* En-tête */}
            <header className="rounded-3xl border border-border bg-card p-6 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {safeSlug} · Jour {String(unit.unitIndex).padStart(2, '0')}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground">{unit.title ?? `Jour ${unit.unitIndex}`}</h1>
                {unit.mantra && <p className="mt-1 text-sm text-muted-foreground">{unit.mantra}</p>}
                <div className="mt-2 text-xs text-muted-foreground">⏱ {unit.durationMin ?? 25} min · 📝 notes 5–10 min · 💧 pense à t’hydrater</div>
            </header>

            {/* Player (placeholder si pas de vidéo) */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card p-4 backdrop-blur">
                {unit.videoAssetId ? (
                    // Branche ton lecteur HLS/Mux ici
                    <div className="aspect-video w-full rounded-xl bg-black/90" />
                ) : (
                    <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted text-sm text-muted-foreground">Vidéo à venir</div>
                )}

                {!!unit.contentParagraphs?.length && (
                    <div className="mt-4 space-y-3 text-foreground">
                        {unit.contentParagraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                )}
            </section>

            {/* Journal & actions (client) */}
            <LearnDayClient
                slug={safeSlug}
                day={unit.unitIndex}
                totalDays={totalDays}
                prevHref={prevHref}
                nextHref={nextHref}
                meta={{
                    durationMin: unit.durationMin ?? 25,
                    safetyNote: unit.safetyNote ?? '',
                    journal: {
                        sliders: unit.journalSchema?.sliders ?? [
                            { key: 'energie', label: 'Énergie', min: 0, max: 10, step: 1 },
                            { key: 'focus', label: 'Clarté', min: 0, max: 10, step: 1 },
                            { key: 'paix', label: 'Paix', min: 0, max: 10, step: 1 },
                        ],
                        questions: unit.journalSchema?.questions ?? [
                            { key: 'intention', label: 'Intention du jour', placeholder: 'Ce que je vise aujourd’hui…' },
                            { key: 'takeaways', label: 'Ce que je retiens', placeholder: '3 points saillants…' },
                            { key: 'next', label: 'Prochain micro-pas', placeholder: 'Action simple d’ici demain…' },
                        ],
                        checks: unit.journalSchema?.checks ?? [
                            { key: 'pratique', label: 'Pratique faite' },
                            { key: 'mantra', label: 'Mantra répété 3×' },
                        ],
                    },
                }}
                initial={{
                    data: state?.data ?? {},
                    sliders: { energie: 0, focus: 0, paix: 0, estime: 0, ...(state?.sliders ?? {}) },
                    practiced: !!state?.practiced,
                    mantra3x: !!state?.mantra3x,
                    completed: !!state?.completed,
                    lastSavedAt: state?.updatedAt ? new Date(state.updatedAt).toLocaleTimeString('fr-FR') : null,
                }}
            />
        </div>
    );
}
