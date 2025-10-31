// src/app/retractation/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CalendarClock, Undo2, CreditCard, PackageOpen, Download, Shield, Mail, Phone } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Droit de rétractation',
    description: 'Informations sur l’exercice du droit de rétractation (14 jours), modalités, exceptions et modèle de formulaire.',
    alternates: { canonical: '/retractation' },
    openGraph: {
        title: 'Droit de rétractation',
        description: 'Informations sur l’exercice du droit de rétractation (14 jours), modalités, exceptions et modèle de formulaire.',
        url: '/retractation',
        siteName: SITE_NAME,
        type: 'website',
    },
};

function Hr() {
    return <div className="hr-gold my-4" aria-hidden />;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm ${className}`}>{children}</div>;
}

function TocItem({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <a className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50" href={href}>
                {label}
            </a>
        </li>
    );
}

function Section({ id, icon, title, children }: { id: string; icon?: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-start gap-3">
                {icon ? <div className="mt-1 text-brand-700">{icon}</div> : null}
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h2>
                    <div className="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1">{children}</div>
                </div>
            </div>
            <Hr />
        </section>
    );
}

export default function RetractationPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Droit de rétractation',
        about: SITE_NAME,
        isPartOf: {
            '@type': 'WebSite',
            name: SITE_NAME,
        },
        publisher: {
            '@type': 'Organization',
            name: LEGAL_NAME,
            url: '/',
            email: EMAIL_CONTACT,
            telephone: PHONE_CONTACT,
            address: {
                '@type': 'PostalAddress',
                streetAddress: POSTAL_ADDRESS,
                addressCountry: 'FR',
            },
        },
        dateModified: lastUpdated.split('/').reverse().join('-'),
    } as const;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-10 md:py-12 space-y-8 overflow-x-hidden">
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

            {/* Header block — style Admin */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Droit de rétractation</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/cgv" className="btn-secondary text-sm">
                            <FileText className="h-4 w-4" /> CGV
                        </Link>
                        <Link href="/privacy" className="btn text-sm">
                            <Shield className="h-4 w-4" /> Confidentialité
                        </Link>
                    </div>
                </div>

                {/* Mini KPIs */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" /> Délai légal
                        </div>
                        <div className="mt-1 text-sm font-medium">14 jours</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Undo2 className="h-4 w-4" /> Effet
                        </div>
                        <div className="mt-1 text-sm font-medium">Remboursement sous 14 jours</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Moyen de remboursement
                        </div>
                        <div className="mt-1 text-sm font-medium">Même moyen de paiement</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Download className="h-4 w-4" /> Numérique
                        </div>
                        <div className="mt-1 text-sm font-medium">Exception si exécution démarrée</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#champ" label="1. Champ d’application" />
                        <TocItem href="#delai" label="2. Délai & point de départ" />
                        <TocItem href="#modalites" label="3. Modalités d’exercice" />
                        <TocItem href="#effets" label="4. Effets de la rétractation" />
                        <TocItem href="#exceptions" label="5. Exceptions légales" />
                        <TocItem href="#retours" label="6. Retours d’articles matériels (si applicable)" />
                        <TocItem href="#formulaire" label="7. Modèle de formulaire" />
                        <TocItem href="#contact" label="8. Contact" />
                    </ul>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="champ" icon={<PackageOpen className="h-5 w-5" />} title="1. Champ d’application">
                            <p>
                                Le présent dispositif s’applique aux ventes à distance conclues avec des consommateurs. Pour les{' '}
                                <strong>contenus numériques fournis sans support matériel</strong> et pour les <strong>services</strong>, des règles spécifiques s’appliquent (voir
                                Exceptions).
                            </p>
                        </Section>

                        <Section id="delai" icon={<CalendarClock className="h-5 w-5" />} title="2. Délai & point de départ">
                            <ul>
                                <li>
                                    <strong>Produits matériels</strong> : 14 jours à compter de la réception.
                                </li>
                                <li>
                                    <strong>Services</strong> : 14 jours à compter de la conclusion du contrat.
                                </li>
                                <li>
                                    <strong>Contenus numériques sans support</strong> : 14 jours à compter de l’achat, <strong>sauf renoncement</strong> (voir Exceptions).
                                </li>
                            </ul>
                        </Section>

                        <Section id="modalites" icon={<Undo2 className="h-5 w-5" />} title="3. Modalités d’exercice">
                            <p>
                                Pour exercer votre droit, envoyez une déclaration dénuée d’ambiguïté (e-mail recommandé) indiquant clairement votre souhait de vous rétracter, avec
                                : nom, prénom, adresse, e-mail, n° de commande, produit/service concerné, date d’achat/réception.
                            </p>
                            <p>
                                Adressez votre demande à{' '}
                                <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                    {EMAIL_CONTACT}
                                </a>
                                .
                            </p>
                        </Section>

                        <Section id="effets" icon={<CreditCard className="h-5 w-5" />} title="4. Effets de la rétractation">
                            <ul>
                                <li>
                                    Remboursement de tous les paiements reçus, y compris les frais standards de livraison le cas échéant, <strong>dans les 14 jours</strong> suivant
                                    la notification.
                                </li>
                                <li>
                                    Nous procédons au remboursement en utilisant le <strong>même moyen de paiement</strong> que celui utilisé pour la transaction initiale, sauf
                                    accord exprès différent.
                                </li>
                                <li>
                                    Le remboursement peut être différé jusqu’à récupération des biens ou jusqu’à ce que vous ayez fourni une preuve d’expédition, la date retenue
                                    étant celle du premier de ces faits.
                                </li>
                            </ul>
                        </Section>

                        <Section id="exceptions" icon={<Shield className="h-5 w-5" />} title="5. Exceptions légales (extraits usuels)">
                            <ul>
                                <li>
                                    <strong>Services pleinement exécutés</strong> avant la fin du délai, après votre accord préalable et renoncement express.
                                </li>
                                <li>
                                    <strong>Contenus numériques</strong> fournis sur un support immatériel dont l’exécution a commencé avec votre accord et renoncement express.
                                </li>
                                <li>Biens personnalisés ou nettement personnalisés.</li>
                                <li>Biens scellés ne pouvant être renvoyés pour des raisons d’hygiène/santé, s’ils ont été descellés après la livraison.</li>
                            </ul>
                        </Section>

                        <Section id="retours" icon={<PackageOpen className="h-5 w-5" />} title="6. Retours d’articles matériels (si applicable)">
                            <ul>
                                <li>
                                    Renvoyez les biens <strong>sans retard excessif et au plus tard dans les 14 jours</strong> suivant votre notification.
                                </li>
                                <li>
                                    Vous supportez les <strong>frais directs de renvoi</strong> des biens, sauf mention contraire.
                                </li>
                                <li>
                                    Votre responsabilité peut être engagée en cas de dépréciation du bien résultant de manipulations autres que celles nécessaires pour en établir
                                    la nature, les caractéristiques et le bon fonctionnement.
                                </li>
                            </ul>
                        </Section>

                        <Section id="formulaire" icon={<FileText className="h-5 w-5" />} title="7. Modèle de formulaire de rétractation">
                            <div className="rounded-xl border border-border bg-white/70 p-4">
                                <pre className="whitespace-pre-wrap text-xs leading-relaxed">{`À l’attention de ${LEGAL_NAME} – ${POSTAL_ADDRESS}\nE-mail : ${EMAIL_CONTACT}\n\nJe vous notifie par la présente ma rétractation du contrat portant sur la vente du bien / pour la prestation de service ci-dessous :\n- Commande n° : __________________________\n- Produit / Service : _____________________\n- Commandé le : __________  / Reçu le : __________\n- Nom : _________________________________\n- Adresse : ______________________________\n- E-mail : _______________________________\n\nDate : __________     Signature (si envoi postal) : __________`}</pre>
                            </div>
                        </Section>

                        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="8. Contact">
                            <p className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-brand-700" />
                                <span>
                                    Écrivez-nous à{' '}
                                    <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                        {EMAIL_CONTACT}
                                    </a>
                                </span>
                            </p>
                            {PHONE_CONTACT ? (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-brand-700" />
                                    <span>Appelez-nous au {PHONE_CONTACT}</span>
                                </p>
                            ) : null}
                            <p>Adresse postale : {POSTAL_ADDRESS}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Link href="/cgv" className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                    Consulter les CGV
                                </Link>
                                <Link href="/legal" className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                    Mentions légales
                                </Link>
                            </div>
                        </Section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
