// src/components/sections/home/LeadMagnet.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Props = {
    title?: string;
    subtitle?: string;
    imageSrc?: string;
    placeholder?: string;
    ctaLabel?: string;
    privacyHref?: string;
};

export default function LeadMagnet({
    title = 'Ressource gratuite — inspiration de la semaine',
    subtitle = 'Reçois un mini-rituel et une inspiration douce chaque semaine. Simple, tenable, apaisant.',
    imageSrc = '/images/lead-still-life.jpg',
    placeholder = 'Ton email',
    ctaLabel = 'Recevoir l’inspiration',
    privacyHref = '/privacy',
}: Props) {
    const sectionRef = useRef<HTMLElement>(null);
    const [email, setEmail] = useState('');
    const [botField, setBotField] = useState(''); // honeypot
    const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const track = useCallback((name: string, props?: Record<string, unknown>) => {
        if (typeof window === 'undefined') return;
        window.plausible?.(name, props ? { props } : undefined);
        window.posthog?.capture?.(name, props);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('lead_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (botField) return;

        if (!validateEmail(email)) {
            setErrorMsg('Entre une adresse email valide.');
            return;
        }

        setStatus('loading');
        track('lead_submit');

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'lead_magnet_home' }),
            });

            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error || 'Une erreur est survenue.');
            }

            setStatus('ok');
            track('lead_success', { email_domain: email.split('@')[1] || '' });
        } catch (err) {
            setStatus('error');
            setErrorMsg((err as Error).message || 'Impossible de t’inscrire pour le moment.');
            track('lead_error');
        }
    }

    return (
        <section ref={sectionRef} id="newsletter" aria-labelledby="lead-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/50 py-16 sm:py-20 lg:py-24">
            {/* filets or haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="lead-title" className="font-serif text-[clamp(1.35rem,3.6vw,1.9rem)] leading-tight">
                        {title}
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{subtitle}</p>
                </header>

                {/* Carte + image décorative */}
                <div className="grid gap-6 md:grid-cols-5 md:gap-8">
                    {/* Form card */}
                    <div className="md:col-span-3">
                        <div className="rounded-2xl border border-brand-100/70 bg-white/90 backdrop-blur-[2px] ring-1 ring-white/60 shadow-[0_8px_24px_rgb(0_0_0/0.06)] p-4 sm:p-6">
                            {status !== 'ok' ? (
                                <form onSubmit={onSubmit} className="space-y-4">
                                    {/* Honeypot */}
                                    <div className="hidden" aria-hidden>
                                        <label>
                                            Ne pas remplir
                                            <input type="text" tabIndex={-1} autoComplete="off" value={botField} onChange={(e) => setBotField(e.target.value)} />
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="mb-1 block text-sm font-medium">Adresse email</span>
                                        <input
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            required
                                            className="w-full rounded-xl border border-secondary-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
                                            placeholder={placeholder}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </label>

                                    {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

                                    <button type="submit" className="btn w-full sm:w-auto" disabled={status === 'loading'} aria-busy={status === 'loading'}>
                                        {status === 'loading' ? 'Envoi…' : ctaLabel}
                                    </button>

                                    <p className="text-xs text-muted-foreground">
                                        Zéro spam, désinscription en 1 clic. En soumettant ce formulaire, tu acceptes notre{' '}
                                        <Link href={privacyHref} className="underline underline-offset-2 hover:text-foreground">
                                            politique de confidentialité
                                        </Link>
                                        .
                                    </p>
                                </form>
                            ) : (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-brand-50 ring-1 ring-brand-200 grid place-items-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80" aria-hidden>
                                            <path d="M20 7L9 18l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h3 className="font-serif text-lg">C’est noté 🌿</h3>
                                    <p className="mt-1 text-sm text-secondary-800">Regarde ta boîte mail — et pense au dossier “Promotions/Spam” au cas où.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decorative image (3:2) */}
                    <div className="md:col-span-2">
                        <figure className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                            <Image
                                src={imageSrc}
                                alt="Lettre crème, cachet cire or, brin de sauge — esthétique douce"
                                fill
                                sizes="(max-width: 768px) 92vw, 40vw"
                                className="object-cover"
                                loading="lazy"
                            />
                        </figure>
                    </div>
                </div>
            </div>
        </section>
    );
}
