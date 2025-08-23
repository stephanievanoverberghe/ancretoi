import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="space-y-16">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-card p-8 sm:p-12">
                <div className="mx-auto max-w-5xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                        Nouveau • Plateforme Ancre-toi
                    </div>
                    <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">(Re)trouve ta clarté, ton énergie et ta direction.</h1>
                    <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                        Des parcours guidés, structurés et progressifs : <strong>RESET-7</strong>, <strong>BOUSSOLE-10</strong>, <strong>ANCRE-30</strong>,{' '}
                        <strong>ALCHIMIE-90</strong>.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/register" className="button">
                            Commencer gratuitement
                        </Link>
                        <Link href="/programs" className="button secondary">
                            Découvrir les programmes
                        </Link>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {[
                            { k: 'Guidé', v: 'scripts & minuteries' },
                            { k: 'Progression', v: 'suivi jour par jour' },
                            { k: 'Respect RGPD', v: 'données en Europe' },
                        ].map((i) => (
                            <div key={i.k} className="card p-4">
                                <p className="text-sm text-muted-foreground">{i.k}</p>
                                <p className="mt-1 font-medium">{i.v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Programmes */}
            <section className="mx-auto max-w-5xl">
                <h2 className="font-serif text-3xl">Programmes</h2>
                <p className="mt-1 text-muted-foreground">Choisis le format qui t’aide maintenant.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { slug: 'reset-7', title: 'RESET-7', desc: '7 jours pour repartir sereine.' },
                        { slug: 'boussole-10', title: 'BOUSSOLE-10', desc: '10 étapes pour clarifier la direction.' },
                        { slug: 'ancre-30', title: 'ANCRE-30', desc: '30 jours d’ancrage et d’habitudes.' },
                        { slug: 'alchimie-90', title: 'ALCHIMIE-90', desc: '90 jours d’approfondissement.' },
                    ].map((p) => (
                        <article key={p.slug} className="card p-4">
                            <h3 className="text-lg font-semibold">{p.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                            <Link className="mt-3 inline-block underline" href={`/app/programs/${p.slug}`}>
                                Voir le parcours
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            {/* Comment ça marche */}
            <section className="mx-auto max-w-5xl">
                <h2 className="font-serif text-3xl">Comment ça marche</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                        { n: '01', t: 'Crée ton compte', d: 'Inscription simple. Tes données restent privées.' },
                        { n: '02', t: 'Suis le plan', d: 'Des étapes claires Matin / Midi / Soir, avec scripts.' },
                        { n: '03', t: 'Mesure & ajuste', d: 'Progression, récap J7/J30/J90 et exports.' },
                    ].map((s) => (
                        <div key={s.n} className="card p-5">
                            <div className="text-sm text-brand font-semibold">{s.n}</div>
                            <h3 className="mt-1 font-medium">{s.t}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bénéfices */}
            <section className="mx-auto max-w-5xl">
                <h2 className="font-serif text-3xl">Ce que tu gagnes</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                        'Clarté d’objectifs et priorités',
                        'Routines simples et durables',
                        'Gestion émotionnelle (R.A.I.N., etc.)',
                        'Relations & limites plus saines',
                        'Vision et plan d’action concrets',
                        'Exports PDF/JSON de tes bilans',
                    ].map((b) => (
                        <li key={b} className="card p-4">
                            {b}
                        </li>
                    ))}
                </ul>
            </section>

            {/* CTA final */}
            <section className="relative overflow-hidden rounded-2xl bg-card p-8 text-center sm:p-12">
                <h2 className="font-serif text-3xl">Prête à t’ancrer ?</h2>
                <p className="mt-2 text-muted-foreground">Rejoins l’espace membre et lance RESET-7 aujourd’hui.</p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/register" className="button">
                        Créer mon compte
                    </Link>
                    <Link href="/login" className="button secondary">
                        J’ai déjà un compte
                    </Link>
                </div>
            </section>
        </div>
    );
}
