'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { AudioLines, FileText, Sparkles, BookOpen, Infinity, RefreshCcw } from 'lucide-react';

/* ---------- Analytics ---------- */
type InsideEvent = 'programs_inside_view';
type AnalyticsProps = Record<string, unknown>;
type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

function track(event: InsideEvent, props?: AnalyticsProps) {
    if (typeof window === 'undefined') return;
    if (props) window.plausible?.(event, { props });
    else window.plausible?.(event);
    window.posthog?.capture(event, props);
}

/* ---------- Données ---------- */
type ItemKey = 'audio' | 'pdf' | 'ritual' | 'journal' | 'lifetime' | 'refresh';
type Item = { icon: ItemKey; label: string };

const DEFAULT_ITEMS: Item[] = [
    { icon: 'audio', label: 'Audios guidés' },
    { icon: 'pdf', label: 'Fiches PDF' },
    { icon: 'ritual', label: 'Rituels courts' },
    { icon: 'journal', label: 'Journal intégré' },
    { icon: 'lifetime', label: 'Accès à vie' },
    { icon: 'refresh', label: 'Mises à jour' },
];

/* ---------- Mappage Lucide ---------- */
const ICONS: Record<ItemKey, LucideIcon> = {
    audio: AudioLines,
    pdf: FileText,
    ritual: Sparkles,
    journal: BookOpen,
    lifetime: Infinity,
    refresh: RefreshCcw,
};

/* ---------- Paper-cut wrapper ---------- */
function PaperCutIcon({ Icon, title }: { Icon: LucideIcon; title: string }) {
    return (
        <div className="relative inline-grid h-12 w-12 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="sr-only">{title}</span>
            {/* couche ombre (papier dessous) */}
            <Icon className="absolute h-7 w-7 translate-x-[0.5px] translate-y-[0.5px] text-brand-700/25" strokeWidth={2.2} aria-hidden />
            {/* couche principale (papier dessus) */}
            <Icon className="relative h-7 w-7 text-brand-700/65" strokeWidth={1.9} aria-hidden />
            {/* vernis soft */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </div>
    );
}

/* ---------- Section ---------- */
type Props = {
    title?: string;
    subtitle?: string;
    items?: Item[];
    /** chemin public vers l’image de texture, ex: "/images/texture-soft.webp" */
    bgImageSrc?: string;
};

export default function Inside({
    title = 'Ce que tu reçois',
    subtitle = 'Le nécessaire, bien packagé — pour avancer sans te perdre.',
    items = DEFAULT_ITEMS,
    bgImageSrc = '/images/texture-soft.webp',
}: Props) {
    const sectionRef = useRef<HTMLElement | null>(null);
    const sent = useRef(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el || sent.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.5 && !sent.current) {
                        sent.current = true;
                        track('programs_inside_view', { section: 'inside' });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.5, 1] }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <section ref={sectionRef} id="inside" aria-labelledby="inside-title" className="relative mx-[calc(50%-50vw)] bg-white w-screen py-14 sm:py-18">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                {/* Card avec texture en arrière-plan */}
                <div className="relative overflow-hidden rounded-2xl border z-10 border-brand-100 p-6 sm:p-8">
                    {/* IMAGE DE FOND */}
                    <Image
                        src={bgImageSrc}
                        alt=""
                        fill
                        sizes="100vw"
                        priority={false}
                        aria-hidden
                        className="pointer-events-none select-none absolute inset-0 -z-10 object-cover opacity-[0.38] mix-blend-multiply"
                    />
                    {/* voile pour lisibilité */}
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-white/35" aria-hidden />

                    {/* Header */}
                    <header className="mb-6 sm:mb-8 text-center">
                        <h2 id="inside-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                            {title}
                        </h2>
                        {subtitle && <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{subtitle}</p>}
                    </header>

                    {/* Grid items */}
                    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
                        {items.map((it) => {
                            const Icon = ICONS[it.icon];
                            return (
                                <li key={it.icon} className="group flex flex-col items-center text-center">
                                    <PaperCutIcon Icon={Icon} title={it.label} />
                                    <span className="mt-2.5 text-sm font-medium text-foreground">{it.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
