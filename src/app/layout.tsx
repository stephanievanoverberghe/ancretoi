import './globals.css';
import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const isProd = process.env.NODE_ENV === 'production';
// Désactiver l’indexation (preview, staging, etc.), mettre NEXT_PUBLIC_INDEX=false
const allowIndex = (process.env.NEXT_PUBLIC_INDEX ?? (isProd ? 'true' : 'false')) === 'true';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),

    applicationName: 'Ancre-toi',
    title: {
        default: 'Ancre-toi',
        template: '%s | Ancre-toi',
    },

    description: 'Rituels courts (10–20 min/j) pour te recentrer et tenir dans le temps : RESET-7, BOUSSOLE-10, ANCRAGE-30, ALCHIMIE-90. Accès à vie.',
    keywords: [
        'rituels courts',
        'respiration 4-6',
        'gestion du stress',
        'ancrage',
        'journal intégré',
        'habitudes tenables',
        'RESET-7',
        'BOUSSOLE-10',
        'ANCRAGE-30',
        'ALCHIMIE-90',
        'programmes bien-être',
        'routine quotidienne',
    ],

    authors: [{ name: 'Stéphanie', url: 'https://ancretoi.vercel.app/' }],
    creator: 'Stéphanie',
    publisher: 'Ancre-toi',

    alternates: {
        canonical: '/',
    },

    robots: {
        index: allowIndex,
        follow: allowIndex,
        nocache: !allowIndex,
        googleBot: {
            index: allowIndex,
            follow: allowIndex,
            noimageindex: !allowIndex,
            'max-snippet': allowIndex ? -1 : 0,
            'max-image-preview': allowIndex ? ('large' as const) : 'none',
            'max-video-preview': allowIndex ? -1 : 0,
        },
    },

    openGraph: {
        title: 'Ancre-toi',
        description: 'Rituels courts (10–20 min/j) pour te recentrer et tenir dans le temps : RESET-7, BOUSSOLE-10, ANCRAGE-30, ALCHIMIE-90. Accès à vie.',
        url: '/',
        siteName: 'Ancre-toi',
        images: [
            {
                url: '/images/og-default.png',
                width: 1200,
                height: 630,
                alt: 'Ancre-toi — Rituels courts, respiration, journal intégré',
            },
        ],
        type: 'website',
        locale: 'fr_FR',
    },

    twitter: {
        card: 'summary_large_image',
        title: 'Ancre-toi',
        description: 'Rituels courts (10–20 min/j) pour te recentrer et tenir dans le temps. Accès à vie.',
        images: ['/images/og-default.jpg'],
    },

    icons: {
        icon: '/favicon.ico',
        // apple: '/apple-touch-icon.png',
    },

    formatDetection: {
        telephone: false,
        address: false,
        email: false,
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
