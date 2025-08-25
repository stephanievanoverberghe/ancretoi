'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Sunrise, Sun, Moon, PlayCircle, X, Gauge, Calendar } from 'lucide-react';
import { getProgramLoader } from '@/lib/programs';
import { track } from '@/lib/analytics';
import type { ProgramJSON, Day, DaySection, Exercise } from '@/types/program';

type Props = {
    slug: string;
    posterSrc?: string;
    youtubeId?: string;
};

/* -------------------- UI atoms -------------------- */

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section id="experience" aria-labelledby="experience-title" className="relative mx-[calc(50%-50vw)] z-10 w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            {/* halos + filets or */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
                <div className="absolute left-[-10%] top-[-12%] h-40 w-40 rounded-full bg-brand-100/25 blur-3xl" />
                <div className="absolute right-[-8%] bottom-[-14%] h-48 w-48 rounded-full bg-gold-100/35 blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/60" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/60" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">{children}</div>
        </section>
    );
}

function PaperCutCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
    return (
        <div
            className={[
                'relative rounded-2xl border border-brand-100/60 bg-white/80 backdrop-blur-[2px]',
                'shadow-[0_1px_10px_rgb(0_0_0/0.05)] transition',
                'hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-white/10" aria-hidden />
            {children}
        </div>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return <span className="inline-flex items-center rounded-lg bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 text-xs font-semibold">{children}</span>;
}

/* -------------------- maths from JSON -------------------- */

function sec(n?: number): number {
    return typeof n === 'number' && n > 0 ? n : 0;
}

/** "8" | 8 | "6–7" | "10-12" -> secondes (moyenne si plage) */
function minToSec(minIn?: string | number): number {
    if (minIn == null) return 0;
    if (typeof minIn === 'number') {
        return minIn > 0 ? Math.round(minIn * 60) : 0;
    }
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
    const declared = minToSec(section.duration_min); // ⬅️ remplacé minStrToSec
    if (declared > 0) return declared;
    const list = section.exercises ?? [];
    return list.reduce((total, ex) => total + sec(ex.timer_sec), 0);
}

function sumDay(d: Day): { m: number; n: number; e: number; total: number } {
    const m = sectionSeconds(d.blocks.morning);
    const n = sectionSeconds(d.blocks.noon);
    const e = sectionSeconds(d.blocks.evening);
    return { m, n, e, total: m + n + e };
}

function fmtMinFromSec(s: number): string {
    const m = Math.round(s / 60);
    return m > 0 ? `${m} min` : '—';
}

function average(parts: number[]): number {
    if (parts.length === 0) return 0;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/* --------- vidéo totale (optionnelle) --------- */
type ExerciseMedia = { media?: { duration_sec?: number } };
function hasMediaDuration(ex: Exercise | (Exercise & ExerciseMedia)): ex is Exercise & { media: { duration_sec: number } } {
    const m = (ex as ExerciseMedia).media;
    return !!m && typeof m.duration_sec === 'number' && m.duration_sec > 0;
}

function programVideoSeconds(data: ProgramJSON): number {
    let total = 0;
    for (const d of data.days) {
        const sections = [d.blocks?.morning, d.blocks?.noon, d.blocks?.evening];
        for (const s of sections) {
            const exs = s?.exercises ?? [];
            for (const ex of exs) {
                if (hasMediaDuration(ex)) total += ex.media.duration_sec;
            }
        }
    }
    return total;
}

function fmtHours(totalSec: number): string {
    const h = Math.floor(totalSec / 3600);
    const m = Math.round((totalSec % 3600) / 60);
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
}

/* Groupings:
   - 7j → cartes “Jour”
   - 10j → 2 blocs (J1–J5, J6–J10)
   - 30j → 4 semaines (1–7, 8–14, 15–21, 22–30)
   - 90j → 3 actes (1–30, 31–60, 61–90)
*/
type CardKind = 'day' | 'group';
type Card = {
    kind: CardKind;
    id: string;
    title: string;
    subtitle?: string;
    mSec: number; // morning sec
    nSec: number; // noon sec
    eSec: number; // evening sec
    totalSec: number;
};

function buildDayCards(data: ProgramJSON): Card[] {
    return data.days.map((d) => {
        const sums = sumDay(d);
        return {
            kind: 'day' as const,
            id: `j${d.day}`,
            title: `Jour ${d.day} — ${d.title}`,
            subtitle: d.objectives?.[0] ?? d.outcomes?.[0],
            mSec: sums.m,
            nSec: sums.n,
            eSec: sums.e,
            totalSec: sums.total,
        };
    });
}

function sliceAvg(days: Day[]): { mSec: number; nSec: number; eSec: number; totalSec: number } {
    const m: number[] = [];
    const n: number[] = [];
    const e: number[] = [];
    const t: number[] = [];
    for (const d of days) {
        const s = sumDay(d);
        m.push(s.m);
        n.push(s.n);
        e.push(s.e);
        t.push(s.total);
    }
    return {
        mSec: average(m),
        nSec: average(n),
        eSec: average(e),
        totalSec: average(t),
    };
}

function buildBlocks10(data: ProgramJSON): Card[] {
    const blocks: Array<[number, number, string]> = [
        [1, 5, 'Bloc 1 — J1–J5'],
        [6, 10, 'Bloc 2 — J6–J10'],
    ];
    return blocks.map(([a, b, label]) => {
        const days = data.days.filter((d) => d.day >= a && d.day <= b);
        const avg = sliceAvg(days);
        return {
            kind: 'group' as const,
            id: `b-${a}-${b}`,
            title: label,
            subtitle: days[0]?.objectives?.[0] ?? days[0]?.outcomes?.[0],
            ...avg,
        };
    });
}

function buildWeekCards30(data: ProgramJSON): Card[] {
    const groups: Array<[number, number, string]> = [
        [1, 7, 'Semaine 1'],
        [8, 14, 'Semaine 2'],
        [15, 21, 'Semaine 3'],
        [22, 30, 'Semaine 4'],
    ];
    return groups.map(([a, b, label]) => {
        const days = data.days.filter((d) => d.day >= a && d.day <= b);
        const avg = sliceAvg(days);
        return {
            kind: 'group' as const,
            id: `w-${a}-${b}`,
            title: `${label} — J${a}–J${b}`,
            subtitle: days[0]?.objectives?.[0] ?? days[0]?.outcomes?.[0],
            ...avg,
        };
    });
}

function buildActCards90(data: ProgramJSON): Card[] {
    const groups: Array<[number, number, string]> = [
        [1, 30, 'Acte I — Stabiliser'],
        [31, 60, 'Acte II — Clarifier'],
        [61, 90, 'Acte III — Transformer'],
    ];
    return groups.map(([a, b, label]) => {
        const days = data.days.filter((d) => d.day >= a && d.day <= b);
        const avg = sliceAvg(days);
        return {
            kind: 'group' as const,
            id: `act-${a}`,
            title: `${label} — J${a}–J${b}`,
            subtitle: days[0]?.objectives?.[0] ?? days[0]?.outcomes?.[0],
            ...avg,
        };
    });
}

function buildCards(data: ProgramJSON): Card[] {
    const n = data.days.length;
    if (n <= 7) return buildDayCards(data);
    if (n === 10) return buildBlocks10(data); // ✅ Boussole: 5 + 5
    if (n <= 30) return buildWeekCards30(data);
    return buildActCards90(data);
}

function programAverages(data: ProgramJSON) {
    const sums = data.days.map(sumDay);
    const m = average(sums.map((s) => s.m));
    const n = average(sums.map((s) => s.n));
    const e = average(sums.map((s) => s.e));
    const t = average(sums.map((s) => s.total));
    return { m, n, e, t };
}

/* ---------- Micro bars (UX upgrade) ---------- */

function BarTriplet({ mSec, nSec, eSec }: { mSec: number; nSec: number; eSec: number }) {
    const max = Math.max(mSec, nSec, eSec, 1);
    const pct = (v: number) => `${Math.max(10, Math.round((v / max) * 100))}%`; // min 10% visible

    const Item = ({ Icon, label, value }: { Icon: typeof Sunrise; label: string; value: number }) => (
        <div className="w-full">
            <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-secondary-700">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                </span>
                <span className="text-xs tabular-nums text-secondary-800">{fmtMinFromSec(value)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-brand-50 ring-1 ring-brand-100/60">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-300 via-brand-500 to-gold-400 transition-[width]" style={{ width: pct(value) }} aria-hidden />
            </div>
        </div>
    );

    return (
        <div className="grid gap-2">
            <Item Icon={Sunrise} label="Matin" value={mSec} />
            <Item Icon={Sun} label="Midi" value={nSec} />
            <Item Icon={Moon} label="Soir" value={eSec} />
        </div>
    );
}

/* -------------------- Component -------------------- */

export default function Experience({ slug, posterSrc = '/images/sample-poster.webp', youtubeId = '3moPCb5lIdw' }: Props) {
    const [data, setData] = useState<ProgramJSON | null>(null);
    const [openYT, setOpenYT] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // load JSON for this program
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

    // KPI view on first intersection
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('program_detail_timeline_view', { slug });
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [slug]);

    const cards = useMemo<Card[]>(() => (data ? buildCards(data) : []), [data]);
    const averages = useMemo(() => (data ? programAverages(data) : null), [data]);
    const videoSec = useMemo(() => (data ? programVideoSeconds(data) : 0), [data]);

    const onOpenYT = useCallback(() => {
        setOpenYT(true);
        track('program_detail_sample_play', { slug, kind: 'youtube' });
    }, [slug]);

    return (
        <SectionShell>
            <div ref={sectionRef}>
                {/* Header */}
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="experience-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Ce que tu vas vivre
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Rythme réel calculé depuis les exercices (matin + midi + soir).</p>
                </header>

                {/* Bande “Rythme moyen” + Teaser bouton */}
                <div className="mb-10 grid items-center gap-4 sm:grid-cols-3">
                    <PaperCutCard className="p-5 sm:col-span-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 text-[13px] text-brand-800">
                                <Gauge className="h-4 w-4" aria-hidden />
                                Rythme moyen (par jour)
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <Chip>
                                    <span className="inline-flex items-center gap-1">
                                        <Sunrise className="h-3.5 w-3.5" /> Matin&nbsp;{fmtMinFromSec(averages?.m ?? 0)}
                                    </span>
                                </Chip>
                                <Chip>
                                    <span className="inline-flex items-center gap-1">
                                        <Sun className="h-3.5 w-3.5" /> Midi&nbsp;{fmtMinFromSec(averages?.n ?? 0)}
                                    </span>
                                </Chip>
                                <Chip>
                                    <span className="inline-flex items-center gap-1">
                                        <Moon className="h-3.5 w-3.5" /> Soir&nbsp;{fmtMinFromSec(averages?.e ?? 0)}
                                    </span>
                                </Chip>
                                <Chip>
                                    <span className="inline-flex items-center gap-1 font-semibold">
                                        <Calendar className="h-3.5 w-3.5" /> Total/j&nbsp;{fmtMinFromSec(averages?.t ?? 0)}
                                    </span>
                                </Chip>
                                {videoSec > 0 && (
                                    <Chip>
                                        <span className="inline-flex items-center gap-1">
                                            <PlayCircle className="h-3.5 w-3.5" /> Vidéo&nbsp;{fmtHours(videoSec)}
                                        </span>
                                    </Chip>
                                )}
                            </div>
                        </div>
                    </PaperCutCard>

                    <button
                        type="button"
                        onClick={onOpenYT}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-white shadow hover:bg-brand-700 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        aria-label="Voir l’aperçu vidéo"
                    >
                        <PlayCircle className="h-5 w-5" aria-hidden />
                        Voir l’aperçu
                    </button>
                </div>

                {/* Teaser (poster visible, cohérent visuel) */}
                <div className="mb-12">
                    <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                        <div className="relative aspect-video w-full bg-black">
                            <button
                                type="button"
                                onClick={onOpenYT}
                                className="group relative grid h-full w-full place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                                aria-label="Lire l’aperçu vidéo"
                            >
                                <Image
                                    src={posterSrc ?? '/images/sample-poster.webp'}
                                    alt="Aperçu vidéo — ambiance du programme"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                                <span className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/90 backdrop-blur ring-1 ring-brand-200 shadow-md transition group-hover:scale-105">
                                    <PlayCircle className="h-8 w-8 text-brand-800" aria-hidden />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline (cards relookées) */}
                <div className="relative">
                    <ol className="mt-6 grid grid-cols-1 auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map((c, i) => {
                            const indexBadge =
                                c.kind === 'day'
                                    ? `${i + 1}`.padStart(2, '0')
                                    : c.title.startsWith('Semaine')
                                    ? `S${i + 1}`
                                    : c.title.startsWith('Acte')
                                    ? ['I', 'II', 'III'][i] ?? `${i + 1}`
                                    : c.title.startsWith('Bloc')
                                    ? `B${i + 1}`
                                    : `${i + 1}`;

                            return (
                                <li key={c.id} className="h-full">
                                    <PaperCutCard className="h-full p-4 flex flex-col">
                                        {/* badge index “paper-cut” */}
                                        <div className="absolute -left-2 -top-2">
                                            <span className="inline-grid h-8 w-8 place-items-center rounded-xl bg-white/95 ring-1 ring-brand-100 shadow text-[11px] font-semibold text-brand-800">
                                                {indexBadge}
                                            </span>
                                        </div>

                                        <div className="flex items-start justify-between">
                                            <h3 className="pr-2 font-medium leading-snug">{c.title}</h3>
                                            <Chip>Total&nbsp;{fmtMinFromSec(c.totalSec)}</Chip>
                                        </div>

                                        {/* sous-titre TOUJOURS rendu pour réserver la hauteur */}
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{c.subtitle ?? '\u00A0'}</p>

                                        {/* spacer => colle les barres en bas */}
                                        <div className="mt-auto pt-3">
                                            <BarTriplet mSec={c.mSec} nSec={c.nSec} eSec={c.eSec} />
                                        </div>
                                    </PaperCutCard>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>

            {/* Modal YouTube (no-cookie) */}
            {openYT && (
                <div role="dialog" aria-modal="true" aria-label="Aperçu vidéo" className="fixed inset-0 z-[200] grid place-items-center p-4" onClick={() => setOpenYT(false)}>
                    <div className="absolute inset-0 bg-black/55 backdrop-blur" />
                    <div className="relative z-[201] w-full max-w-3xl rounded-2xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-base font-semibold">Aperçu d’un jour</h3>
                            <button
                                type="button"
                                onClick={() => setOpenYT(false)}
                                className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-secondary-700 hover:bg-secondary-50"
                                aria-label="Fermer la vidéo"
                            >
                                <X className="h-4 w-4" aria-hidden />
                                Fermer
                            </button>
                        </div>
                        <div className="mt-3 relative w-full overflow-hidden rounded-xl">
                            <div className="relative aspect-video">
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${youtubeId ?? '3moPCb5lIdw'}?rel=0&modestbranding=1&playsinline=1&controls=1&autoplay=1`}
                                    title="Teaser d’un jour"
                                    className="absolute inset-0 h-full w-full"
                                    loading="lazy"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SectionShell>
    );
}
