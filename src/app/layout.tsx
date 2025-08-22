import './globals.css';
import Link from 'next/link';
import { Inter, Playfair_Display } from 'next/font/google';
import ThemeToggle from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/Logout';

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
                <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                        <Link href="/" className="font-serif text-xl">
                            Ancre-toi
                        </Link>
                        <nav className="flex items-center gap-4 text-sm">
                            <Link href="/programs">Programmes</Link>
                            <Link href="/help">Aide</Link>
                            <ThemeToggle />
                            <Link href="/login" className="rounded-lg bg-brand px-3 py-1.5 text-white">
                                Se connecter
                            </Link>
                            <Link href="/logout">
                                <LogoutButton />
                            </Link>
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

                <footer className="border-t border-border py-8 text-sm text-neutral-500">
                    <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-4">
                        <Link href="/mentions-legales">Mentions légales</Link>
                        <Link href="/confidentialite">Confidentialité</Link>
                        <Link href="/cookies">Cookies</Link>
                    </div>
                </footer>
            </body>
        </html>
    );
}
