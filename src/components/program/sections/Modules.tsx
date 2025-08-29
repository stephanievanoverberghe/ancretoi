// components/program/sections/Modules.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Lock, Play, Sunrise, Sun, Moon, Clock } from 'lucide-react';

import { getProgramLoader } from '@/lib/programs';
import { track } from '@/lib/analytics.client';
import type { ProgramJSON, Day, DaySection, Exercise } from '@/types/program';
import type { Program } from '@/lib/programs-index';

/* ---------------- UI atoms ---------------- */

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section id="modules" aria-labelledby="modules-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden bg-white scroll-mt-24 py-12 sm:py-16 md:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">{children}</div>
        </section>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <article className="group relative rounded-2xl border border-brand-100/60 bg-white/85 backdrop-blur-[2px] shadow-[0_1px_10px_rgb(0_0_0/0.05)]">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-white/10" />
            {children}
        </article>
    );
}

function ChipGold({ children }: { children: React.ReactNode }) {
    return <span className="inline-flex items-center rounded-lg bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 text-xs font-semibold">{children}</span>;
}

/* ---------------- maths / helpers ---------------- */

function sec(n?: number) {
    return typeof n === 'number' && n > 0 ? n : 0;
}

/** "8" | 8 | "6–7" | "10-12" -> secondes (moyenne si plage) */
function minToSec(minIn?: string | number): number {
    if (minIn == null) return 0;
    if (typeof minIn === 'number') return minIn > 0 ? Math.round(minIn * 60) : 0;
    const s = String(minIn).replace(',', '.');
    const nums = s.match(/[\d.]+/g);
    if (!nums?.length) return 0;
    const a = Number(nums[0]);
    const b = nums[1] !== undefined ? Number(nums[1]) : undefined;
    const mean = Number.isFinite(b) ? (a + (b as number)) / 2 : a;
    return Math.round(Math.max(0, mean) * 60);
}

/** Seconds for a DaySection: priorité à duration_min, sinon somme des timers */
function sectionSeconds(section?: DaySection): number {
    if (!section) return 0;
    const declared = minToSec(section.duration_min);
    if (declared > 0) return declared;
    const list = section.exercises ?? [];
    return list.reduce((total, ex) => total + sec(ex.timer_sec), 0);
}

function sumDay(d: Day) {
    const m = sectionSeconds(d.blocks.morning);
    const n = sectionSeconds(d.blocks.noon);
    const e = sectionSeconds(d.blocks.evening);
    return { m, n, e, total: m + n + e };
}

function fmtMinFromSec(s: number): string {
    const m = Math.round(s / 60);
    return m > 0 ? `${m} min` : '—';
}

function firstLine(d: Day): string | undefined {
    return d.objectives?.[0] ?? d.outcomes?.[0] ?? undefined;
}

type WithMedia = Exercise & { media?: { video?: string; poster?: string; duration_sec?: number } };

function hasVideo(ex: Exercise): ex is Exercise & { media: { video: string } } {
    const media = (ex as WithMedia).media;
    return !!media && typeof media.video === 'string' && media.video.length > 0;
}

function programPoster(program?: Program): string | undefined {
    if (!program) return undefined;
    if (program.cover) return program.cover; // idéal si tu passes la card via "cover" dans l'index
    // fallback conventionnel : /public/images/programs/<slug>/card.jpg
    return program.slug ? `/images/programs/${program.slug}/card.jpg` : undefined;
}

function findPreviewForDay(d: Day, program?: Program) {
    // ✅ Forcer YouTube pour le Jour 1 (peu importe le contenu du JSON)
    if (d.day === 1) {
        const YT_ID = '3moPCb5lIdw';
        return {
            kind: 'video' as const,
            src: `https://www.youtube-nocookie.com/embed/${YT_ID}?rel=0&modestbranding=1&playsinline=1`,
            poster: programPoster(program),
        };
    }

    // Jours suivants : on cherche une vraie vidéo si dispo
    const sections = [d.blocks?.morning, d.blocks?.noon, d.blocks?.evening];
    for (const s of sections) {
        for (const ex of s?.exercises ?? []) {
            if (hasVideo(ex)) {
                return { kind: 'video' as const, src: ex.media.video, poster: ex.media.poster };
            }
        }
    }
    return null;
}

/* ---------------- Modal preview ---------------- */

type PreviewState = { open: false } | { open: true; kind: 'video'; src: string; poster?: string } | { open: true; kind: 'audio'; src: string };

function PreviewModal({ state, onClose }: { state: PreviewState; onClose: () => void }) {
    if (!state.open) return null;
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] grid place-items-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur" />
            <div className="relative z-[201] w-full max-w-3xl rounded-2xl bg-white p-3 ring-1 ring-brand-100/60 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="px-1 pb-2 text-sm font-semibold">Aperçu</div>
                {state.kind === 'video' ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                        {/^https?:\/\/(www\.)?youtube/.test(state.src) ? (
                            <iframe
                                src={state.src}
                                title="Aperçu vidéo"
                                className="absolute inset-0 h-full w-full"
                                loading="lazy"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        ) : (
                            <video className="absolute inset-0 h-full w-full" src={state.src} poster={state.poster} controls preload="metadata" />
                        )}
                    </div>
                ) : (
                    <audio src={state.src} controls className="w-full" preload="none" />
                )}

                <div className="mt-3 flex justify-end">
                    <button type="button" onClick={onClose} className="inline-flex items-center rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm hover:bg-brand-50">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Component ---------------- */

