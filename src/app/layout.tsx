// src/app/layout.tsx
import './globals.css';
import { Suspense } from 'react';
import Link from 'next/link';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata = {
    title: 'Ancre-toi',
    description: 'RESET-7, BOUSSOLE-10, ANCRE-30, ALCHIMIE-90',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
            <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
                {/* Si Header est un client component qui lit l’URL, on le protège aussi */}
                <Suspense fallback={<div className="border-b border-border px-4 py-3 text-sm text-neutral-500">Chargement…</div>}>
                    <Header />
                </Suspense>

                <main className="mx-auto max-w-6xl px-4 py-8">
                    {/* 💡 Ce Suspense protège toutes les pages qui appellent useSearchParams/usePathname/useRouter */}
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
