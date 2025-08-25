import './globals.css';
import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: 'Ancre-toi', template: '%s — Ancre-toi' },
    description: 'RESET-7, BOUSSOLE-10, ANCRE-30, ALCHIMIE-90',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false, noimageindex: true, 'max-snippet': -1, 'max-image-preview': 'none', 'max-video-preview': -1 },
    },
    openGraph: { siteName: 'Ancre-toi', type: 'website', locale: 'fr_FR' },
    twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#6B4F93' },
        { media: '(prefers-color-scheme: light)', color: '#815FB2' },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${inter.variable} ${playfair.variable} h-full`}>
            <body className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
                {/* Skip link */}
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 z-[100] rounded-lg bg-brand-600 px-3 py-2 text-sm text-white shadow">
                    Aller au contenu
                </a>

                <Suspense fallback={<div className="border-b border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">Chargement…</div>}>
                    <Header />
                </Suspense>

                <main id="main" className="flex-1 mx-auto w-full max-w-7xl">
                    <Suspense fallback={<div className="text-sm text-secondary-700">Chargement…</div>}>{children}</Suspense>
                </main>

                <Footer />
            </body>
        </html>
    );
}
