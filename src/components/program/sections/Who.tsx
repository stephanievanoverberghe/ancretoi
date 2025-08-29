// components/program/sections/Who.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Target, Gauge, Timer } from 'lucide-react';
import Image from 'next/image';

import type { Program } from '@/lib/programs-index';
import { track } from '@/lib/analytics.client';

type Props = { program: Program };

/* ---------- UI: icône “paper-cut” ---------- */
function PaperCutIcon({ Icon, title }: { Icon: LucideIcon; title: string }) {
    return (
        <div className="relative inline-grid h-12 w-12 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="sr-only">{title}</span>
            <Icon className="absolute h-7 w-7 translate-x-[0.5px] translate-y-[0.5px] text-brand-700/25" strokeWidth={2.2} aria-hidden />
            <Icon className="relative h-7 w-7 text-brand-700/65" strokeWidth={1.9} aria-hidden />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </div>
    );
}

const ICONS: LucideIcon[] = [Target, Gauge, Timer];

export default function Who({ program }: Props) {
    const ref = useRef<HTMLElement | null>(null);
    const viewed = useRef(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || viewed.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!viewed.current && e.isIntersecting && e.intersectionRatio >= 0.4) {
                        viewed.current = true;
                        track('program_detail_who_view', { slug: program.slug });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.4, 1] }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [program.slug]);

    const bullets = buildBulletsFromIndex(program);
    const outcomesLine = buildOutcomesLine(program);
    if (bullets.length === 0 && !outcomesLine) return null;

    return (
        <section ref={ref} id="program-who" aria-labelledby="who-title" className="relative mx-[calc(50%-50vw)] z-10 w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            {/* Fond papier zen */}
            <div className="absolute inset-0 -z-10" aria-hidden="true">
                <Image src="/images/texture-soft.webp" alt="" fill sizes="100vw" className="object-cover opacity-45" priority={false} />
                <div className="absolute inset-0 bg-secondary-50/70" />
                <div className="absolute inset-x-0 top-0 h-px bg-gold-100/80" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gold-100/80" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="who-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        À qui s’adresse ce programme
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Identification rapide pour savoir si c’est pour toi.</p>
                </header>

                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {bullets.map((text, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        const title = i === 0 ? 'Cible' : i === 1 ? 'Objectif' : 'Rythme';
                        return (
                            <li key={i}>
                                <article className="group relative h-full rounded-2xl border border-brand-100/60 bg-white/80 backdrop-blur-[2px] px-4 py-4 sm:px-5 sm:py-5 shadow-[0_1px_10px_rgb(0_0_0/0.05)] transition hover:bg-white hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                                    <div className="flex items-start gap-4">
                                        <PaperCutIcon Icon={Icon} title={title} />
                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-semibold text-foreground">Idéal si…</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                                        </div>
                                    </div>
                                </article>
                            </li>
                        );
                    })}
                </ul>

                {outcomesLine && (
                    <p className="mt-6 text-sm text-muted-foreground text-center">
                        <strong>Résultats typiques :</strong> {outcomesLine}
                    </p>
                )}
            </div>
        </section>
    );
}

/* ---------- Helpers (index.json only) ---------- */

function buildBulletsFromIndex(program: Program): string[] {
    const out: string[] = [];

    const who = (program.detail?.who ?? '').trim();
    const whoRephrased = rephraseWho(who);
    if (whoRephrased) out.push(`tu ${whoRephrased}`);

    const goals = program.detail?.goals ?? [];
    for (const g of goals.slice(0, 2)) {
        out.push(`tu veux ${lowerFirst(trimPunct(g))}`);
    }

    if (out.length < 3) {
        const includes = program.detail?.includes ?? [];
        for (const inc of includes) {
            out.push(normalizeInclude(inc));
            if (out.length >= 3) break;
        }
    }
    if (out.length < 3) {
        const outcomes = program.detail?.outcomes ?? [];
        for (const oc of outcomes) {
            out.push(`tu vises ${lowerFirst(trimPunct(oc))}`);
            if (out.length >= 3) break;
        }
    }

    return Array.from(new Set(out.map((s) => s.replace(/\s+/g, ' ').trim()))).slice(0, 3);
}

