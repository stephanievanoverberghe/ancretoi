import Link from 'next/link';

export default function NotFound() {
    return (
        <section className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4">
            <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Erreur 404</p>
                <h1 className="mt-2 text-3xl font-semibold">Page introuvable</h1>
                <p className="mt-2 text-muted-foreground">Le lien est peut-être incorrect ou la page a été déplacée.</p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {/* Primaire */}
                    <Link
                        href="/"
                        className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                        Retour à l’accueil
                    </Link>

                    {/* Secondaires */}
                    <Link
                        href="/programs"
                        className="rounded-lg border border-border bg-card px-4 py-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                        Voir les programmes
                    </Link>

                    <Link
                        href="/help"
                        className="rounded-lg border border-border bg-card px-4 py-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                        Centre d’aide
                    </Link>
                </div>
            </div>
        </section>
    );
}
