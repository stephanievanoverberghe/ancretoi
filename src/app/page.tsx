export default function Home() {
    return (
        <section className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-5">
                <h1 className="text-4xl font-semibold leading-tight">Des rituels guidés pour t’ancrer au quotidien.</h1>
                <p className="text-lg text-neutral-600">RESET-7, BOUSSOLE-10, ANCRE-30, ALCHIMIE-90 — 10–15 min par jour, vidéos sous-titres, bilans exportables.</p>
                <div className="flex gap-3">
                    <a href="/programs/reset-7" className="rounded-lg bg-black px-4 py-2 text-white">
                        Commencer RESET-7
                    </a>
                    <a href="/programs" className="rounded-lg border px-4 py-2">
                        Voir les programmes
                    </a>
                </div>
            </div>
            <div className="rounded-2xl border p-4">
                <div className="aspect-video w-full rounded-xl bg-neutral-100 grid place-items-center">Aperçu player (placeholder)</div>
            </div>
        </section>
    );
}
