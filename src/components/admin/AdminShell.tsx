'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

type NavItem = {
    href: string;
    label: string;
    icon?: React.ReactNode;
};

type Props = {
    nav: NavItem[];
    children: React.ReactNode;
};

export default function AdminShell({ nav, children }: Props) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = useCallback((href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href)), [pathname]);

    const topTitle = useMemo(() => {
        const current = nav.find((n) => isActive(n.href));
        return current?.label ?? 'Administration';
    }, [nav, isActive]);

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {/* --- Background décoratif (subtil) --- */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
                <Image src="/images/texture-soft.webp" alt="" fill sizes="100vw" className="object-cover opacity-45" priority={false} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(109,40,217,0.10),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(109,40,217,0.10),transparent_45%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
            </div>

            {/* Topbar */}
            <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button aria-label="Ouvrir le menu" className="lg:hidden rounded-md p-2 hover:bg-white/60 transition" onClick={() => setOpen(true)}>
                            <Menu className="h-5 w-5 text-brand-700" />
                        </button>

                        <Link href="/admin" className="group inline-flex items-center gap-2 rounded-lg px-2 py-1" aria-label="Accueil admin">
                            <Image src="/images/logo.png" alt="Ancre-toi — logo" width={35} height={35} priority={false} className="rounded-md p-1" />
                            <span className="tracking-tight">– Admin</span>
                            {/* pastille à côté du logo quand on est sur /admin */}
                            <span
                                className={[
                                    'ml-2 h-1.5 w-1.5 rounded-full bg-gold-300 transition-opacity',
                                    isActive('/admin') ? 'opacity-100' : 'opacity-0 group-focus-visible:opacity-100',
                                ].join(' ')}
                                aria-hidden
                            />
                        </Link>

                        <span className="hidden sm:inline-block text-sm text-muted-foreground pl-3">{topTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-800 ring-1 ring-gold-200 shadow-sm">
                            Accès admin
                        </span>
                    </div>
                </div>
            </header>

            {/* Layout */}
            <div className="mx-auto max-w-7xl">
                <div className="lg:grid lg:grid-cols-[260px_1fr]">
                    {/* Sidebar desktop */}
                    <aside className="relative hidden border-b border-brand-200 lg:block bg-white/70 backdrop-blur-sm">
                        <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-brand-200/70 via-brand-100/40 to-transparent" />
                        <nav className="sticky top-14 p-3">
                            <ul className="space-y-1">
                                {nav.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                aria-current={active ? 'page' : undefined}
                                                className={[
                                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ring-1',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
                                                    active
                                                        ? 'bg-brand-600 text-white ring-brand-100 shadow-sm'
                                                        : // 🟡 hover gold
                                                          'text-muted-foreground ring-transparent hover:bg-brand-100 hover:text-brand-900',
                                                ].join(' ')}
                                            >
                                                {/* icône */}
                                                <span
                                                    className={[
                                                        'inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 transition',
                                                        active
                                                            ? 'bg-white text-brand-700 ring-brand-200'
                                                            : // 🟡 hover gold
                                                              'bg-white text-muted-foreground ring-muted/50 group-hover:text-gold-800 group-hover:ring-gold-200',
                                                    ].join(' ')}
                                                >
                                                    {item.icon}
                                                </span>

                                                <span className="font-medium">{item.label}</span>

                                                {/* • point jaune à DROITE (active / focus / hover) */}
                                                <span
                                                    aria-hidden
                                                    className={[
                                                        'ml-auto inline-block h-1.5 w-1.5 rounded-full bg-gold-300',
                                                        'transition-all duration-150',
                                                        active ? 'opacity-100 scale-100' : 'opacity-0 ',
                                                    ].join(' ')}
                                                />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </aside>

                    {/* Drawer mobile */}
                    {open && (
                        <div className="lg:hidden fixed inset-0 z-50">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                            <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
                                <div className="flex items-center justify-between h-14 px-3 border-b">
                                    <span className="font-medium">Navigation</span>
                                    <button aria-label="Fermer" className="rounded-md p-2 hover:bg-muted" onClick={() => setOpen(false)}>
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <nav className="p-3">
                                    <ul className="space-y-1">
                                        {nav.map((item) => {
                                            const active = isActive(item.href);
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setOpen(false)}
                                                        className={[
                                                            'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ring-1',
                                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
                                                            active
                                                                ? 'bg-brand-50/80 text-brand-800 ring-brand-100 shadow-sm'
                                                                : // 🟡 hover gold
                                                                  'text-muted-foreground ring-transparent hover:bg-gold-50 hover:text-gold-900 hover:ring-gold-200',
                                                        ].join(' ')}
                                                    >
                                                        <span
                                                            className={[
                                                                'inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 transition',
                                                                active
                                                                    ? 'bg-white text-brand-700 ring-brand-200'
                                                                    : // 🟡 hover gold
                                                                      'bg-white text-muted-foreground ring-muted/50 group-hover:text-gold-800 group-hover:ring-gold-200',
                                                            ].join(' ')}
                                                        >
                                                            {item.icon}
                                                        </span>
                                                        <span className="font-medium">{item.label}</span>

                                                        {/* • point jaune à DROITE (active / focus / hover) */}
                                                        <span
                                                            aria-hidden
                                                            className={[
                                                                'ml-auto inline-block h-1.5 w-1.5 rounded-full bg-gold-300 ring-2 ring-white',
                                                                'transition-all duration-150',
                                                                active
                                                                    ? 'opacity-100 scale-100'
                                                                    : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100',
                                                            ].join(' ')}
                                                        />
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <main className="min-h-[calc(100vh-56px)] bg-transparent">
                        <div className="px-4 sm:px-6 md:px-8 py-8">
                            <div className="rounded-2xl border border-brand-200 bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-white/40">
                                <div className="p-5 sm:p-6 md:p-8">{children}</div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
