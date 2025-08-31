// src/app/(learner)/components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Play, NotebookPen, FolderOpen, LifeBuoy } from 'lucide-react';

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: Item[] = [
    { href: '/member', label: 'Accueil', icon: Home },
    { href: '/continue', label: 'Continuer', icon: Play },
    { href: '/notes', label: 'Notes', icon: NotebookPen },
    { href: '/library', label: 'Ressources', icon: FolderOpen },
    { href: '/help', label: 'Aide', icon: LifeBuoy },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden"
            role="navigation"
            aria-label="Navigation apprenant"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <ul className="mx-auto grid max-w-2xl grid-cols-5">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || (href !== '/member' && pathname?.startsWith(href));
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                className={[
                                    'flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                                    active ? 'text-indigo-700' : 'text-slate-700 hover:text-slate-900',
                                ].join(' ')}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon className={['h-5 w-5', active ? 'stroke-[2.2]' : 'stroke-[1.8]'].join(' ')} />
                                <span>{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
