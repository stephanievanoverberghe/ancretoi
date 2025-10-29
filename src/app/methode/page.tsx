// src/app/methode/page.tsx
import Image from 'next/image';
import Link from 'next/link';

/**
 * Page "Méthode" — version premium full-bleed + TOC sticky + timeline + FAQ
 * Hypothèses:
 * - Tailwind actif (palette brand/gold/secondary déjà définie chez toi)
 * - Images présentes sous /public/images/method/...
 */

export default function MethodePage() {
    const baseAnchors = [
        { id: 'ancrage', label: 'Ancrage' },
        { id: 'boussole', label: 'Boussole' },
        { id: 'alchimie', label: 'Alchimie' },
        { id: 'process', label: 'Le processus' },
        { id: 'faq', label: 'FAQ' },
    ];

    return (
        <main className="pb-24">
            {/* ===== HERO FULL-BLEED ===== */}
            <section className="relative isolate w-screen left-1/2 right-1/2 -mx-[50vw] border-b border-brand-200" aria-labelledby="method-hero">
                {/* Background image */}
                <div
                    aria-hidden
                    className="absolute inset-0 -z-10"
                    style={{
                        backgroundImage: 'url(/images/method/hero-methode.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'saturate(104%) contrast(102%)',
                    }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/92 via-white/70 to-white/20" />
                <div className="absolute inset-0 -z-10 bg-brand-50/30 mix-blend-soft-light" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gold-200/80" />

                {/* Content */}
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                    <div className="max-w-3xl">
                        <h1 id="method-hero" className="font-serif text-[clamp(2rem,5.5vw,3rem)] leading-tight tracking-tight">
                            Méthode Serenity
                        </h1>
                        <p className="mt-3 text-[15px] sm:text-base text-brand-900/90">
                            Une approche simple, incarnée, <span className="font-medium text-foreground">profondément vivante</span> : <span className="font-medium">Ancrage</span>,{' '}
                            <span className="font-medium">Boussole</span>, <span className="font-medium">Alchimie</span>.
                        </p>

                        {/* anchors quick links */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {baseAnchors.map((a) => (
                                <a key={a.id} href={`#${a.id}`} className="rounded-full border border-brand-100 bg-white/70 px-3 py-1.5 text-sm text-brand-900 hover:bg-white">
                                    # {a.label}
                                </a>
                            ))}
                        </div>

                        {/* CTA primary */}
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link href="/programs" className="btn w-full sm:w-auto justify-center" aria-label="Voir les programmes guidés">
                                Commencer en douceur
                            </Link>
                            <a
                                href="#process"
                                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-secondary-600 px-4 py-3.5 text-white text-[15px] sm:text-sm transition-colors hover:bg-secondary-700"
                            >
                                Voir le processus
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONTENT WITH STICKY TOC ===== */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
                <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* Sticky TOC */}
                    <aside className="hidden lg:block">
                        <nav aria-label="Sommaire méthode" className="sticky top-24 rounded-2xl border border-brand-100 bg-white/70 p-4 backdrop-blur-sm">
                            <p className="mb-2 text-[13px] font-medium text-brand-900/80">Sur cette page</p>
                            <ul className="space-y-1 text-[14px]">
                                {baseAnchors.map((a) => (
                                    <li key={a.id}>
                                        <a href={`#${a.id}`} className="block rounded-md px-2 py-1.5 text-brand-800 hover:bg-brand-50">
                                            {a.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    {/* MAIN */}
                    <div>
                        {/* INTRO courte */}
                        <section className="mb-8">
                            <p className="text-[15px] leading-relaxed text-muted-foreground">
                                La méthode Serenity n’est pas un protocole figé : c’est une <span className="text-foreground font-medium">façon d’habiter ton axe</span>, de
                                t’écouter avec honnêteté et d’agir en cohérence. Trois piliers, un même souffle.
                            </p>
                        </section>

                        {/* ===== PILIERS ===== */}
                        <Pillar
                            id="ancrage"
                            title="Ancrage"
                            description="Revenir au corps, poser des racines dans le quotidien. Ralentir, respirer, remettre l’axe en place pour des décisions plus claires."
                            items={['Rituel respiration 4-6 & présence', 'Hygiène douce (sommeil, lumière, mouvement)', 'Journal court : corps / cœur / tête']}
                            image="/images/method/pillar-ancrage.webp"
                            alt="Silhouette racines/pieds stylisés en papier, sauge et lilas, lumière douce"
                            reverse={false}
                        />

                        <Pillar
                            id="boussole"
                            title="Boussole"
                            description="Clarifier ce qui compte vraiment : valeurs, besoins, limites saines. Avancer en cohérence plutôt qu’en pilotage automatique."
                            items={['Carte perso : valeurs → décisions', 'Limites dites sans culpabilité', 'Check-in quotidien aligné']}
                            image="/images/method/pillar-boussole.webp"
                            alt="Rose des vents minimaliste en papier, améthyste et or discret"
                            reverse={true}
                        />

                        <Pillar
                            id="alchimie"
                            title="Alchimie"
                            description="Transformer avec douceur. Intégrer ce qui bloque, faire circuler, transmuter pour un axe vivant et durable."
                            items={['Exercices d’intégration émotionnelle', 'Vision concrète à 3–12 mois', 'Premiers pas visibles et tenables']}
                            image="/images/method/pillar-alchimie.webp"
                            alt="Spirale/flux en papier évoquant la transformation, améthyste vers or"
                            reverse={false}
                            last
                        />

                        {/* ===== BÉNÉFICES ===== */}
                        <section className="mt-10 border-t border-gold-100/60 pt-8">
                            <h2 className="font-serif text-2xl leading-snug">Ce que tu vas ressentir</h2>
                            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { t: 'Plus d’oxygène intérieur', d: 'Le mental ralentit, le corps respire, les choix s’éclaircissent.' },
                                    { t: 'Un axe concret', d: 'Des rituels simples, enracinés dans la vraie vie.' },
                                    { t: 'De la cohérence', d: 'Dire oui/non sans culpabilité, avancer en paix.' },
                                    { t: 'De la stabilité', d: 'Un cadre doux pour accueillir les vagues émotionnelles.' },
                                    { t: 'De la puissance', d: 'Retrouver l’élan d’agir et de créer.' },
                                    { t: 'De la tendresse', d: 'Se parler avec justesse, sans dureté inutile.' },
                                ].map((b) => (
                                    <li key={b.t} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                                        <p className="font-medium">{b.t}</p>
                                        <p className="mt-1 text-[14px] text-muted-foreground">{b.d}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* ===== PROCESS / TIMELINE ===== */}
                        <section id="process" className="mt-12 border-t border-gold-100/60 pt-8">
                            <h2 className="font-serif text-2xl leading-snug">Le processus</h2>

                            <ol className="relative mt-6 space-y-8">
                                <TimelineStep
                                    number="01"
                                    title="Ancrage"
                                    text="On calme l’intérieur et on pose des racines dans le quotidien : respiration 4-6, check doux du corps, micro-rituels tenables."
                                />
                                <TimelineStep
                                    number="02"
                                    title="Boussole"
                                    text="On clarifie ce qui compte et on le traduit en décisions concrètes : valeurs → limites → actions réalistes."
                                />
                                <TimelineStep
                                    number="03"
                                    title="Alchimie"
                                    text="On intègre ce qui bloque, on transforme avec douceur et on installe une vision tangible sur 3–12 mois."
                                    last
                                />
                            </ol>

                            <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50/40 p-5">
                                <p className="text-[15px] text-brand-900">
                                    Tu veux l’expérimenter tout de suite ?{' '}
                                    <Link href="/programs" className="underline hover:text-brand-700">
                                        Découvre les programmes guidés
                                    </Link>{' '}
                                    et laisse-toi porter pas à pas.
                                </p>
                            </div>
                        </section>

                        {/* ===== FAQ (details/summary, pas de JS) ===== */}
                        {/* ===== FAQ — même design que la home (full-bleed) ===== */}
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

                                {/* mêmes questions/réponses que ta page Méthode */}
                                <div className="mx-auto max-w-3xl space-y-3">
                                    <details className="group rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm open:bg-white open:shadow-[0_10px_28px_rgb(28_35_48/0.08)] transition-shadow">
                                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-lg px-1 py-1">
                                            <h3 className="text-[15px] font-medium leading-snug">Combien de temps faut-il pour sentir un changement ?</h3>
                                            <span
                                                aria-hidden
                                                className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-100 text-brand-700 transition-transform group-open:rotate-45"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                        </summary>
                                        <div className="pt-3 text-[15px] leading-relaxed text-secondary-800">
                                            Dès la première semaine si tu respectes des micro-rituels simples. L’objectif n’est pas la performance, mais la régularité douce.
                                        </div>
                                    </details>

                                    <details className="group rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm open:bg-white open:shadow-[0_10px_28px_rgb(28_35_48/0.08)] transition-shadow">
                                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-lg px-1 py-1">
                                            <h3 className="text-[15px] font-medium leading-snug">Est-ce compatible avec un emploi du temps chargé ?</h3>
                                            <span
                                                aria-hidden
                                                className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-100 text-brand-700 transition-transform group-open:rotate-45"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                        </summary>
                                        <div className="pt-3 text-[15px] leading-relaxed text-secondary-800">
                                            Oui. La méthode est pensée pour le réel : formats courts, ajustables, et des exercices modulables en 5–15 minutes.
                                        </div>
                                    </details>

                                    <details className="group rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm open:bg-white open:shadow-[0_10px_28px_rgb(28_35_48/0.08)] transition-shadow">
                                        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-lg px-1 py-1">
                                            <h3 className="text-[15px] font-medium leading-snug">Dois-je tout faire dans l’ordre ?</h3>
                                            <span
                                                aria-hidden
                                                className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-100 text-brand-700 transition-transform group-open:rotate-45"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                        </summary>
                                        <div className="pt-3 text-[15px] leading-relaxed text-secondary-800">
                                            Le fil logique existe (Ancrage → Boussole → Alchimie), mais tu peux piocher selon tes besoins. Les programmes t’accompagnent étape par
                                            étape.
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </section>

                        {/* ===== CTA ===== */}
                        <section className="mt-12 border-t border-gold-100/60 pt-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <p className="text-[15px] text-muted-foreground">Prête à essayer ? Choisis un programme et on avance ensemble.</p>
                                <Link href="/programs" className="btn" aria-label="Voir les programmes guidés">
                                    Voir les programmes
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* JSON-LD (SEO) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'CreativeWork',
                        name: 'Méthode Serenity',
                        description: 'Approche simple et incarnée : Ancrage, Boussole, Alchimie. Respiration, clarté, transformation.',
                        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/methode`,
                        about: ['Ancrage', 'Boussole', 'Alchimie'],
                    }),
                }}
            />
        </main>
    );
}

/* ===================== Sub-components ===================== */

function Pillar({
    id,
    title,
    description,
    items,
    image,
    alt,
    reverse,
    last,
}: {
    id: string;
    title: string;
    description: string;
    items: string[];
    image: string;
    alt: string;
    reverse?: boolean;
    last?: boolean;
}) {
    return (
        <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-28 py-8 sm:py-10 ${last ? '' : 'border-b border-gold-100/60'}`}>
            <div className={`grid gap-6 md:grid-cols-2 md:items-center ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div>
                    <h2 id={`${id}-title`} className="font-serif text-2xl leading-snug">
                        {title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-brand-900">{description}</p>
                    <ul className="mt-4 space-y-2 text-[14px]">
                        {items.map((li) => (
                            <li key={li}>• {li}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-brand-100">
                        <Image src={image} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority={id === 'ancrage'} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function TimelineStep({ number, title, text, last }: { number: string; title: string; text: string; last?: boolean }) {
    return (
        <li className="relative pl-12">
            {/* Ligne verticale */}
            {!last && <span className="absolute left-[19px] top-8 h-[calc(100%-2rem)] w-px bg-brand-200" aria-hidden />}

            {/* Pastille */}
            <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-brand-200 bg-white font-semibold shadow-sm">{number}</span>

            <div className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{text}</p>
            </div>
        </li>
    );
}
