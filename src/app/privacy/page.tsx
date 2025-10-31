// src/app/privacy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Database, FileText, Timer, Users as UsersIcon, Globe, Lock, UserCheck, Cookie, Mail, Phone, Building2 } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Politique de confidentialité',
    description: 'Comment nous collectons, utilisons, stockons et protégeons vos données personnelles (RGPD).',
    alternates: { canonical: '/privacy' },
    openGraph: {
        title: 'Politique de confidentialité',
        description: 'Comment nous collectons, utilisons, stockons et protégeons vos données personnelles (RGPD).',
        url: '/privacy',
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

export default function PrivacyPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Politique de confidentialité',
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

            {/* Header block — style Admin (verre + gradient) */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Politique de confidentialité</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/legal" className="btn-secondary text-sm">
                            <Building2 className="h-4 w-4" /> Mentions légales
                        </Link>
                        <Link href="/cookies" className="btn text-sm">
                            <Cookie className="h-4 w-4" /> Gérer mes cookies
                        </Link>
                    </div>
                </div>

                {/* Mini KPIs style admin */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Database className="h-4 w-4" /> Données traitées
                        </div>
                        <div className="mt-1 text-sm font-medium">Identité, contact, usage</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Base légale
                        </div>
                        <div className="mt-1 text-sm font-medium">Contrat / Intérêt légitime / Consentement</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Timer className="h-4 w-4" /> Conservation
                        </div>
                        <div className="mt-1 text-sm font-medium">Durées proportionnées</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Sécurité
                        </div>
                        <div className="mt-1 text-sm font-medium">Mesures techniques & orga</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC at side on desktop */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* TOC */}
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#intro" label="1. À propos de cette politique" />
                        <TocItem href="#donnees" label="2. Données que nous collectons" />
                        <TocItem href="#finalites" label="3. Finalités & bases légales" />
                        <TocItem href="#conservation" label="4. Durées de conservation" />
                        <TocItem href="#destinataires" label="5. Destinataires & sous-traitants" />
                        <TocItem href="#transferts" label="6. Transferts hors UE" />
                        <TocItem href="#securite" label="7. Sécurité" />
                        <TocItem href="#droits" label="8. Vos droits" />
                        <TocItem href="#cookies" label="9. Cookies" />
                        <TocItem href="#contact" label="10. Contact" />
                        <TocItem href="#maj" label="11. Mises à jour" />
                    </ul>
                </Card>

                {/* Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="intro" icon={<FileText className="h-5 w-5" />} title="1. À propos de cette politique">
                            <p>
                                Cette politique explique comment <strong>{SITE_NAME}</strong> ({LEGAL_NAME}) collecte, utilise, conserve et protège vos données personnelles lorsque
                                vous utilisez notre site et nos services.
                            </p>
                            <p>
                                Nous agissons en tant que responsable de traitement pour la plupart des opérations décrites ci-dessous. Lorsque nous opérons via des prestataires,
                                ceux-ci peuvent intervenir comme sous-traitants au sens du RGPD.
                            </p>
                        </Section>

                        <Section id="donnees" icon={<Database className="h-5 w-5" />} title="2. Données que nous collectons">
                            <ul>
                                <li>
                                    <strong>Identité & contact</strong> : nom, prénom, e-mail, numéro de téléphone.
                                </li>
                                <li>
                                    <strong>Compte & usage</strong> : identifiants, préférences, historique de navigation interne, contenus consultés.
                                </li>
                                <li>
                                    <strong>Technique</strong> : adresses IP, logs, type d’appareil, navigateur, cookies/traceurs (voir section Cookies).
                                </li>
                                <li>
                                    <strong>Transactionnel</strong> : si applicable, informations de facturation (traitées via un prestataire de paiement).
                                </li>
                            </ul>
                        </Section>

                        <Section id="finalites" icon={<Shield className="h-5 w-5" />} title="3. Finalités & bases légales">
                            <ul>
                                <li>
                                    <strong>Fourniture du service</strong> (exécution du contrat) : création de compte, accès aux contenus, support.
                                </li>
                                <li>
                                    <strong>Amélioration & sécurité</strong> (intérêt légitime) : statistiques d’usage agrégées, prévention de la fraude, journalisation.
                                </li>
                                <li>
                                    <strong>Communication</strong> (intérêt légitime / consentement) : e-mails de service, newsletters si consenties, réponses à vos demandes.
                                </li>
                                <li>
                                    <strong>Obligations légales</strong> : facturation, conservation légale, exercice des droits.
                                </li>
                            </ul>
                        </Section>

                        <Section id="conservation" icon={<Timer className="h-5 w-5" />} title="4. Durées de conservation">
                            <ul>
                                <li>
                                    <strong>Compte</strong> : pendant la relation contractuelle puis archivage limité.
                                </li>
                                <li>
                                    <strong>Prospection</strong> : 3 ans après le dernier contact émanant de votre part.
                                </li>
                                <li>
                                    <strong>Facturation</strong> : 10 ans (obligation légale FR).
                                </li>
                                <li>
                                    <strong>Logs techniques</strong> : durées proportionnées à la sécurité (rotation).
                                </li>
                            </ul>
                        </Section>

                        <Section id="destinataires" icon={<UsersIcon className="h-5 w-5" />} title="5. Destinataires & sous-traitants">
                            <p>
                                Vos données peuvent être traitées par nos équipes habilitées et par des prestataires (hébergement, e-mailing, analytique, paiement) dans le cadre
                                strictement nécessaire à leurs missions. Des engagements contractuels conformes au RGPD encadrent ces traitements.
                            </p>
                        </Section>

                        <Section id="transferts" icon={<Globe className="h-5 w-5" />} title="6. Transferts hors UE">
                            <p>
                                Lorsque des transferts en dehors de l’Espace Économique Européen sont nécessaires, ils sont encadrés par des garanties appropriées (clauses
                                contractuelles types de la Commission européenne, mesures additionnelles, etc.).
                            </p>
                        </Section>

                        <Section id="securite" icon={<Lock className="h-5 w-5" />} title="7. Sécurité">
                            <p>
                                Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données (contrôles d’accès, chiffrement au repos/en
                                transit lorsque c’est pertinent, sauvegardes, tests, journalisation, principe du moindre privilège, etc.).
                            </p>
                        </Section>

                        <Section id="droits" icon={<UserCheck className="h-5 w-5" />} title="8. Vos droits">
                            <p>
                                Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition, ainsi que du droit à la portabilité. Vous pouvez
                                aussi définir des directives post-mortem.
                            </p>
                            <p>
                                Pour exercer vos droits, contactez-nous à{' '}
                                <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                    {EMAIL_CONTACT}
                                </a>
                                . En cas de difficulté, vous pouvez saisir la CNIL (
                                <a className="underline underline-offset-4" href="https://www.cnil.fr" target="_blank" rel="noreferrer">
                                    cnil.fr
                                </a>
                                ).
                            </p>
                        </Section>

                        <Section id="cookies" icon={<Cookie className="h-5 w-5" />} title="9. Cookies">
                            <p>
                                Pour la gestion des cookies et traceurs (mesure d’audience, préférences, sécurité, etc.), consultez notre{' '}
                                <Link className="underline underline-offset-4" href="/cookies">
                                    Politique Cookies
                                </Link>{' '}
                                et paramétrez vos choix sur la bannière dédiée lorsque celle-ci est affichée.
                            </p>
                        </Section>

                        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="10. Contact">
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

                        <Section id="maj" icon={<FileText className="h-5 w-5" />} title="11. Mises à jour de cette politique">
                            <p>
                                Nous pouvons modifier cette politique pour refléter les évolutions légales, techniques ou opérationnelles. La date de dernière mise à jour est
                                indiquée en haut de page.
                            </p>
                        </Section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
