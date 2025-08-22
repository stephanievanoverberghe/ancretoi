import Link from 'next/link';

export default function AdminNotFound() {
    return (
        <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4">
            <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Admin</p>
                <h1 className="mt-2 text-3xl font-semibold">Page introuvable</h1>
                <p className="mt-2 text-muted-foreground">Vérifie l’URL ou retourne au tableau de bord admin.</p>
                <div className="mt-6 flex justify-center">
                    <Link href="/admin" className="rounded-lg border border-border px-4 py-2">
                        Tableau de bord
                    </Link>
                </div>
            </div>
        </main>
    );
}
