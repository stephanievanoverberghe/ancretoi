export default function R7D01Morning() {
    return (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">RESET-7 · Jour 1 · Matin</h1>
                <div className="aspect-video w-full rounded-xl border grid place-items-center">Player (placeholder)</div>
                <section className="rounded-xl border p-4">
                    <h2 className="font-semibold mb-2">Exercice</h2>
                    <p className="text-sm text-neutral-600 mb-2">Pose ton intention du jour.</p>
                    <textarea className="w-full min-h-32 rounded-lg border p-2" placeholder="Mon intention…" />
                    <div className="mt-3 flex justify-end">
                        <a className="rounded-lg bg-black px-4 py-2 text-white" href="/app/r7/d01/midi">
                            Étape suivante → Midi
                        </a>
                    </div>
                </section>
            </div>
            <aside className="space-y-3">
                <div className="rounded-xl border p-3">
                    <h3 className="font-semibold">Chapitres</h3>
                    <ol className="list-decimal pl-5 text-sm">
                        <li>Intro & intention</li>
                        <li>Respiration</li>
                        <li>Pratique guidée</li>
                    </ol>
                </div>
                <div className="rounded-xl border p-3">
                    <h3 className="font-semibold">Ressources</h3>
                    <ul className="list-disc pl-5 text-sm">
                        <li>Transcript (PDF)</li>
                        <li>Fiche d’exercice</li>
                    </ul>
                </div>
            </aside>
        </div>
    );
}
