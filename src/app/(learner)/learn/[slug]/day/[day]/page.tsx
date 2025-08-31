// src/app/(learner)/learn/[slug]/day/[day]/page.tsx
import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';
import LearnDayClient from './LessonClient';

type Params = { slug: string; day: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LearnDayPage({ params }: { params: Promise<Params> }) {
    await dbConnect();

    // Next 15 : params est async
    const { slug, day } = await params;
    const safeSlug = slug.toLowerCase();

    // Auth
    const user = await requireUser(`/learn/${safeSlug}/day/${day}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) notFound();

    // Total jours
    const totalDays = await Unit.countDocuments({ programSlug: safeSlug, unitType: 'day' });
    if (totalDays === 0) {
        redirect(`/learn/${safeSlug}`); // pas de contenu -> page overview
    }

    // bornage + lookup unité
    const asked = Number.parseInt(day, 10);
    const dayNum = Number.isFinite(asked) ? Math.max(1, Math.min(totalDays, asked)) : 1;

    const unit = await Unit.findOne({ programSlug: safeSlug, unitType: 'day', unitIndex: dayNum })
        .select({
            _id: 1,
            programSlug: 1,
            unitIndex: 1,
            title: 1,
            mantra: 1,
            durationMin: 1,
            videoAssetId: 1,
            audioAssetId: 1,
            contentParagraphs: 1,
            safetyNote: 1,
            journalSchema: 1,
            status: 1,
        })
        .lean<{
            _id: unknown;
            programSlug: string;
            unitIndex: number;
            title: string;
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
            status: 'draft' | 'published';
        } | null>();

    if (!unit) {
        // s’il n’existe pas ce jour mais que d’autres existent, renvoie au J1
        redirect(`/learn/${safeSlug}/day/1`);
    }

    // état déjà saisi (brouillon / complété)
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

    const prevHref = unit.unitIndex > 1 ? `/learn/${safeSlug}/day/${String(unit.unitIndex - 1)}` : null;
    const nextHref = unit.unitIndex < totalDays ? `/learn/${safeSlug}/day/${String(unit.unitIndex + 1)}` : null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* En-tête */}
            <header className="rounded-3xl border bg-white/70 p-6 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                    {safeSlug} · Jour {String(unit.unitIndex).padStart(2, '0')}
                </p>
                <h1 className="mt-1 text-2xl font-semibold">{unit.title}</h1>
                {unit.mantra && <p className="mt-1 text-sm text-gray-600">{unit.mantra}</p>}
                <div className="mt-2 text-xs text-gray-500">⏱ {unit.durationMin ?? 25} min · 📝 notes 5–10 min · 💧 pense à t’hydrater</div>
            </header>

            {/* Player (vidéo ou placeholder) */}
            <section className="overflow-hidden rounded-2xl border bg-white/70 p-4 backdrop-blur">
                {unit.videoAssetId ? (
                    <div className="aspect-video w-full rounded-xl bg-black/90" />
                ) : (
                    // Intègre ici ton lecteur HLS maison ou Mux si tu en as un
                    <div className="aspect-video grid w-full place-items-center rounded-xl border border-dashed">
                        <p className="text-sm text-gray-600">Vidéo à venir</p>
                    </div>
                )}
                {!!unit.contentParagraphs?.length && (
                    <div className="prose prose-sm mt-4 max-w-none text-gray-800">
                        {unit.contentParagraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                )}
            </section>

            {/* Journal & actions (client) */}
            <LearnDayClient
                slug={safeSlug}
                unitId={String(unit._id)}
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
                            { key: 'clarte', label: 'Clarté', min: 0, max: 10, step: 1 },
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
