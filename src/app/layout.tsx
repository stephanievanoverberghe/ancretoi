import './globals.css';
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
                <Header />
                <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
                <footer className="border-t border-border py-8 text-sm text-neutral-500">
                    <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-4">
                        <a href="/legal">Mentions légales</a>
                        <a href="/privacy">Confidentialité</a>
                        <a href="/cookies">Cookies</a>
                    </div>
                </footer>
            </body>
        </html>
    );
}
