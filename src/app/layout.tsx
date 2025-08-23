// src/app/layout.tsx
import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
    title: 'Ancre-toi',
    description: 'RESET-7, BOUSSOLE-10, ANCRE-30, ALCHIMIE-90',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true, 'max-snippet': -1, 'max-image-preview': 'none', 'max-video-preview': -1 },
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#6B4F93' },
        { media: '(prefers-color-scheme: light)', color: '#815FB2' },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
            <body className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
                {/* Lien d’évitement (a11y) */}
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 z-[100] rounded-lg bg-brand-600 px-3 py-2 text-sm text-white shadow">
                    Aller au contenu
                </a>

                {/* Header en verre dépoli */}
                <Suspense fallback={<div className="border-b border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">Chargement…</div>}>
                    <Header />
                </Suspense>

                {/* Contenu principal */}
                <main id="main" className="flex-1 mx-auto w-full max-w-7xl">
                    <Suspense fallback={<div className="text-sm text-secondary-700">Chargement…</div>}>{children}</Suspense>
                </main>

                {/* Footer doux (sauge) */}
                <footer className="border-t border-secondary-100 bg-secondary-50/50 py-8 text-sm text-secondary-800">
                    <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-4">
                        <Link className="transition-colors hover:text-secondary-900" href="/legal">
                            Mentions légales
                        </Link>
                        <Link className="transition-colors hover:text-secondary-900" href="/privacy">
                            Confidentialité
                        </Link>
                        <Link className="transition-colors hover:text-secondary-900" href="/cookies">
                            Cookies
                        </Link>
                    </div>
                    <div className="mx-auto mt-6 h-px max-w-6xl bg-gold-100/70" />
                    <div className="mx-auto max-w-6xl px-4 pt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} Ancre-toi — Tous droits réservés.</div>
                </footer>
            </body>
        </html>
    );
}
