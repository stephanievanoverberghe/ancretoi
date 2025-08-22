import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4">
            <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Erreur 404</p>
                <h1 className="mt-2 text-3xl font-semibold">Page introuvable</h1>
                <p className="mt-2 text-muted-foreground">Le lien est peut-être incorrect ou la page a été déplacée.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/" className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700">
                        Retour à l’accueil
                    </Link>
                    <Link href="/programs" className="rounded-lg border border-border px-4 py-2">
                        Voir les programmes
                    </Link>
                    <Link href="/aide" className="rounded-lg border border-border px-4 py-2">
                        Centre d’aide
                    </Link>
                </div>
            </div>
        </main>
    );
}
