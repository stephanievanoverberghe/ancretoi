import type { Metadata } from 'next';
import Link from 'next/link';
import { Cookie as CookieIcon, Settings, Shield, BarChart3, ExternalLink, Timer, Mail, Phone, Building2, MousePointerClick, FileText } from 'lucide-react';

const SITE_NAME = 'Ancre-toi';
const LEGAL_NAME = 'Alchimiste Créations';
const EMAIL_CONTACT = 'orangestreet@live.fr';
const PHONE_CONTACT = '+33 6 24 87 47 71';
const POSTAL_ADDRESS = '3 avenue Pierre Brossolette, 59280 Armentières, France';
const lastUpdated = '31/10/2025';

export const metadata: Metadata = {
    title: 'Politique Cookies',
    description: 'Informations sur l’utilisation des cookies et traceurs, le paramétrage du consentement et vos droits.',
    alternates: { canonical: '/cookies' },
    openGraph: {
        title: 'Politique Cookies',
        description: 'Informations sur l’utilisation des cookies et traceurs, le paramétrage du consentement et vos droits.',
        url: '/cookies',
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

export default function CookiesPage() {
    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Politique Cookies',
        about: SITE_NAME,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME },
        publisher: {
            '@type': 'Organization',
            name: LEGAL_NAME,
            url: '/',
            email: EMAIL_CONTACT,
            telephone: PHONE_CONTACT,
            address: { '@type': 'PostalAddress', streetAddress: POSTAL_ADDRESS, addressCountry: 'FR' },
        },
        dateModified: lastUpdated.split('/').reverse().join('-'),
    } as const;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-10 md:py-12 space-y-8 overflow-x-hidden">
            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Politique Cookies</h1>
                        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {lastUpdated}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href="/privacy" className="btn text-sm">
                            <Shield className="h-4 w-4" /> Confidentialité
                        </a>
                        <a href="/legal" className="btn-secondary text-sm">
                            <Building2 className="h-4 w-4" /> Mentions légales
                        </a>
                    </div>
                </div>

                {/* Mini KPIs */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <CookieIcon className="h-4 w-4" /> Types
                        </div>
                        <div className="mt-1 text-sm font-medium">Nécessaires, Préférences, Mesure, Marketing</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Settings className="h-4 w-4" /> Consentement
                        </div>
                        <div className="mt-1 text-sm font-medium">Paramétrable à tout moment</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Mesure d’audience
                        </div>
                        <div className="mt-1 text-sm font-medium">Statistiques agrégées</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4 border border-white/60">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Timer className="h-4 w-4" /> Durées
                        </div>
                        <div className="mt-1 text-sm font-medium">Fonction de la finalité</div>
                    </div>
                </div>
            </div>

            {/* Body with sticky TOC */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:sticky lg:top-24 h-max">
                    <h2 className="text-base font-semibold">Sommaire</h2>
                    <ul className="mt-3 flex flex-wrap lg:flex-col gap-2">
                        <TocItem href="#intro" label="1. Qu’est-ce qu’un cookie ?" />
                        <TocItem href="#types" label="2. Types de cookies utilisés" />
                        <TocItem href="#consentement" label="3. Votre consentement" />
                        <TocItem href="#gerer" label="4. Gérer vos préférences" />
                        <TocItem href="#liste" label="5. Liste des cookies" />
                        <TocItem href="#tiers" label="6. Cookies tiers" />
                        <TocItem href="#navigateur" label="7. Paramétrer depuis le navigateur" />
                        <TocItem href="#durees" label="8. Durées de conservation" />
                        <TocItem href="#contact" label="9. Contact & droits" />
                        <TocItem href="#maj" label="10. Mises à jour" />
                    </ul>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <Section id="intro" icon={<CookieIcon className="h-5 w-5" />} title="1. Qu’est-ce qu’un cookie ?">
                            <p>
                                Un cookie est un petit fichier texte déposé sur votre appareil lorsque vous visitez un site. Il permet au site de reconnaître votre appareil, de
                                mémoriser vos préférences ou d’analyser l’usage qui en est fait.
                            </p>
                        </Section>

                        <Section id="types" icon={<BarChart3 className="h-5 w-5" />} title="2. Types de cookies utilisés">
                            <ul>
                                <li>
                                    <strong>Strictement nécessaires</strong> : indispensables au fonctionnement du site (authentification, sécurité, chargement des pages). Ils ne
                                    requièrent pas votre consentement.
                                </li>
                                <li>
                                    <strong>Préférences</strong> : mémorisent vos choix (langue, affichage, consentements).
                                </li>
                                <li>
                                    <strong>Mesure d’audience</strong> : statistiques anonymisées/agrégées pour améliorer le site. Déposés avec votre consentement lorsque requis.
                                </li>
                                <li>
                                    <strong>Marketing</strong> : personnalisation, suivi multi-sites. Toujours soumis à votre consentement préalable.
                                </li>
                            </ul>
                        </Section>

                        <Section id="consentement" icon={<Shield className="h-5 w-5" />} title="3. Votre consentement">
                            <p>
                                Lors de votre première visite, une bannière vous propose d’accepter, refuser ou personnaliser les cookies non nécessaires. Votre choix peut être
                                modifié à tout moment (voir ci-dessous).
                            </p>
                        </Section>

                        <Section id="gerer" icon={<Settings className="h-5 w-5" />} title="4. Gérer vos préférences">
                            <p>Vous pouvez ajuster vos préférences cookies à tout moment sur la page dédiée :</p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link href="/cookies/preferences" className="btn text-sm inline-flex items-center gap-2">
                                    <MousePointerClick className="h-4 w-4" />
                                    Gérer mes cookies
                                </Link>

                                <Link href="/privacy" className="btn-secondary text-sm inline-flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Politique de confidentialité
                                </Link>
                            </div>
                        </Section>

                        <Section id="liste" icon={<CookieIcon className="h-5 w-5" />} title="5. Liste des cookies">
                            <p>Ci-dessous, un tableau d’exemple. Remplace-le par la liste générée par ton CMP ou par ta propre table si tu n’utilises pas de CMP.</p>
                            <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-muted/40">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Nom</th>
                                            <th className="px-3 py-2 text-left">Fournisseur</th>
                                            <th className="px-3 py-2 text-left">Finalité</th>
                                            <th className="px-3 py-2 text-left">Durée</th>
                                            <th className="px-3 py-2 text-left">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/70">
                                        <tr className="border-t border-border/60">
                                            <td className="px-3 py-2">__cf_bm</td>
                                            <td className="px-3 py-2">Cloudflare</td>
                                            <td className="px-3 py-2">Protection/anti-bot</td>
                                            <td className="px-3 py-2">30 minutes</td>
                                            <td className="px-3 py-2">HTTP, nécessaire</td>
                                        </tr>
                                        <tr className="border-t border-border/60">
                                            <td className="px-3 py-2">_ga*</td>
                                            <td className="px-3 py-2">Google Analytics</td>
                                            <td className="px-3 py-2">Mesure d’audience</td>
                                            <td className="px-3 py-2">13 mois (FR)</td>
                                            <td className="px-3 py-2">HTTP, statistique</td>
                                        </tr>
                                        <tr className="border-t border-border/60">
                                            <td className="px-3 py-2">axeptio_authorized_vendors</td>
                                            <td className="px-3 py-2">Axeptio</td>
                                            <td className="px-3 py-2">Stocke le consentement</td>
                                            <td className="px-3 py-2">12 mois</td>
                                            <td className="px-3 py-2">HTTP, préférence</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        <Section id="tiers" icon={<BarChart3 className="h-5 w-5" />} title="6. Cookies tiers">
                            <p>
                                Certains cookies sont déposés par des tiers (hébergeur, mesure d’audience, réseaux sociaux, paiement). Nous vous invitons à consulter leurs
                                politiques respectives.
                            </p>
                        </Section>

                        <Section id="navigateur" icon={<Settings className="h-5 w-5" />} title="7. Paramétrer depuis le navigateur">
                            <p>Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies. Consultez les pages d’aide correspondantes :</p>
                            <ul>
                                <li>
                                    <a className="underline underline-offset-4" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">
                                        Chrome <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                    </a>
                                </li>
                                <li>
                                    <a className="underline underline-offset-4" href="https://support.mozilla.org/kb/cookies-informations-sites" target="_blank" rel="noreferrer">
                                        Firefox <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="underline underline-offset-4"
                                        href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Safari <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                    </a>
                                </li>
                                <li>
                                    <a className="underline underline-offset-4" href="https://support.microsoft.com/microsoft-edge" target="_blank" rel="noreferrer">
                                        Edge <ExternalLink className="inline h-3 w-3 align-[-2px]" />
                                    </a>
                                </li>
                            </ul>
                        </Section>

                        <Section id="durees" icon={<Timer className="h-5 w-5" />} title="8. Durées de conservation">
                            <p>
                                Les durées varient selon la finalité : sécurité (session), préférences (jusqu’à 12 mois), mesure d’audience (jusqu’à 13 mois en France), marketing
                                (selon tiers et consentement).
                            </p>
                        </Section>

                        <Section id="contact" icon={<Mail className="h-5 w-5" />} title="9. Contact & droits">
                            <p>
                                Pour toute question ou pour exercer vos droits (accès, rectification, opposition, effacement, limitation, portabilité, directives post-mortem),
                                écrivez-nous à{' '}
                                <a className="underline underline-offset-4" href={`mailto:${EMAIL_CONTACT}`}>
                                    {EMAIL_CONTACT}
                                </a>
                                .
                            </p>
                            {PHONE_CONTACT ? (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-brand-700" />
                                    <span>Appelez-nous au {PHONE_CONTACT}</span>
                                </p>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Link href="/privacy" className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                    Politique de confidentialité
                                </Link>
                                <Link href="/legal" className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                    Mentions légales
                                </Link>
                            </div>
                        </Section>

                        <Section id="maj" icon={<FileText className="h-5 w-5" />} title="10. Mises à jour">
                            <p>
                                Nous pouvons modifier cette politique afin de refléter les évolutions légales, techniques ou opérationnelles. La date de dernière mise à jour est
                                indiquée en haut de page.
                            </p>
                        </Section>
                    </Card>
                </div>
            </div>
        </div>
    );
}
