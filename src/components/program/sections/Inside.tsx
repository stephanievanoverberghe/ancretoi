// components/program/sections/Inside.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Headphones, FileText, Timer, NotebookPen, Infinity, RefreshCcw } from 'lucide-react';

import { getProgramLoader } from '@/lib/programs';
import { track } from '@/lib/analytics.client';
import type { ProgramJSON, DaySection, Exercise } from '@/types/program';
import type { Program } from '@/lib/programs-index';

/* ---------------- UI atoms ---------------- */

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section id="inside" aria-labelledby="inside-title" className="relative mx-[calc(50%-50vw)] w-screen bg-white overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">{children}</div>
        </section>
    );
}

// Corrections optiques par référence de composant (pas de `any`)
const ICON_SCALE = new Map<LucideIcon, number>([
    [Headphones, 1.0],
    [FileText, 1.06],
    [Timer, 1.05],
    [NotebookPen, 1.02],
    [Infinity, 1.1],
    [RefreshCcw, 1.04],
]);

function PaperCutIcon({ Icon, title }: { Icon: LucideIcon; title: string }) {
    const scale = ICON_SCALE.get(Icon) ?? 1;

    return (
        <div
            className="relative inline-grid h-12 w-12 place-items-center rounded-xl
                 bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]
                 shrink-0"
        >
            <span className="sr-only">{title}</span>

            {/* couche ombre (papier dessous) */}
            <Icon
                className="absolute h-[26px] w-[26px] sm:h-7 sm:w-7 text-brand-700/25
                   origin-center translate-x-[0.5px] translate-y-[0.5px]
                   [vector-effect:non-scaling-stroke]"
                strokeWidth={1.9}
                absoluteStrokeWidth
                style={{ transform: `scale(${scale})` }}
                aria-hidden
            />

            {/* couche principale (papier dessus) */}
            <Icon
                className="relative h-[26px] w-[26px] sm:h-7 sm:w-7 text-brand-700/70
                   origin-center [vector-effect:non-scaling-stroke]"
                strokeWidth={1.9}
                absoluteStrokeWidth
                style={{ transform: `scale(${scale})` }}
                aria-hidden
            />

            {/* vernis */}
            <div
                className="pointer-events-none absolute inset-0 rounded-xl
                      bg-gradient-to-b from-white/40 via-transparent to-white/10"
            />
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <article
            className="group relative h-full overflow-hidden rounded-2xl border border-brand-100/60
                 bg-white/85 backdrop-blur-[2px] p-4 sm:p-5
                 shadow-[0_1px_10px_rgb(0_0_0/0.05)]
                 transition hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
        >
            {/* TEXTURE en arrière-plan */}
            <Image
                src="/images/texture-soft.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={false}
                aria-hidden
                className="pointer-events-none select-none absolute inset-0 -z-10 object-cover
                   opacity-[0.38] mix-blend-multiply"
            />
            {/* voile blanc léger pour la lisibilité */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-white/35" aria-hidden />

            {/* vernis/gradient déjà présent */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-white/10" />

            {children}
        </article>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="inline-flex items-center rounded-lg bg-gold-50 text-gold-800 border border-gold-100 px-2 py-0.5 text-xs font-medium">{children}</span>;
}

/* ---------------- maths from JSON ---------------- */

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

function flattenExercises(data: ProgramJSON): Exercise[] {
    const out: Exercise[] = [];
    for (const d of data.days) {
        const S = [d.blocks?.morning, d.blocks?.noon, d.blocks?.evening];
        for (const s of S) for (const ex of s?.exercises ?? []) out.push(ex);
    }
    return out;
}

type WithMedia = Exercise & { media?: { duration_sec?: number } };
const hasMediaSec = (ex: Exercise): ex is WithMedia & { media: { duration_sec: number } } =>
    typeof (ex as WithMedia).media?.duration_sec === 'number' && (ex as WithMedia).media!.duration_sec! > 0;

function fmtMin(s: number) {
    const m = Math.round(s / 60);
    return m ? `${m} min` : '—';
}

/* ---------------- Component ---------------- */

type Props = { slug: string; program?: Program };

export default function Inside({ slug, program }: Props) {
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

    // KPI on view
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('program_detail_inside_view', { slug });
                }
            },
            { threshold: 0.4 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [slug]);

    // computed metrics
    const metrics = useMemo(() => {
        if (!data) return null;

        const exs = flattenExercises(data);
        const guided = exs.filter(hasMediaSec);
        const guidedCount = guided.length;
        const guidedAvg = guidedCount ? Math.round(guided.reduce((a, b) => a + (b.media!.duration_sec as number), 0) / guidedCount) : 0;

        const shortRituals = exs.filter((e) => {
            // un “rituel court” = exercice ≤ 3 min (180s)
            const s = sec(e.timer_sec);
            return s > 0 && s <= 180;
        }).length;

        const themes = Array.from(new Set(data.days.map((d) => d.title.trim()))).slice(0, 3);

        // Durée moyenne par moment (juste pour enrichir les puces si besoin)
        const daySecs = data.days.map((d) => sectionSeconds(d.blocks.morning) + sectionSeconds(d.blocks.noon) + sectionSeconds(d.blocks.evening));
        const avgDay = daySecs.length ? Math.round(daySecs.reduce((a, b) => a + b, 0) / daySecs.length) : 0;

        return { guidedCount, guidedAvg, shortRituals, themes, avgDay };
    }, [data]);

    return (
        <SectionShell>
            <section ref={ref} className="mx-auto max-w-6xl">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="inside-title" className="font-serif text-[clamp(1.35rem,3.8vw,2rem)] leading-tight">
                        Ce que tu reçois
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                        Valeur packagée, concrète : audios guidés, rituels courts, fiches PDF, journal intégré, accès à vie, mises à jour.
                    </p>
                </header>

                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Audios guidés */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={Headphones} title="Audios guidés" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Audios guidés</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {metrics ? (
                                            <>
                                                {metrics.guidedCount || '—'} pistes • durée moyenne {fmtMin(metrics.guidedAvg)}
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </li>

                    {/* Rituels courts */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={Timer} title="Rituels courts" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Rituels courts</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{metrics ? `${metrics.shortRituals} formats ≤ 3 min` : '—'}</p>
                                </div>
                            </div>
                        </Card>
                    </li>

                    {/* Fiches PDF (thèmes) */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={FileText} title="Fiches PDF" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Fiches PDF (thèmes)</h3>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {metrics?.themes?.length ? (
                                            metrics.themes.map((t, i) => <Pill key={i}>{t}</Pill>)
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Thèmes clés du programme</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </li>

                    {/* Journal intégré + export */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={NotebookPen} title="Journal intégré" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Journal intégré + export</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Écris, relis, exporte (PDF ou CSV) quand tu veux.</p>
                                </div>
                            </div>
                        </Card>
                    </li>

                    {/* Accès à vie */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={Infinity} title="Accès à vie" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Accès à vie</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Reviens quand tu veux, sans limite.</p>
                                </div>
                            </div>
                        </Card>
                    </li>

                    {/* Mises à jour incluses */}
                    <li>
                        <Card>
                            <div className="flex items-start gap-4">
                                <PaperCutIcon Icon={RefreshCcw} title="Mises à jour" />
                                <div className="min-w-0">
                                    <h3 className="text-[15px] font-semibold text-foreground">Mises à jour incluses</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">Améliorations et bonus livrés automatiquement.</p>
                                </div>
                            </div>
                        </Card>
                    </li>
                </ul>

                {/* Optionnel : déclinaison de l’index “inside” (si fourni via meta) */}
                {program?.detail?.includes?.length ? (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Inclus aussi : {program.detail.includes.slice(0, 6).join(' · ')}
                            {program.detail.includes.length > 6 ? '…' : ''}
                        </p>
                    </div>
                ) : null}
            </section>
        </SectionShell>
    );
}
