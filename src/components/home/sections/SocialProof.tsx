'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, Sparkles } from 'lucide-react';

type Props = {
    items?: string[];
};

const ICONS = [Lock, ShieldCheck, Sparkles];

export default function SocialProof({ items = ['Paiement sécurisé (Stripe)', 'Données privées — RGPD, aucune revente', 'Rituels courts et progressifs, sans pression'] }: Props) {
    const sectionRef = useRef<HTMLElement>(null);

    const track = useCallback((name: string) => {
        if (typeof window !== 'undefined' && window.plausible) window.plausible(name);
        if (typeof window !== 'undefined' && window.posthog) window.posthog.capture(name);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        let seen = false;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !seen) {
                    seen = true;
                    track('socialproof_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);

        let ioNext: IntersectionObserver | null = null;
        const next = document.getElementById('programmes');
        if (next) {
            ioNext = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting) {
                        track('socialproof_scroll_next');
                        ioNext?.disconnect();
                    }
                },
                { threshold: 0.3 }
            );
            ioNext.observe(next);
        }

        return () => {
            io.disconnect();
            ioNext?.disconnect();
        };
    }, [track]);

    return (
        <section
            id="social-proof"
            ref={sectionRef}
            aria-labelledby="social-proof-title"
            className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24"
        >
            {/* Fond papier zen */}
            <div className="absolute inset-0 -z-10" aria-hidden="true">
                <Image src="/images/texture-soft.webp" alt="" fill sizes="100vw" className="object-cover opacity-45" priority={false} />
                <div className="absolute inset-0 bg-secondary-50/70" />
                <div className="absolute inset-x-0 top-0 h-px bg-gold-100/80" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gold-100/80" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <h2 id="social-proof-title" className="text-center font-serif tracking-tight text-[clamp(1.1rem,3.5vw,1.6rem)] text-brand-800">
                    Confiance & sérénité — développement personnel guidé
                </h2>

                <ul className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-stretch gap-5 md:gap-7">
                    {items.map((text, i) => {
                        const Icon = ICONS[i % ICONS.length];
                        return (
                            <li
                                key={i}
                                className="h-full rounded-3xl border border-brand-100/60 bg-white/75 backdrop-blur-[2px] shadow-[0_1px_8px_rgb(0_0_0/0.04)] px-6 py-6 sm:py-7 grid grid-cols-[3rem_1fr] items-center gap-4 md:flex md:flex-col md:items-center md:justify-start md:text-center md:gap-3 lg:flex-row lg:items-center lg:justify-center lg:text-left lg:gap-4"
                            >
                                {/* Icône */}
                                <span
                                    className="inline-grid place-items-center h-12 w-12 aspect-square shrink-0 rounded-full bg-gold-50 ring-1 ring-gold-200 justify-self-start md:justify-self-auto md:self-center"
                                    aria-hidden="true"
                                >
                                    <Icon className="h-5 w-5 text-gold-700" />
                                </span>

                                {/* Texte */}
                                <p className="text-[15px] sm:text-base leading-relaxed text-brand-900 col-start-2 md:col-start-auto md:mt-2 lg:mt-0">{text}</p>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