function buildOutcomesLine(program: Program): string | null {
    const outcomes = program.detail?.outcomes ?? [];
    if (!outcomes.length) return null;
    return outcomes.slice(0, 3).map(trimPunct).join(' · ');
}

/** Ex.: "Pour celles qui veulent ..." → "veux ..." ; gère infinitifs & GN ("une mue ...") */
function rephraseWho(who: string): string {
    let t = who
        .replace(/^\s*pour\s+(celles?|ceux?|les)\s+qui\s*/i, '')
        .replace(/^\s*pour\s+/i, '')
        .trim();
    t = trimPunct(t);
    if (!t) return '';

    // enlève un éventuel "tu " déjà présent
    t = t.replace(/^\s*tu\s+/i, '').trimStart();

    // normalise pour démarrer avec un verbe au "tu"
    t = normalizeVerbForTu(t);

    // nettoyage
    return t.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
}

/**
 * Règles:
 * - Si ça commence par un verbe à l'infinitif → "veux <verbe> ..."
 * - Si ça commence par un GN (un/une/le/la/les/… ) → "cherches <GN> ..."
 * - Cas spéciaux (3e personne pluriel, “ont besoin de”, etc.)
 */
function normalizeVerbForTu(s: string): string {
    // cas spéciaux (3e pers. pluriel en tête)
    const pluralRules: Array<[RegExp, string]> = [
        [/^veulent\b/i, 'veux'],
        [/^souhaitent\b/i, 'souhaites'],
        [/^cherchent\b/i, 'cherches'],
        [/^recherchent\b/i, 'recherches'],
        [/^désirent\b/i, 'désires'],
        [/^aimeraient\b/i, 'aimerais'],
        [/^voudraient\b/i, 'voudrais'],
        [/^ont besoin de\b/i, 'as besoin de'],
        [/^ont envie de\b/i, 'as envie de'],
        [/^ont\b/i, 'as'],
        [/^vivent\b/i, 'vis'],
    ];
    for (const [rgx, rep] of pluralRules) {
        if (rgx.test(s)) return s.replace(rgx, rep);
    }

    // infinitif générique: se + verbe, verbes en -er / -ir / -re / -oir (+ cas être/avoir)
    const isInfinitive = /^(?:se\s+)?[a-zàâçéèêëîïôûùüÿœ'-]+(?:er|ir|re|oir)\b/i.test(s) || /^(?:être|avoir)\b/i.test(s);
    if (isInfinitive) return `veux ${s}`;

    // tournures nominales / GN
    if (/^(?:un|une|des|du|de la|de l’|de l'|d’|d'|l’|l'|la|le|les)\b/i.test(s)) {
        return `cherches ${s}`;
    }

    // “plus de …”
    if (/^plus\s+de\b/i.test(s)) return `veux ${s}`;

    return s;
}

function normalizeInclude(inc: string): string {
    const s = inc.toLowerCase();
    if (s.includes('matin') || s.includes('midi') || s.includes('soir')) {
        return 'tu veux un cadre guidé (matin • midi • soir)';
    }
    if (s.includes('journal')) return 'tu veux écrire facilement (journal intégré)';
    if (s.includes('exercice') || s.includes('exercices')) return 'tu préfères des pas à pas clairs';
    return `tu veux ${lowerFirst(trimPunct(inc))}`;
}

function lowerFirst(str: string): string {
    return str.length ? str[0].toLowerCase() + str.slice(1) : str;
}

function trimPunct(s: string): string {
    return s.replace(/[.。!?…]\s*$/u, '').trim();
}
