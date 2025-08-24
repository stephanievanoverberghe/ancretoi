// src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer role="contentinfo" className="bg-white text-foreground border-t border-gold-100">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-12">
                {/* mini-CTA */}
                <div className="mb-10 rounded-2xl border border-brand-100 bg-brand-50/70 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-serif text-[clamp(1.1rem,3.2vw,1.35rem)] leading-tight">Une dose d’inspiration douce chaque semaine</h3>
                            <p className="mt-1 text-[15px] text-secondary-800">Mini-rituel, respiration, rappel d’intention. Simple, tenable, apaisant.</p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/#newsletter" className="btn">
                                Recevoir l’inspiration
                            </Link>
                            <Link
                                href="/programs"
                                className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-[15px] transition hover:bg-brand-50"
                            >
                                Voir les programmes
                            </Link>
                        </div>
                    </div>
                </div>

                {/* grille */}
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <Link href="/" className="group inline-flex items-center gap-2 font-serif text-xl">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-[12px] font-bold text-white shadow-sm ring-1 ring-brand-400/40">
                                A
                            </span>
                            <span className="tracking-tight">
                                Ancre-toi
                                <span className="ml-2 inline-block align-middle">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-300 opacity-90 transition-opacity group-hover:opacity-100" />
                                </span>
                            </span>
                        </Link>

                        <p className="mt-3 max-w-prose text-[15px] text-secondary-800">
                            Des parcours guidés pour revenir au corps, au souffle et à l’essentiel.
                            <br className="hidden sm:block" />
                            Une pratique qui tient dans la vraie vie.
                        </p>

                        <nav aria-label="Réseaux sociaux" className="mt-4 flex items-center gap-3">
                            <a
                                href="https://instagram.com/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                    <path
                                        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm6.5-.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </a>
                            <a
                                href="https://youtube.com/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="YouTube"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                    <path
                                        d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.7 12 4.7 12 4.7s-5.6 0-7.5.4A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1C6.4 19.3 12 19.3 12 19.3s5.6 0 7.5-.4a3 3 0 0 0 2.1-2.1c.3-1.9.4-3.8.4-4.8 0-1-.1-2.9-.4-4.8ZM10 15.2V8.8l5.2 3.2L10 15.2Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </a>
                            <a
                                href="/contact"
                                aria-label="Contact"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                    <path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <path d="M22 6 12 13 2 6" fill="none" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </a>
                        </nav>
                    </div>

                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <nav aria-labelledby="nav-programmes">
                            <h4 id="nav-programmes" className="text-sm font-semibold text-brand-800">
                                Parcours
                            </h4>
                            <ul className="mt-3 space-y-2 text-[15px] text-secondary-800">
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/programs">
                                        Tous les programmes
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/methode">
                                        Notre méthode
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/member">
                                        Mon espace
                                    </Link>
                                </li>
                            </ul>
                        </nav>

                        <nav aria-labelledby="nav-ressources">
                            <h4 id="nav-ressources" className="text-sm font-semibold text-brand-800">
                                Ressources
                            </h4>
                            <ul className="mt-3 space-y-2 text-[15px] text-secondary-800">
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/blog">
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/inspirations">
                                        Inspirations
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/help">
                                        Aide
                                    </Link>
                                </li>
                            </ul>
                        </nav>

                        <nav aria-labelledby="nav-compte" className="col-span-2 sm:col-span-1">
                            <h4 id="nav-compte" className="text-sm font-semibold text-brand-800">
                                Compte
                            </h4>
                            <ul className="mt-3 space-y-2 text-[15px] text-secondary-800">
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/login">
                                        Se connecter
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/register">
                                        Créer un compte
                                    </Link>
                                </li>
                                <li>
                                    <Link className="block rounded-lg px-1 py-1 transition hover:bg-brand-50" href="/#newsletter">
                                        Newsletter
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="mt-10 h-px w-full bg-gold-100/80" aria-hidden />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">© {year} Ancre-toi — Tous droits réservés.</div>
                    <nav className="flex flex-wrap gap-4 text-[10px] text-secondary-800">
                        <Link className="transition hover:text-secondary-900" href="/legal">
                            Mentions légales
                        </Link>
                        <Link className="transition hover:text-secondary-900" href="/privacy">
                            Confidentialité
                        </Link>
                        <Link className="transition hover:text-secondary-900" href="/cookies/preferences">
                            Gérer les cookies
                        </Link>
                        <Link className="transition hover:text-secondary-900" href="/terms">
                            CGU
                        </Link>
                        <Link className="transition hover:text-secondary-900" href="/cgv">
                            CGV
                        </Link>
                        <Link className="transition hover:text-secondary-900" href="/retractation">
                            Retractation
                        </Link>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
