// src/app/layout.tsx
import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
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
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            'max-snippet': -1,
            'max-image-preview': 'none',
            'max-video-preview': -1,
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`h-full ${inter.variable} ${playfair.variable}`}>
            {/* ✅ min-h-screen + flex-col + main.flex-1 = footer collé en bas quand peu de contenu */}
            <body className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
                <Suspense fallback={<div className="border-b border-border px-4 py-3 text-sm text-neutral-500">Chargement…</div>}>
                    <Header />
                </Suspense>

                <main id="main" className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>{children}</Suspense>
                </main>

                <footer className="border-t border-border py-8 text-sm text-neutral-500">
                    <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-4">
                        <Link href="/legal">Mentions légales</Link>
                        <Link href="/privacy">Confidentialité</Link>
                        <Link href="/cookies">Cookies</Link>
                    </div>
                </footer>
            </body>
        </html>
    );
}
