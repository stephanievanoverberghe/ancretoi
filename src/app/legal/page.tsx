// src/app/legal/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Building2, Copyright as CopyrightIcon, Cookie, ExternalLink, Scale, LifeBuoy, Mail, Link2, Phone } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
const OWNER_NAME = 'Stéphanie Vanoverberghe';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const SIREN = '000 000 000';
const TVA = 'FR00 000000000';
const HOST_NAME = 'Vercel Inc.';
const HOST_ADDRESS = '340 S Lemon Ave #4133, Walnut, CA 91789, USA';
const HOST_WEBSITE = 'https://vercel.com';
const DPO_EMAIL = '';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Mentions légales',
    description: 'Mentions légales, informations éditeur, hébergeur, propriété intellectuelle et politique de protection des données.',
    alternates: { canonical: '/legal' },
    openGraph: {
        title: 'Mentions légales',
        description: 'Mentions légales, informations éditeur, hébergeur, propriété intellectuelle et politique de protection des données.',
        url: '/legal',
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

export default function LegalPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: LEGAL_NAME,
        url: '/',
        email: EMAIL_CONTACT,
        telephone: PHONE_CONTACT,
        address: {
            '@type': 'PostalAddress',
            streetAddress: POSTAL_ADDRESS,
            addressCountry: 'FR',
        },
    } as const;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-10 md:py-12 space-y-8 overflow-x-hidden">
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

            {/* Header block — style Admin (verre + gradient) */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Mentions légales</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href="#contact" className="btn-secondary text-sm">
                            <Mail className="h-4 w-4" /> Nous contacter
                        </a>
                        <a href="#donnees" className="btn text-sm">
                            <Shield className="h-4 w-4" /> Données & RGPD
                        </a>
                    </div>
                </div>

                {/* Mini KPIs style admin */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Éditeur
                        </div>
                        <div className="mt-1 text-sm font-medium truncate" title={`${LEGAL_NAME}`}>
                            {LEGAL_NAME}
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CopyrightIcon className="h-4 w-4" /> Propriété
                        </div>
                        <div className="mt-1 text-sm font-medium">
                            © {new Date().getFullYear()} {SITE_NAME}
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Shield className="h-4 w-4" /> RGPD
                        </div>
                        <div className="mt-1 text-sm font-medium">Droits & cookies</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <LifeBuoy className="h-4 w-4" /> Aide
                        </div>
                        <div className="mt-1 text-sm font-medium">Médiation & support</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC at side on desktop */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* TOC */}
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#editeur" label="1. Éditeur du site" />
                        <TocItem href="#hebergeur" label="2. Hébergeur" />
                        <TocItem href="#responsabilites" label="3. Responsabilités" />
                        <TocItem href="#propriete" label="4. Propriété intellectuelle" />
                        <TocItem href="#donnees" label="5. Données personnelles" />
                        <TocItem href="#cookies" label="6. Cookies" />
                        <TocItem href="#liens" label="7. Liens externes" />
                        <TocItem href="#droit" label="8. Droit applicable" />
                        <TocItem href="#mediation" label="9. Médiation" />
                        <TocItem href="#contact" label="10. Contact" />
                    </ul>
                </Card>

                {/* Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="editeur" icon={<Building2 className="h-5 w-5" />} title="1. Éditeur du site">
                            <p>
                                <strong>{SITE_NAME}</strong> — {LEGAL_NAME}
                            </p>
                            <ul>
                                <li>Adresse : {POSTAL_ADDRESS}</li>
                                <li>SIREN : {SIREN}</li>
                                {TVA && <li>TVA intracommunautaire : {TVA}</li>}
                                <li>Directrice de la publication : {OWNER_NAME}</li>
                                <li>
                                    E-mail :{' '}
                                    <a className="underline decoration-brand-300 underline-offset-4 hover:decoration-brand-500" href={`mailto:${EMAIL_CONTACT}`}>
                                        {EMAIL_CONTACT}
                                    </a>
                                </li>
                                {PHONE_CONTACT && <li>Téléphone : {PHONE_CONTACT}</li>}
                            </ul>
                        </Section>

                        <Section id="hebergeur" icon={<Building2 className="h-5 w-5" />} title="2. Hébergeur">
                            <p>
                                {HOST_NAME} — {HOST_ADDRESS} —{' '}
                                <a className="underline underline-offset-4" href={HOST_WEBSITE} target="_blank" rel="noreferrer">
                                    {HOST_WEBSITE} <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                </a>
                            </p>
                        </Section>

                        <Section id="responsabilites" icon={<Scale className="h-5 w-5" />} title="3. Responsabilités">
                            <p>
                                {SITE_NAME} s’efforce d’assurer l’exactitude et la mise à jour des informations diffusées. Toutefois, {SITE_NAME} ne peut garantir l’absence
                                d’erreurs ou d’omissions et décline toute responsabilité en cas d’utilisation inappropriée du site ou d’interruptions de service.
                            </p>
                            <p>
                                L’utilisateur reconnaît utiliser le site sous sa seule responsabilité. {SITE_NAME} ne saurait être tenu responsable des dommages directs ou
                                indirects résultant de l’accès au site, de son utilisation ou de l’impossibilité d’y accéder.
                            </p>
                        </Section>

                        <Section id="propriete" icon={<CopyrightIcon className="h-5 w-5" />} title="4. Propriété intellectuelle">
                            <p>
                                L’ensemble des contenus (textes, images, graphismes, logos, vidéos, icônes, sons, logiciels, etc.) présents sur ce site sont protégés par le droit
                                d’auteur et les droits de propriété intellectuelle. Toute reproduction, représentation, modification, publication, transmission, dénaturation,
                                totale ou partielle des contenus, par quelque procédé que ce soit, est interdite sans l’autorisation préalable et écrite de {SITE_NAME}.
                            </p>
                            <p>Les marques et logos éventuellement cités restent la propriété de leurs détenteurs respectifs.</p>
                        </Section>

                        <Section id="donnees" icon={<Shield className="h-5 w-5" />} title="5. Données personnelles (RGPD)">
                            <p>
                                {SITE_NAME} collecte et traite des données personnelles conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés. Les
                                finalités, bases légales, durées de conservation et destinataires sont proportionnés à chaque usage (création de compte, gestion client,
                                facturation, support, prospection, statistiques, sécurité, etc.).
                            </p>
                            <p>
                                Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition ainsi que du droit à la portabilité de vos données.
                                Vous pouvez également définir des directives post-mortem. Pour exercer ces droits, contactez-nous à l’adresse{' '}
                                <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                    {EMAIL_CONTACT}
                                </a>
                                {DPO_EMAIL ? (
                                    <>
                                        {' '}
                                        ou notre DPO à{' '}
                                        <a className="underline underline-offset-4" href={`mailto:${DPO_EMAIL}`}>
                                            {DPO_EMAIL}
                                        </a>
                                    </>
                                ) : null}
                                .
                            </p>
                            <p>
                                En cas de difficulté, vous pouvez saisir la CNIL (
                                <a className="underline underline-offset-4" href="https://www.cnil.fr" target="_blank" rel="noreferrer">
                                    cnil.fr
                                </a>
                                ).
                            </p>
                            <p>
                                Pour en savoir plus, consultez notre{' '}
                                <Link className="underline underline-offset-4" href="/privacy">
                                    Politique de confidentialité
                                </Link>
                                .
                            </p>
                        </Section>

                        <Section id="cookies" icon={<Cookie className="h-5 w-5" />} title="6. Cookies & traceurs">
                            <p>
                                Le site peut utiliser des cookies et technologies similaires (mesure d’audience, authentification, préférences, sécurité). Lors de votre première
                                visite, un bandeau vous informe et vous permet de paramétrer vos choix. Vous pouvez à tout moment modifier votre consentement via le lien “Gérer les
                                cookies” ou depuis les réglages de votre navigateur.
                            </p>
                            <p>
                                Pour plus d’informations, consultez notre{' '}
                                <Link className="underline underline-offset-4" href="/cookies">
                                    Politique Cookies
                                </Link>
                                .
                            </p>
                        </Section>

                        <Section id="liens" icon={<Link2 className="h-5 w-5" />} title="7. Liens hypertextes">
                            <p>
                                Le site peut contenir des liens vers des sites tiers. {SITE_NAME} ne peut être tenu responsable du contenu ou du fonctionnement de ces sites et
                                décline toute responsabilité s’agissant des dommages pouvant résulter de leur consultation.
                            </p>
                        </Section>

                        <Section id="droit" icon={<Scale className="h-5 w-5" />} title="8. Droit applicable et juridiction">
                            <p>
                                Les présentes mentions sont soumises au droit français. En cas de litige et à défaut d’accord amiable, les tribunaux français seront seuls
                                compétents, sous réserve des règles de compétence d’ordre public.
                            </p>
                        </Section>

                        <Section id="mediation" icon={<LifeBuoy className="h-5 w-5" />} title="9. Médiation de la consommation">
                            <p>
                                Conformément à l’article L. 612-1 du Code de la consommation, le consommateur a le droit de recourir gratuitement à un médiateur de la consommation
                                en vue de la résolution amiable du litige. Il peut également utiliser la plateforme européenne de règlement en ligne des litiges (RLL) :
                                <a className="underline underline-offset-4 ml-1" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
                                    ec.europa.eu/consumers/odr <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                </a>
                                .
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
                    </Card>
                </div>
            </div>
        </div>
    );
}
