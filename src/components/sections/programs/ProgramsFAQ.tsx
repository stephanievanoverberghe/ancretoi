'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import faqDataRaw from '@/data/programs/faq/faq.json';

/* ---------- Analytics (typage strict) ---------- */
type FaqEvent = 'programs_faq_open' | 'programs_faq_conversion_assist';
type AnalyticsProps = Record<string, unknown>;
type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

function track(event: FaqEvent, props?: AnalyticsProps) {
    if (typeof window === 'undefined') return;
    if (props) window.plausible?.(event, { props });
    else window.plausible?.(event);
    window.posthog?.capture(event, props);
}

/* ---------- Types & normalisation JSON ---------- */
type FAQItem = { q: string; a: string };
type RawFaqItem = { q?: unknown; a?: unknown; question?: unknown; answer?: unknown };
type ObjWithArray =
    | { items?: unknown }
    | { rows?: unknown }
    | { faq?: unknown }
    | { faqs?: unknown }
    | { data?: unknown }
    | { list?: unknown }
    | { entries?: unknown }
    | Record<string, unknown>;

function coerceFaqItem(o: unknown): FAQItem | null {
    if (typeof o !== 'object' || o === null) return null;
    const r = o as RawFaqItem;
    const q = typeof r.q === 'string' ? r.q : typeof r.question === 'string' ? r.question : null;
    const a = typeof r.a === 'string' ? r.a : typeof r.answer === 'string' ? r.answer : null;
    return q && a ? { q, a } : null;
}

function extractArray(obj: ObjWithArray): unknown[] | null {
    const candidates = ['items', 'rows', 'faq', 'faqs', 'data', 'list', 'entries'] as const;
    for (const key of candidates) {
        const maybe = (obj as Record<string, unknown>)[key as string];
        if (Array.isArray(maybe)) return maybe;
    }
    return null;
}

function normalizeFaqData(input: unknown): FAQItem[] {
    // 1) Direct array
    if (Array.isArray(input)) {
        return input.map(coerceFaqItem).filter((x): x is FAQItem => x !== null);
    }
    // 2) Object with known array key
    if (typeof input === 'object' && input !== null) {
        const arr = extractArray(input as ObjWithArray);
        if (Array.isArray(arr)) {
            return arr.map(coerceFaqItem).filter((x): x is FAQItem => x !== null);
        }
    }
    return [];
}

/* ---------- Fallback (si JSON vide) ---------- */
const FALLBACK: FAQItem[] = [
    { q: 'Combien de temps par jour ?', a: 'Entre 10 et 35 minutes selon le parcours. Tu peux moduler selon tes journées.' },
    { q: 'Je débute, c’est pour moi ?', a: 'Oui. Les pratiques sont guidées et sans jargon. Tu avances à ton rythme.' },
    { q: 'Faut-il du matériel ?', a: 'Non. Un téléphone/ordi suffit. Un carnet peut aider si tu aimes écrire.' },
    { q: 'Et si je manque un jour ?', a: 'Tu reprends là où tu t’es arrêté·e. Pas de culpabilité, on avance simplement.' },
];

/* ---------- Composant ---------- */
export default function ProgramsFAQ() {
    const items = useMemo<FAQItem[]>(() => {
        const parsed = normalizeFaqData(faqDataRaw as unknown);
        if (parsed.length === 0 && process.env.NODE_ENV !== 'production') {
            // Petit log dev pour comprendre la forme reçue
            console.warn('[ProgramsFAQ] JSON non reconnu, fallback utilisé. Attendu: array de {q,a} ou objet {items|rows|faq|faqs|data|list|entries}. Reçu:', faqDataRaw);
        }
        return parsed.length > 0 ? parsed : FALLBACK;
    }, []);

    return (
        <section id="faq-programs" aria-labelledby="faq-programs-title" className="relative mx-[calc(50%-50vw)] w-screen bg-white py-16 sm:py-20 lg:py-24">
            {/* filets discrets en haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="faq-programs-title" className="font-serif text-[clamp(1.35rem,3.6vw,1.9rem)] leading-tight">
                        FAQ — on répond aux questions clés
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                        Tu hésites encore&nbsp;? Ouvre les items ci-dessous, ou{' '}
                        <Link className="underline hover:no-underline" href="/help">
                            écris-nous
                        </Link>
                        .
                    </p>
                </header>

                {/* Accordéons accessibles */}
                <div className="mx-auto max-w-3xl space-y-3">
                    {items.map((it, i) => (
                        <details
                            key={`${i}-${it.q}`}
                            className="group rounded-xl border border-brand-100 bg-white p-4 open:shadow-[0_8px_24px_rgb(0_0_0/0.06)]"
                            onToggle={(e) => {
                                const open = (e.currentTarget as HTMLDetailsElement).open;
                                if (open) track('programs_faq_open', { index: i, q: it.q });
                            }}
                        >
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                                <h3 className="text-[15px] font-medium leading-snug">{it.q}</h3>
                                <span
                                    aria-hidden
                                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-100 text-brand-700 transition group-open:rotate-45"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </summary>
                            <div className="pt-3 text-[15px] leading-relaxed text-secondary-800">{it.a}</div>
                        </details>
                    ))}
                </div>

                {/* CTA d’assistance à la conversion */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="#grid"
                        onClick={() => track('programs_faq_conversion_assist', { target: 'choose_program' })}
                        className="btn w-full sm:w-auto justify-center"
                        aria-label="Choisir mon programme"
                    >
                        Choisir mon programme
                    </Link>
                    <Link
                        href="/methode"
                        onClick={() => track('programs_faq_conversion_assist', { target: 'understand_method' })}
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-brand-200 px-4 py-2.5 text-brand text-[15px] sm:text-sm transition hover:bg-brand-50 hover:text-foreground"
                        aria-label="Comprendre la méthode"
                    >
                        Comprendre la méthode
                    </Link>
                </div>
            </div>
        </section>
    );
}
