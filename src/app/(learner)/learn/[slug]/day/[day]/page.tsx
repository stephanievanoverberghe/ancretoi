// src/app/(learner)/learn/[slug]/day/[day]/page.tsx
import 'server-only';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';
import LearnDayClient from './LessonClient';
import ProgramDetailButton from '@/app/(learner)/components/ProgramDetailButton';

type Params = { slug: string; day: string };

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// YouTube clean embed
function detectPlayer(url?: string) {
    if (!url) return { kind: 'none' as const, src: '' };
    try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        const host = u.hostname.toLowerCase();
        if (host.includes('youtu.be') || host.includes('youtube')) {
            const id = host.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
            if (id) return { kind: 'youtube' as const, src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` };
        }
        if (host.includes('vimeo.com')) {
            const parts = u.pathname.split('/').filter(Boolean);
            const id = parts.pop();
            if (id) return { kind: 'vimeo' as const, src: `https://player.vimeo.com/video/${id}` };
        }
        if (/\.(mp4|webm|mov)(\?.*)?$/i.test(u.pathname)) return { kind: 'file' as const, src: u.toString() };
    } catch {}
    return { kind: 'none' as const, src: '' };
}

export default async function LearnDayPage({ params }: { params: Promise<Params> }) {
    await dbConnect();

    const { slug, day } = await params;
    const safeSlug = slug.toLowerCase();

    // Auth
    const user = await requireUser(`/learn/${safeSlug}/day/${day}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) notFound();

    // Jours publiés
    const units = await Unit.find({ programSlug: safeSlug, unitType: 'day', status: 'published' })
        .select({ unitIndex: 1, title: 1, mantra: 1, durationMin: 1, videoUrl: 1, contentParagraphs: 1 })
        .sort({ unitIndex: 1 })
        .lean<{ unitIndex: number; title?: string; mantra?: string; durationMin?: number; videoUrl?: string; contentParagraphs?: string[] }[]>();

    if (units.length === 0) redirect(`/learn/${safeSlug}`);

    const requested = Number.parseInt(day, 10);
    if (!Number.isFinite(requested) || requested < 1) notFound();

    const unit = units.find((u) => u.unitIndex === requested);
    if (!unit) redirect(`/learn/${safeSlug}/day/${units[0].unitIndex}`);

    // Gating
    const enr = await Enrollment.findOne({ userId: String(userDoc._id), programSlug: safeSlug })
        .select({ status: 1, currentDay: 1, introEngaged: 1 })
        .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null; introEngaged?: boolean | null } | null>();
    if (!enr?.introEngaged) redirect(`/learn/${safeSlug}/intro`);

    const isCompleted = enr?.status === 'completed';
    const publishedIndices = units.map((u) => u.unitIndex);
    const lastPublished = publishedIndices[publishedIndices.length - 1];
    const currentDay = Math.max(1, Math.min(lastPublished, enr?.currentDay ?? 1));
    if (!isCompleted && requested > currentDay) redirect(`/learn/${safeSlug}/day/${currentDay}`);

    // Prev/Next
    const pos = units.findIndex((u) => u.unitIndex === unit.unitIndex);
    const prev = pos > 0 ? units[pos - 1] : null;
    const next = pos < units.length - 1 ? units[pos + 1] : null;
    const prevHref = prev ? `/learn/${safeSlug}/day/${prev.unitIndex}` : null;
    const nextHref = next ? `/learn/${safeSlug}/day/${next.unitIndex}` : null;

    // État actuel + stats
    const [state, completedCount] = await Promise.all([
        DayState.findOne({ userId: userDoc._id, programSlug: safeSlug, day: unit.unitIndex })
            .select({ data: 1, practiced: 1, completed: 1, updatedAt: 1 })
            .lean<{ data?: Record<string, string>; practiced?: boolean; completed?: boolean; updatedAt?: Date } | null>(),
        DayState.countDocuments({ userId: userDoc._id, programSlug: safeSlug, completed: true }),
    ]);

    const totalDays = units.length;
    const remaining = Math.max(0, totalDays - completedCount);
    const player = detectPlayer(unit.videoUrl);

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 sm:px-5">
            {/* ===== Header style "admin" adapté learner ===== */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                {/* Breadcrumb */}
                <div className="text-xs text-muted-foreground">
                    <Link href={`/learn/${safeSlug}`} className="hover:underline">
                        Programme
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Jour {String(unit.unitIndex).padStart(2, '0')}</span>
                </div>

                {/* Titre & sous-titre */}
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{unit.title ?? `Jour ${unit.unitIndex}`}</h1>
                <p className="text-sm text-muted-foreground mt-1">{unit.mantra ? unit.mantra : 'Pratique guidée du jour'}</p>

                {/* Petites stats */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-lg font-semibold">{totalDays}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Terminés</div>
                        <div className="text-lg font-semibold">{completedCount}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">En cours</div>
                        <div className="text-lg font-semibold">J{String(currentDay).padStart(2, '0')}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Restants</div>
                        <div className="text-lg font-semibold">{remaining}</div>
                    </div>
                </div>

                {/* Actions alignées à droite */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <ProgramDetailButton slug={safeSlug} label="Vue d’ensemble" />

                    {prevHref && (
                        <Link href={prevHref} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50" aria-label="Jour précédent">
                            ← Précédent
                        </Link>
                    )}
                    {nextHref && (
                        <Link
                            href={nextHref}
                            className="rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                            aria-label="Jour suivant"
                        >
                            Suivant →
                        </Link>
                    )}
                </div>
            </div>

            {/* Player (si présent) */}
            {player.kind !== 'none' && (
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="aspect-video w-full">
                        {player.kind === 'file' ? (
                            <video className="h-full w-full" src={player.src} controls playsInline preload="metadata" />
                        ) : (
                            <iframe
                                className="h-full w-full"
                                src={player.src}
                                title="Lecture vidéo"
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        )}
                    </div>
                </section>
            )}

            {/* Contenu (si présent) */}
            {Array.isArray(unit.contentParagraphs) && unit.contentParagraphs.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <div className="space-y-3 text-[15px] leading-relaxed text-foreground">
                        {unit.contentParagraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                </section>
            )}

            {/* Client — notes optionnelles + “Pratique faite” + footer sticky validation */}
            <LearnDayClient
                slug={safeSlug}
                day={unit.unitIndex}
                prevHref={prevHref}
                nextHref={nextHref}
                initial={{
                    data: state?.data ?? {},
                    practiced: !!state?.practiced,
                    completed: !!state?.completed,
                    lastSavedAt: state?.updatedAt ? new Date(state.updatedAt).toLocaleTimeString('fr-FR') : null,
                }}
            />
        </div>
    );
}
