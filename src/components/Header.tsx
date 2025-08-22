import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import LogoutButton from './Logout';
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

type NameOnly = { name?: string | null };

export default async function Header() {
    const sess = await getSession();
    let displayName: string | null = null;

    if (sess?.email) {
        await dbConnect();
        const u = await UserModel.findOne({ email: sess.email }).select({ name: 1, _id: 0 }).lean<NameOnly>().exec();
        displayName = u?.name ?? null;
    }

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <Link href="/" className="font-serif text-xl">
                    Ancre-toi
                </Link>

                <nav className="flex items-center gap-3 text-sm">
                    <Link href="/programs">Programmes</Link>
                    <Link href="/help">Aide</Link>
                    <ThemeToggle />

                    {sess?.email ? (
                        <>
                            <Link href="/app" className="rounded-lg border border-border px-3 py-1.5">
                                Mon espace
                            </Link>
                            <Link href="/app/profile" className="hidden sm:inline rounded-lg border border-border px-3 py-1.5">
                                {displayName ? `Profil (${displayName})` : 'Profil'}
                            </Link>
                            {/* Pas de <Link> autour : le bouton fait l'appel POST et redirige */}
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/register" className="rounded-lg border border-border px-3 py-1.5">
                                S’inscrire
                            </Link>
                            <Link href="/login" className="rounded-lg bg-brand px-3 py-1.5 text-white">
                                Se connecter
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
