'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import LogoutButton from './Logout';

function initialFrom(name?: string | null, email?: string | null) {
    const src = (name || email || '').trim();
    return src ? src[0]!.toUpperCase() : '•';
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="navlink focusable">
            {children}
        </Link>
    );
}

export default function HeaderClient({ isAuthed, email, displayName, isAdmin }: { isAuthed: boolean; email: string | null; displayName: string | null; isAdmin?: boolean }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    const avatarInitial = initialFrom(displayName, email);

    // Refs strictes
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const firstItemRef = useRef<HTMLAnchorElement>(null);

    // Fermer le popover au clic extérieur + ESC
    useEffect(() => {
        if (!userOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (menuRef.current?.contains(t)) return;
            if (btnRef.current?.contains(t)) return;
            setUserOpen(false);
        };
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setUserOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onEsc);
        };
    }, [userOpen]);

    // Focus premier item à l’ouverture
    useEffect(() => {
        if (userOpen) firstItemRef.current?.focus();
    }, [userOpen]);

    // Drawer mobile : bloque scroll + ESC
    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('keydown', onEsc);
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    return (
        <header className="header-glass sticky top-0 z-50 border-b border-border" role="banner">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 rounded bg-brand px-3 py-1.5 text-white">
                Passer au contenu
            </a>

            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-serif text-xl">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-white">A</span>
                    <span>Ancre-toi</span>
                </Link>

                {/* Desktop nav (≥ md) */}
                <nav className="hidden items-center gap-3 text-sm md:flex" aria-label="Navigation principale">
                    <NavLink href="/programs">Programmes</NavLink>
                    <NavLink href="/blog">Blog</NavLink>
                    <NavLink href="/inspirations">Inspiration</NavLink>

                    {isAuthed ? (
                        <>
                            <NavLink href="/app">Mon espace</NavLink>

                            {/* Popover "Compte" */}
                            <div className="relative inline-block">
                                <button
                                    ref={btnRef}
                                    type="button"
                                    className="focusable inline-flex items-center justify-center rounded-full p-1"
                                    aria-haspopup="menu"
                                    aria-expanded={userOpen}
                                    aria-controls="account-menu"
                                    onClick={() => setUserOpen((v) => !v)}
                                >
                                    <span className="account-avatar  cursor-pointer" aria-hidden>
                                        {avatarInitial}
                                    </span>
                                    <span className="sr-only">Ouvrir le menu du compte</span>
                                </button>

                                {userOpen && (
                                    <div ref={menuRef} id="account-menu" role="menu" aria-label="Menu du compte" className="account-pop">
                                        <div className="account-head">
                                            <span className="account-avatar" aria-hidden>
                                                {avatarInitial}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="account-name truncate">{displayName ?? email}</p>
                                                {displayName && <p className="account-email truncate">{email}</p>}
                                            </div>
                                        </div>

                                        {/* Items du menu utilisateur */}
                                        <Link href="/app/settings" role="menuitem" ref={firstItemRef} className="account-item focusable" onClick={() => setUserOpen(false)}>
                                            Paramètres
                                        </Link>

                                        <Link href="/help" role="menuitem" className="account-item focusable" onClick={() => setUserOpen(false)}>
                                            Aide
                                        </Link>
                                        {isAdmin && (
                                            <Link href="/admin" className="account-item focusable">
                                                Admin
                                            </Link>
                                        )}

                                        <hr className="account-divider" />
                                        <div className="px-1 py-1">
                                            <LogoutButton />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/register" className="navlink focusable border border-border bg-card">
                                S’inscrire
                            </Link>
                            <Link href="/login" className="navlink focusable" style={{ background: 'var(--brand-600)', color: 'var(--brand-on)' }}>
                                Se connecter
                            </Link>
                        </>
                    )}
                </nav>

                {/* Burger (< md) */}
                <button
                    type="button"
                    aria-label="Ouvrir le menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen(true)}
                    className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card focusable"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="opacity-80">
                        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Overlay + Drawer mobile (seulement < md) */}
            <div
                onClick={() => setMobileOpen(false)}
                className={`fixed inset-0 z-[60] bg-black/30 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-hidden
            />
            <aside
                className={`fixed right-0 top-0 z-[61] h-dvh w-[86%] max-w-xs border-l border-border bg-card shadow-2xl transition-transform duration-200 md:hidden ${
                    mobileOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu mobile"
            >
                <div className="flex items-center justify-between border-b border-border p-4">
                    <span className="font-serif text-lg">Menu</span>
                    <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="focusable rounded-lg border border-border p-2">
                        ✕
                    </button>
                </div>

                <div className="p-3">
                    {isAuthed ? (
                        <>
                            <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted p-3">
                                <span className="account-avatar" aria-hidden>
                                    {avatarInitial}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{displayName ?? email}</p>
                                    {displayName && <p className="truncate text-xs text-muted-foreground">{email}</p>}
                                </div>
                            </div>

                            <nav className="flex flex-col gap-2">
                                <Link href="/programs" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Programmes
                                </Link>
                                <Link href="/blog" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Blog
                                </Link>
                                <Link href="/inspirations" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Inspiration
                                </Link>
                                <Link href="/app" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Mon espace
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                        Admin
                                    </Link>
                                )}
                                <Link href="/app/settings" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Paramètres
                                </Link>
                                <Link href="/help" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Aide
                                </Link>
                                <div className="pt-1">
                                    <LogoutButton />
                                </div>
                            </nav>
                        </>
                    ) : (
                        <>
                            <nav className="flex flex-col gap-2">
                                <Link href="/programs" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Programmes
                                </Link>
                                <Link href="/blog" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Blog
                                </Link>
                                <Link href="/inspirations" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Inspiration
                                </Link>
                                <Link href="/help" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-card px-4 py-3 text-[15px] hover:bg-brand-50">
                                    Aide
                                </Link>
                            </nav>

                            <div className="mt-4 grid grid-cols-1 gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full rounded-xl bg-brand px-4 py-3 text-center text-[15px] font-medium text-white hover:bg-brand-700"
                                >
                                    Se connecter
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-[15px] font-medium hover:bg-brand-50"
                                >
                                    S’inscrire
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </header>
    );
}
