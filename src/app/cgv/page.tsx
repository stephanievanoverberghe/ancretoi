// src/app/cgv/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Store, Receipt, CreditCard, Wallet, CalendarClock, Download, Shield, Scale, LifeBuoy, Mail, Phone, Building2 } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
// const OWNER_NAME = 'Stéphanie Vanoverberghe';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const SIREN = '000 000 000';
const TVA = 'FR00 000000000';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Conditions Générales de Vente',
    description: 'Conditions Générales de Vente (CGV) applicables aux produits et services d’Ancre-toi.',
    alternates: { canonical: '/cgv' },
    openGraph: {
        title: 'Conditions Générales de Vente',
        description: 'Conditions Générales de Vente (CGV) applicables aux produits et services d’Ancre-toi.',
        url: '/cgv',
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

export default function CgvPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Conditions Générales de Vente',
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
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Conditions Générales de Vente</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/legal" className="btn-secondary text-sm">
                            <Building2 className="h-4 w-4" /> Mentions légales
                        </Link>
                        <Link href="/privacy" className="btn text-sm">
                            <Shield className="h-4 w-4" /> Politique de confidentialité
                        </Link>
                    </div>
                </div>

                {/* Mini KPIs */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Store className="h-4 w-4" /> Vendeuse
                        </div>
                        <div className="mt-1 text-sm font-medium truncate">{LEGAL_NAME}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Prix & TVA
                        </div>
                        <div className="mt-1 text-sm font-medium">TTC / {TVA || 'TVA à compléter'}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Paiement
                        </div>
                        <div className="mt-1 text-sm font-medium">Sécurisé (prestataire)</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" /> Rétractation
                        </div>
                        <div className="mt-1 text-sm font-medium">14 jours (conditions)</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#objet" label="1. Objet" />
                        <TocItem href="#produits" label="2. Produits & services" />
                        <TocItem href="#prix" label="3. Prix" />
                        <TocItem href="#commande" label="4. Commande" />
                        <TocItem href="#paiement" label="5. Paiement" />
                        <TocItem href="#livraison" label="6. Livraison / Accès numérique" />
                        <TocItem href="#retractation" label="7. Droit de rétractation" />
                        <TocItem href="#execution" label="8. Exécution & disponibilité" />
                        <TocItem href="#garanties" label="9. Garanties & SAV" />
                        <TocItem href="#responsabilite" label="10. Responsabilité" />
                        <TocItem href="#propriete" label="11. Propriété intellectuelle" />
                        <TocItem href="#donnees" label="12. Données personnelles" />
                        <TocItem href="#mediation" label="13. Médiation" />
                        <TocItem href="#droit" label="14. Droit applicable" />
                        <TocItem href="#contact" label="15. Contact" />
                    </ul>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="objet" icon={<FileText className="h-5 w-5" />} title="1. Objet">
                            <p>
                                Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits et services proposés par <strong>{LEGAL_NAME}</strong> via le
                                site
                                <strong> {SITE_NAME}</strong>.
                            </p>
                            <p>Toute commande implique l’acceptation pleine et entière des CGV en vigueur au jour de l’achat.</p>
                        </Section>

                        <Section id="produits" icon={<Store className="h-5 w-5" />} title="2. Produits & services">
                            <p>
                                Les caractéristiques essentielles des produits et services (notamment numériques) sont présentées sur les pages dédiées. Les visuels ont une valeur
                                indicative.
                            </p>
                            <p>Les offres s’entendent dans la limite des disponibilités.</p>
                        </Section>

                        <Section id="prix" icon={<Receipt className="h-5 w-5" />} title="3. Prix">
                            <ul>
                                <li>
                                    Les prix sont indiqués en euros <strong>TTC</strong> (toutes taxes comprises).
                                </li>
                                <li>Les éventuels frais additionnels (ex. livraison matérielle) sont précisés lors de la commande.</li>
                                <li>Nous nous réservons le droit de modifier les prix à tout moment, sans effet rétroactif sur les commandes déjà passées.</li>
                                {TVA && <li>TVA intracommunautaire : {TVA}</li>}
                            </ul>
                        </Section>

                        <Section id="commande" icon={<FileText className="h-5 w-5" />} title="4. Commande">
                            <ul>
                                <li>Le processus de commande en ligne récapitule votre panier, les prix, et permet la validation finale.</li>
                                <li>Le contrat est conclu après confirmation de paiement et envoi d’un e-mail de confirmation.</li>
                                <li>Nous nous réservons le droit de refuser une commande en cas d’anomalie ou de soupçon de fraude.</li>
                            </ul>
                        </Section>

                        <Section id="paiement" icon={<CreditCard className="h-5 w-5" />} title="5. Paiement">
                            <ul>
                                <li>Les paiements sont opérés via un prestataire sécurisé (ex. Stripe). Aucune donnée de carte n’est stockée par {LEGAL_NAME}.</li>
                                <li>Les moyens acceptés sont précisés lors du checkout (carte bancaire, etc.).</li>
                                <li>En cas de rejet de paiement, la commande est automatiquement annulée.</li>
                            </ul>
                        </Section>

                        <Section id="livraison" icon={<Download className="h-5 w-5" />} title="6. Livraison / Accès numérique">
                            <ul>
                                <li>
                                    Pour les <strong>contenus numériques</strong>, l’accès est fourni sans support matériel, généralement immédiatement après paiement.
                                </li>
                                <li>
                                    Pour tout <strong>envoi matériel</strong> (le cas échéant), les modalités et délais sont indiqués avant la validation.
                                </li>
                            </ul>
                        </Section>

                        <Section id="retractation" icon={<CalendarClock className="h-5 w-5" />} title="7. Droit de rétractation">
                            <p>
                                Conformément au Code de la consommation, vous disposez d’un <strong>délai de 14 jours</strong> à compter de l’achat pour exercer votre droit de
                                rétractation sans motif.
                            </p>
                            <p>
                                <strong>Exception</strong> : pour les <strong>contenus numériques fournis sur un support immatériel</strong> et dont l’exécution commence avant la
                                fin du délai de 14 jours
                                <strong> avec votre accord exprès et renoncement à votre droit de rétractation</strong>, le droit de rétractation ne s’applique pas.
                            </p>
                            <p>
                                Pour exercer ce droit, contactez-nous à{' '}
                                <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                    {EMAIL_CONTACT}
                                </a>
                                .
                            </p>
                        </Section>

                        <Section id="execution" icon={<Wallet className="h-5 w-5" />} title="8. Exécution & disponibilité">
                            <p>
                                Nous mettons en œuvre les moyens nécessaires pour assurer l’accès aux services achetés. En cas d’indisponibilité exceptionnelle, un remboursement ou
                                une solution équivalente peut être proposée.
                            </p>
                        </Section>

                        <Section id="garanties" icon={<Shield className="h-5 w-5" />} title="9. Garanties & SAV">
                            <p>Les produits et services bénéficient des garanties légales applicables. Pour toute demande, contactez notre support.</p>
                        </Section>

                        <Section id="responsabilite" icon={<Scale className="h-5 w-5" />} title="10. Responsabilité">
                            <p>
                                {SITE_NAME} ne saurait être tenu responsable des dommages indirects résultant de l’usage des produits ou services, ni des indisponibilités
                                temporaires du site.
                            </p>
                        </Section>

                        <Section id="propriete" icon={<FileText className="h-5 w-5" />} title="11. Propriété intellectuelle">
                            <p>
                                Les contenus vendus (textes, visuels, vidéos, sons, logiciels, etc.) sont protégés par le droit d’auteur. Toute reproduction ou diffusion non
                                autorisée est interdite.
                            </p>
                        </Section>

                        <Section id="donnees" icon={<Shield className="h-5 w-5" />} title="12. Données personnelles">
                            <p>
                                Le traitement de vos données est décrit dans notre{' '}
                                <Link className="underline underline-offset-4" href="/privacy">
                                    Politique de confidentialité
                                </Link>
                                .
                            </p>
                        </Section>

                        <Section id="mediation" icon={<LifeBuoy className="h-5 w-5" />} title="13. Médiation">
                            <p>
                                En cas de litige, vous pouvez recourir gratuitement à un médiateur de la consommation conformément à l’article L.612-1 du Code de la consommation.
                                Les modalités pratiques seront communiquées sur demande.
                            </p>
                        </Section>

                        <Section id="droit" icon={<Scale className="h-5 w-5" />} title="14. Droit applicable & juridiction">
                            <p>Les présentes CGV sont régies par le droit français. À défaut d’accord amiable, les tribunaux français seront seuls compétents.</p>
                        </Section>

                        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="15. Contact">
                            <ul>
                                <li className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-brand-700" />
                                    <span>
                                        E-mail :{' '}
                                        <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                            {EMAIL_CONTACT}
                                        </a>
                                    </span>
                                </li>
                                {PHONE_CONTACT ? (
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-brand-700" />
                                        <span>Téléphone : {PHONE_CONTACT}</span>
                                    </li>
                                ) : null}
                                <li>Adresse : {POSTAL_ADDRESS}</li>
                                <li>
                                    SIREN : {SIREN}
                                    {TVA ? ` — TVA : ${TVA}` : ''}
                                </li>
                            </ul>
                        </Section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
