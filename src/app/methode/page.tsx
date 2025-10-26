// src/app/methode/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function MethodePage() {
    return (
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14 sm:px-6 lg:px-8">
            {/* Intro */}
            <section aria-labelledby="method-h1">
                {/* Fil d’Ariane */}
                <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'Méthode' }]} />

                <h1 id="method-h1" className="font-serif text-3xl sm:text-4xl leading-tight">
                    Méthode Serenity
                </h1>
                <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                    Une approche simple et incarnée : <span className="font-medium text-foreground">Ancrage</span>, <span className="font-medium text-foreground">Boussole</span>,{' '}
                    <span className="font-medium text-foreground">Alchimie</span>.
                </p>

                {/* liens d’ancre rapides */}
                <div className="mt-5 flex flex-wrap gap-2">
                    <a href="#ancrage" className="rounded-full border border-brand-100 bg-brand-50/40 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-50">
                        # Ancrage
                    </a>
                    <a href="#boussole" className="rounded-full border border-brand-100 bg-brand-50/40 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-50">
                        # Boussole
                    </a>
                    <a href="#alchimie" className="rounded-full border border-brand-100 bg-brand-50/40 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-50">
                        # Alchimie
                    </a>
                </div>
            </section>

            {/* ANCRAGE */}
            <section id="ancrage" aria-labelledby="ancrage-title" className="scroll-mt-24 py-8 sm:py-10 border-t border-gold-100/60">
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                    <div className="order-2 md:order-1">
                        <h2 id="ancrage-title" className="font-serif text-2xl leading-snug">
                            Ancrage
                        </h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-brand-900">
                            Revenir au corps, poser des racines dans le quotidien. Ralentir, respirer, remettre l’axe en place pour des décisions plus claires.
                        </p>
                        <ul className="mt-4 space-y-2 text-[14px]">
                            <li>• Rituel respiration 4-6 & présence</li>
                            <li>• Hygiène douce (sommeil, lumière, mouvement)</li>
                            <li>• Journal court : corps / cœur / tête</li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-brand-100">
                            <Image
                                src="/images/method/pillar-ancrage.webp"
                                alt="Silhouette racines/pieds stylisés en papier, sauge et lilas, lumière douce"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* BOUSSOLE */}
            <section id="boussole" aria-labelledby="boussole-title" className="scroll-mt-24 py-8 sm:py-10 border-t border-gold-100/60">
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                    <div>
                        <h2 id="boussole-title" className="font-serif text-2xl leading-snug">
                            Boussole
                        </h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-brand-900">
                            Clarifier ce qui compte vraiment : valeurs, besoins, limites saines. Avancer en cohérence plutôt qu’en pilotage automatique.
                        </p>
                        <ul className="mt-4 space-y-2 text-[14px]">
                            <li>• Carte perso : valeurs → décisions</li>
                            <li>• Limites dites sans culpabilité</li>
                            <li>• Check-in quotidien aligné</li>
                        </ul>
                    </div>
                    <div>
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-brand-100">
                            <Image
                                src="/images/method/pillar-boussole.webp"
                                alt="Rose des vents minimaliste en papier, améthyste et or discret"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ALCHIMIE */}
            <section id="alchimie" aria-labelledby="alchimie-title" className="scroll-mt-24 py-8 sm:py-10 border-t border-gold-100/60">
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                    <div className="order-2 md:order-1">
                        <h2 id="alchimie-title" className="font-serif text-2xl leading-snug">
                            Alchimie
                        </h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-brand-900">
                            Transformer avec douceur. Intégrer ce qui bloque, faire circuler, transmuter pour un axe vivant et durable.
                        </p>
                        <ul className="mt-4 space-y-2 text-[14px]">
                            <li>• Exercices d’intégration émotionnelle</li>
                            <li>• Vision concrète à 3–12 mois</li>
                            <li>• Premiers pas visibles et tenables</li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-brand-100">
                            <Image
                                src="/images/method/pillar-alchimie.webp"
                                alt="Spirale/flux en papier évoquant la transformation, améthyste vers or"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA léger */}
            <section className="mt-10 sm:mt-12 border-t border-gold-100/60 pt-6 pb-14 sm:pb-16 lg:pb-20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[15px] text-muted-foreground">Prête à essayer ? Découvre les programmes guidés.</p>
                    <Link href="/programs" className="btn" aria-label="Voir les programmes guidés">
                        Voir les programmes
                    </Link>
                </div>
            </section>
        </main>
    );
}
