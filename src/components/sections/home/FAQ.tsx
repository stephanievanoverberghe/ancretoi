// src/components/sections/home/FAQ.tsx
import Link from 'next/link';

type FAQItem = { q: string; a: string };

const DEFAULT_ITEMS: FAQItem[] = [
    {
        q: 'Et si je manque un jour ?',
        a: 'Aucun problème. Tu reprends simplement là où tu t’es arrêté·e. Les cases cochées et notes restent enregistrées sur ton appareil pour t’aider à suivre sans culpabiliser.',
    },
    {
        q: 'Je débute, c’est pour moi ?',
        a: 'Oui. Les pratiques sont guidées, courtes et sans jargon. Tu avances à ton rythme, avec des alternatives proposées quand c’est utile.',
    },
    {
        q: 'Combien de temps par jour ?',
        a: 'Compter 10 à 20 minutes. Les blocs “Matin / Midi / Soir” sont modulables : tu peux n’en faire qu’un seul les jours chargés.',
    },
    {
        q: 'Faut-il du matériel particulier ?',
        a: 'Non. Un téléphone (ou ordinateur) et, si tu veux, un carnet pour écrire. Des écouteurs peuvent aider mais ne sont pas obligatoires.',
    },
    {
        q: 'C’est lié à une foi ou une religion ?',
        a: 'Non. L’approche est laïque et inclusive. Tu peux y apporter ta sensibilité personnelle, sans dogme ni obligation.',
    },
    {
        q: 'Puis-je suivre en parallèle d’un accompagnement médical/psy ?',
        a: 'Oui, en complément uniquement. Les contenus ne remplacent pas un avis médical. En cas de doute, parle-en à ton praticien.',
    },
    {
        q: 'Comment j’accède au programme ?',
        a: 'Depuis ton espace membre. Tout est en ligne, sans application à installer. Tu peux consulter depuis mobile, tablette ou ordinateur.',
    },
    {
        q: 'Remboursement & rétractation ?',
        a: 'Le droit de rétractation ne s’applique pas une fois l’accès au contenu numérique démarré. S’il y a un souci, écris-nous : nous cherchons toujours une solution honnête.',
    },
];

export default function FAQ({ items = DEFAULT_ITEMS }: { items?: FAQItem[] }) {
    return (
        <section id="faq" aria-labelledby="faq-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-16 sm:py-20 lg:py-24">
            {/* filets discrets en haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="faq-title" className="font-serif text-[clamp(1.35rem,3.6vw,1.9rem)] leading-tight">
                        FAQ — on répond aux questions clés
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                        Tu hésites encore&nbsp;? Ouvre les items ci-dessous, ou{' '}
                        <Link className="underline hover:no-underline" href="/help">
                            écris-nous
                        </Link>
                        .
                    </p>
                </header>

                <div className="mx-auto max-w-3xl space-y-3">
                    {items.map((it, i) => (
                        <details key={i} className="group rounded-xl border border-brand-100 bg-white p-4 open:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                                <h3 className="text-[15px] font-medium leading-snug">{it.q}</h3>
                                <span
                                    aria-hidden
                                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-100 text-brand-700 transition group-open:rotate-45"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </summary>
                            <div className="pt-3 text-[15px] leading-relaxed text-secondary-800">{it.a}</div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
