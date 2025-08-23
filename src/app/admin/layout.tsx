import { requireAdmin } from '@/lib/authz';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();
    return (
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
            <h1 className="mb-4 font-serif text-3xl">Admin</h1>
            <nav className="mb-6 flex flex-wrap gap-2 text-sm">
                <Link className="navlink" href="/admin">
                    Tableau de bord
                </Link>
                <Link className="navlink" href="/admin/programs">
                    Parcours
                </Link>
                <Link className="navlink" href="/admin/blog">
                    Articles
                </Link>
                <Link className="navlink" href="/admin/inspirations">
                    Inspirations
                </Link>
                <Link className="navlink" href="/admin/users">
                    Utilisateurs
                </Link>
            </nav>
            {children}
        </div>
    );
}