type Props = {
    slug: string;
    program?: Program; // pour prerequisites
    /** audio de fallback si pas de vidéo trouvée sur J1 */
    sampleAudioSrc?: string;
};

export default function Modules({ slug, program, sampleAudioSrc = '/audio/samples/program-sample-60s.mp3' }: Props) {
    const [data, setData] = useState<ProgramJSON | null>(null);
    const ref = useRef<HTMLElement | null>(null);

    // load JSON
    useEffect(() => {
        let cancel = false;
        (async () => {
            const loader = getProgramLoader(slug);
            if (!loader) return;
            const mod = await loader();
            if (!cancel) setData((mod.default ?? mod) as ProgramJSON);
        })();
        return () => {
            cancel = true;
        };
    }, [slug]);

    const days = useMemo(() => data?.days ?? [], [data]);

    // preview state
    const [preview, setPreview] = useState<PreviewState>({ open: false });

    // un seul panneau ouvert
    const [openDay, setOpenDay] = useState<number | null>(null);

    const prerequisites = program?.detail?.prerequisites ?? [];

    return (
        <SectionShell>
            <section ref={ref} className="mx-auto max-w-6xl">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="modules-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Programme détaillé
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Transparence totale : titres, intention du jour et durée (matin • midi • soir).</p>
                </header>

                {/* Prérequis éventuels */}
                {prerequisites.length > 0 && (
                    <div className="mb-6">
                        <Card>
                            <div className="relative p-4 sm:p-5">
                                <div className="mb-2 text-sm font-semibold">Prérequis</div>
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                    {prerequisites.map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Accordéon des jours (un seul ouvert) */}
                <div className="space-y-3">
                    {days.map((d) => {
                        const sums = sumDay(d);
                        const sub = firstLine(d);
                        const isPreview = d.day === 1;
                        const previewMedia = isPreview ? findPreviewForDay(d, program) : null;
                        const isOpen = openDay === d.day;

                        return (
                            <details
                                key={d.day}
                                open={isOpen}
                                className={[
                                    'group relative overflow-hidden rounded-xl border bg-white/80 backdrop-blur-[2px] transition',
                                    isOpen ? 'border-brand-300 shadow-[0_10px_30px_rgb(0_0_0/0.06)]' : 'border-brand-100/70',
                                ].join(' ')}
                                data-open={isOpen ? 'true' : 'false'}
                            >
                                {/* BACKGROUND texture */}
                                <div className="pointer-events-none absolute inset-0 -z-10">
                                    <Image
                                        src="/images/texture-soft.webp"
                                        alt=""
                                        fill
                                        sizes="100vw"
                                        priority={false}
                                        aria-hidden
                                        className="absolute inset-0 object-cover opacity-[0.38] mix-blend-multiply"
                                    />
                                    {/* voile lisibilité + vernis */}
                                    <div className="absolute inset-0 rounded-xl bg-white/35" />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/35 via-transparent to-white/10" />
                                </div>

                                <summary
                                    aria-expanded={isOpen}
                                    className={[
                                        'flex list-none items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer select-none',
                                        isOpen ? 'bg-brand-50/40 rounded-t-xl' : 'hover:bg-brand-50/20 rounded-xl',
                                    ].join(' ')}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const willOpen = !isOpen;
                                        setOpenDay(willOpen ? d.day : null);
                                        track('program_detail_modules_open', { slug, day: d.day, open: willOpen });
                                    }}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold">Jour {d.day}</span>
                                            <ChipGold>
                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                {fmtMinFromSec(sums.total)}
                                            </ChipGold>
                                            {!isPreview && (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-xs text-brand-800">
                                                    <Lock className="h-3.5 w-3.5" /> Réservé
                                                </span>
                                            )}
                                            {isPreview && (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                                    Aperçu gratuit
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 truncate text-sm text-foreground">{d.title}</div>
                                        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
                                    </div>

                                    <ChevronDown
                                        className={['h-5 w-5 text-secondary-700 transition-transform duration-200 ease-out', isOpen ? 'rotate-180' : 'rotate-0'].join(' ')}
                                        aria-hidden
                                    />
                                </summary>

                                {/* contenu jour */}
                                <div
                                    className={[
                                        'px-4 sm:px-5 overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
                                        isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
                                    ].join(' ')}
                                >
                                    <div className="pt-3 pb-4 border-t border-gold-100/70">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                            <Line label="Matin" icon={Sunrise} value={fmtMinFromSec(sums.m)} />
                                            <Line label="Midi" icon={Sun} value={fmtMinFromSec(sums.n)} />
                                            <Line label="Soir" icon={Moon} value={fmtMinFromSec(sums.e)} />
                                        </div>

                                        {/* CTA Aperçu (seulement J1) */}
                                        {isPreview && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        track('program_detail_preview_click', { slug, day: d.day, kind: previewMedia ? 'video' : 'audio' });
                                                        if (previewMedia) {
                                                            setPreview({ open: true, kind: 'video', src: previewMedia.src, poster: previewMedia.poster });
                                                        } else {
                                                            setPreview({ open: true, kind: 'audio', src: sampleAudioSrc });
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-white shadow hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                                                >
                                                    <Play className="h-4 w-4" aria-hidden />
                                                    Voir l’aperçu du Jour 1
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </div>
            </section>

            {/* Modal preview */}
            <PreviewModal state={preview} onClose={() => setPreview({ open: false })} />
        </SectionShell>
    );
}

/* ------------- Small line row ------------- */
function Line({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sunrise }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-brand-100/60 bg-white/70 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-secondary-700">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
            </span>
            <span className="text-xs font-medium text-secondary-900">{value}</span>
        </div>
    );
}
