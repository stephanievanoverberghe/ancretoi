import Link from 'next/link';

export default function NotFound() {
    return (
        <section className="mx-auto grid min-h-[50vh] max-w-3xl place-items-center px-4">
            <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Article introuvable</p>
                <h1 className="mt-2 text-2xl font-semibold">Oups — ce billet n’existe pas</h1>
                <p className="mt-2 text-muted-foreground">Le lien est peut-être erroné ou l’article a été déplacé.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/blog" className="rounded-lg bg-brand-600 px-4 py-2 text-white transition hover:bg-brand-700">
                        Voir tous les articles
                    </Link>
                    <Link href="/" className="rounded-lg border border-border px-4 py-2 transition hover:bg-brand-50">
                        Retour à l’accueil
                    </Link>
                </div>
            </div>
        </section>
    );
}
