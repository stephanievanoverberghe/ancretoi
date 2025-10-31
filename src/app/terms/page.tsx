// src/app/terms/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Handshake, Shield, Scale, CreditCard, Truck, User, Clock, Mail, Phone, Building2 } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Conditions générales d’utilisation',
    description: 'Conditions générales d’utilisation du site et des services Ancre-toi.',
    alternates: { canonical: '/terms' },
    openGraph: {
        title: 'Conditions générales d’utilisation',
        description: 'Conditions générales d’utilisation du site et des services Ancre-toi.',
        url: '/terms',
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

export default function TermsPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Conditions générales d’utilisation',
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
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Conditions générales d’utilisation</h1>
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
                            <Handshake className="h-4 w-4" /> Acceptation
                        </div>
                        <div className="mt-1 text-sm font-medium">Usage = accord des CGU</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Utilisateurs
                        </div>
                        <div className="mt-1 text-sm font-medium">Engagements & obligations</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Scale className="h-4 w-4" /> Responsabilité
                        </div>
                        <div className="mt-1 text-sm font-medium">Limitation & droit applicable</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Mise à jour
                        </div>
                        <div className="mt-1 text-sm font-medium">Version : {lastUpdated}</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#objet" label="1. Objet" />
                        <TocItem href="#acceptation" label="2. Acceptation des CGU" />
                        <TocItem href="#acces" label="3. Accès au site" />
                        <TocItem href="#inscription" label="4. Compte & inscription" />
                        <TocItem href="#utilisation" label="5. Bon usage & obligations" />
                        <TocItem href="#contenus" label="6. Contenus & propriété intellectuelle" />
                        <TocItem href="#paiement" label="7. Paiement & services payants" />
                        <TocItem href="#responsabilite" label="8. Responsabilité" />
                        <TocItem href="#donnees" label="9. Données personnelles" />
                        <TocItem href="#resiliation" label="10. Résiliation" />
                        <TocItem href="#droit" label="11. Droit applicable" />
                        <TocItem href="#contact" label="12. Contact" />
                    </ul>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="objet" icon={<FileText className="h-5 w-5" />} title="1. Objet">
                            <p>
                                Les présentes Conditions Générales d’Utilisation (CGU) ont pour objet de définir les modalités et conditions d’utilisation du site{' '}
                                <strong>{SITE_NAME}</strong> et des services qui y sont proposés.
                            </p>
                        </Section>

                        <Section id="acceptation" icon={<Handshake className="h-5 w-5" />} title="2. Acceptation des CGU">
                            <p>
                                L’accès au site et son utilisation impliquent l’acceptation sans réserve des présentes CGU. En cas de désaccord avec celles-ci, l’utilisateur doit
                                cesser toute utilisation du site.
                            </p>
                        </Section>

                        <Section id="acces" icon={<User className="h-5 w-5" />} title="3. Accès au site">
                            <p>
                                Le site est accessible 24h/24 et 7j/7, sauf cas de force majeure ou maintenance. {SITE_NAME} se réserve le droit de suspendre ou modifier l’accès
                                sans préavis pour assurer la maintenance ou l’évolution du site.
                            </p>
                        </Section>

                        <Section id="inscription" icon={<User className="h-5 w-5" />} title="4. Compte & inscription">
                            <p>
                                L’accès à certaines fonctionnalités nécessite la création d’un compte utilisateur. L’utilisateur s’engage à fournir des informations exactes et à
                                jour, et à maintenir la confidentialité de ses identifiants.
                            </p>
                        </Section>

                        <Section id="utilisation" icon={<Shield className="h-5 w-5" />} title="5. Bon usage & obligations">
                            <ul>
                                <li>Respecter les lois et règlements en vigueur.</li>
                                <li>Ne pas usurper l’identité d’autrui.</li>
                                <li>Ne pas porter atteinte à la sécurité ou l’intégrité du site.</li>
                                <li>Ne pas utiliser le site à des fins commerciales non autorisées.</li>
                            </ul>
                        </Section>

                        <Section id="contenus" icon={<FileText className="h-5 w-5" />} title="6. Contenus & propriété intellectuelle">
                            <p>
                                Tous les contenus (textes, visuels, logos, etc.) du site {SITE_NAME} sont protégés par le droit d’auteur. Toute reproduction ou réutilisation non
                                autorisée est interdite.
                            </p>
                        </Section>

                        <Section id="paiement" icon={<CreditCard className="h-5 w-5" />} title="7. Paiement & services payants">
                            <p>
                                Certains services peuvent être payants. Les modalités de paiement et de remboursement sont précisées lors de la commande. Les prix sont exprimés en
                                euros TTC.
                            </p>
                        </Section>

                        <Section id="responsabilite" icon={<Scale className="h-5 w-5" />} title="8. Responsabilité">
                            <p>{SITE_NAME} ne peut être tenu responsable des dommages directs ou indirects résultant de l’utilisation du site ou de l’impossibilité d’y accéder.</p>
                            <p>L’utilisateur reconnaît utiliser le site sous sa seule responsabilité et s’engage à signaler toute anomalie.</p>
                        </Section>

                        <Section id="donnees" icon={<Shield className="h-5 w-5" />} title="9. Données personnelles">
                            <p>
                                Le traitement des données est régi par notre{' '}
                                <Link className="underline underline-offset-4" href="/privacy">
                                    Politique de confidentialité
                                </Link>
                                .
                            </p>
                        </Section>

                        <Section id="resiliation" icon={<Truck className="h-5 w-5" />} title="10. Résiliation">
                            <p>
                                L’utilisateur peut résilier son compte à tout moment via l’espace personnel ou en contactant {EMAIL_CONTACT}. {SITE_NAME} peut suspendre ou
                                supprimer un compte en cas de non-respect des présentes CGU.
                            </p>
                        </Section>

                        <Section id="droit" icon={<Scale className="h-5 w-5" />} title="11. Droit applicable">
                            <p>Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
                        </Section>

                        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="12. Contact">
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
                        </Section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
