// src/app/newsletter/error/page.tsx
import Link from 'next/link';

export const metadata = {
    title: 'Erreur d’inscription',
    description: 'Impossible de confirmer ton adresse email.',
};

type SP = { code?: string };

const messages: Record<string, { title: string; body: string }> = {
    invalid_token: {
        title: 'Lien invalide ou déjà utilisé',
        body: 'Ce lien de confirmation n’est plus valide. Demande un nouveau lien et réessaie.',
    },
    expired: {
        title: 'Lien expiré',
        body: 'Le lien de confirmation a expiré. Demande un nouveau lien pour terminer l’inscription.',
    },
    invalid_unsub: {
        title: 'Lien de désinscription invalide',
        body: 'Impossible de te désinscrire avec ce lien. Demande un nouveau lien depuis un email récent.',
    },
};

export default async function Page({ searchParams }: { searchParams?: Promise<SP> }) {
    const sp = (await searchParams) ?? {};
    const code = sp.code ?? 'invalid_token';
    const msg = messages[code] ?? {
        title: 'Oups, une erreur est survenue',
        body: 'Impossible de confirmer ton adresse pour le moment.',
    };

    return (
        <section className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-20 sm:py-24">
            {/* filets or */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                    <div className="px-5 py-6 sm:px-6 sm:py-7">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-200 text-brand-700">
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="opacity-90">
                                <path
                                    d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <h1 className="font-serif text-xl leading-tight">{msg.title}</h1>
                        <p className="mt-2 text-[15px] text-secondary-800">{msg.body}</p>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <Link href="/#newsletter" className="btn w-full sm:w-auto">
                                Demander un nouveau lien
                            </Link>
                            <Link
                                href="/"
                                className="w-full sm:w-auto rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-center text-[15px] transition hover:bg-secondary-50"
                            >
                                Retour à l’accueil
                            </Link>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            Besoin d’aide ?{' '}
                            <Link className="underline hover:no-underline" href="/help">
                                Contacte-nous
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
