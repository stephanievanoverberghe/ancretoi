import Link from 'next/link';

export default function MemberNotFound() {
    return (
        <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4">
            <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Espace membre</p>
                <h1 className="mt-2 text-3xl font-semibold">Section introuvable</h1>
                <p className="mt-2 text-muted-foreground">Cette leçon n’existe pas ou n’est pas encore disponible.</p>
                <div className="mt-6 flex justify-center">
                    <Link href="/app" className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700">
                        Revenir au tableau de bord
                    </Link>
                </div>
            </div>
        </main>
    );
}
