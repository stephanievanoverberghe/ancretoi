import Link from 'next/link';

export const metadata = {
    title: 'Désinscription confirmée',
    description: 'Tu as bien été désinscrit(e) de la newsletter.',
};

export default function Page() {
    return (
        <section className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-20 sm:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                    <div className="px-5 py-6 sm:px-6 sm:py-7">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-200">
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="opacity-90">
                                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h1 className="font-serif text-xl leading-tight">Désinscription confirmée</h1>
                        <p className="mt-2 text-[15px] text-secondary-800">Tu ne recevras plus nos emails. Tu peux te réinscrire quand tu veux.</p>
                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <Link href="/#newsletter" className="btn w-full sm:w-auto">
                                Se réinscrire
                            </Link>
                            <Link
                                href="/"
                                className="w-full sm:w-auto rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-center text-[15px] transition hover:bg-secondary-50"
                            >
                                Retour à l’accueil
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
