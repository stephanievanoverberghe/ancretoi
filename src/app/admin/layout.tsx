import 'server-only';
import { ReactNode } from 'react';
import { requireAdmin } from '@/lib/authz';
import AdminShell from '@/components/admin/AdminShell';
import { Home, BookOpen, Newspaper, Users, Mail, Boxes } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type NavItem = { href: string; label: string; icon: React.ReactNode };

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // 🔐 garde globale : seul l’admin accède à tout ce sous-arbre
    await requireAdmin();

    const nav: NavItem[] = [
        { href: '/admin', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
        { href: '/admin/programs', label: 'Programmes', icon: <Boxes className="h-4 w-4" /> },
        { href: '/admin/newsletter', label: 'Newsletter', icon: <Mail className="h-4 w-4" /> },
        { href: '/admin/blog', label: 'Blog', icon: <Newspaper className="h-4 w-4" /> },
        { href: '/admin/inspirations', label: 'Inspirations', icon: <BookOpen className="h-4 w-4" /> },
        { href: '/admin/users', label: 'Utilisateurs', icon: <Users className="h-4 w-4" /> },
    ];

    return <AdminShell nav={nav}>{children}</AdminShell>;
}
