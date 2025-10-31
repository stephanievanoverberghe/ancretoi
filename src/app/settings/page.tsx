// src/app/settings/page.tsx
import 'server-only';
import Link from 'next/link';
import { Suspense } from 'react';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';

// Clients existants
import UpdatePrefsClient from './components/UpdatePrefsClient';
import AvatarUploadClient from './components/AvatarUploadClient';
import DangerZoneClient from './components/DangerZoneClient';
import PasswordChangeClient from './components/PasswordChangeClient';
import TwoFactorClient from './components/TwoFactorClient';
import DataExportClient from './components/DataExportClient';
import CookieQuickPrefsClient from './components/CookieQuickPrefsClient';
import EmailChangeClient from './components/EmailChangeClient';
import SessionsListClient from './components/SessionsListClient';
import ThemeLivePreview from './components/ThemeLivePreview';
import CookieBannerTrigger from './components/CookiesBanner';
import AccessibilityPrefsClient from './components/AccessibilityPrefsClient';
import RecoveryContactsClient from './components/RecoveryContactsClient';
import ActivityLogClient from './components/ActivityLogClient';

import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ShieldCheck, Mail, Bell, MonitorSmartphone, Shield, Cookie, Gauge, Database, Sparkles, Settings, LogOut } from 'lucide-react';

type PublicUser = {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
};

function Section({ id, icon, title, subtitle, children }: { id: string; icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-28 rounded-2xl border border-brand-200/60 bg-white/80 ring-1 ring-white/40 shadow-sm p-5 md:p-6 backdrop-blur">
            <header className="mb-4">
                <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">{icon}</span>
                    <div>
                        <h2 className="text-base md:text-lg font-semibold tracking-tight">{title}</h2>
                        {subtitle && <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
            </header>
            {children}
        </section>
    );
}

export default async function SettingsPage() {
    const sess = await getSession();
    if (!sess?.email) return null;

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email })
        .select({ email: 1, name: 1, avatarUrl: 1, theme: 1, marketing: 1, productUpdates: 1, _id: 0 })
        .lean<PublicUser>()
        .exec();

    const displayName = user?.name ?? '';
    const first = displayName ? displayName.split(' ')[0] : '';

    // De petits KPIs “admin style”
    const kpis = [
        { icon: <Gauge className="h-4 w-4" />, label: 'Profil complété', value: (user?.name ? 60 : 40) + (user?.avatarUrl ? 40 : 0), suffix: '%' },
        {
            icon: <ShieldCheck className="h-4 w-4" />,
            label: 'Sécurité',
            value: (user?.theme ? 30 : 0) + 30 /* pwd ok (indicatif) */ + 0 /* 2FA à détecter côté API */,
            suffix: '/100',
        },
        { icon: <MonitorSmartphone className="h-4 w-4" />, label: 'Sessions actives', value: '—' },
        { icon: <Database className="h-4 w-4" />, label: 'Export dispo', value: 'JSON' },
    ];

    return (
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14 sm:px-6">
            {/* ===== HERO “Admin-like” ===== */}
            <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 ring-1 ring-black/5 p-5 md:p-6 backdrop-blur">
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_80%_0%,#000_15%,transparent_75%)]">
                    <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
                </div>

                <div className="relative">
                    <Breadcrumbs items={[{ label: 'Mon espace', href: '/member' }, { label: 'Paramètres' }]} />

                    <div className="mt-3 flex items-start gap-4">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Paramètres</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {first ? `Bienvenue, ${first}. ` : ''}Gère ton profil, tes préférences, ta confidentialité et la sécurité de ton compte.
                            </p>

                            {/* KPIs style admin */}
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {kpis.map((k, i) => (
                                    <div key={i} className="rounded-xl bg-white/70 ring-1 ring-black/5 p-3 border border-white/60">
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                            {k.icon}
                                            {k.label}
                                        </div>
                                        <div className="mt-1 text-xl font-semibold tabular-nums">
                                            {typeof k.value === 'number' ? k.value : k.value} {k.suffix ?? ''}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions rapides */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <a href="#preferences" className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-3 py-1.5 text-sm hover:bg-brand-50">
                                    <Sparkles className="h-4 w-4" /> Changer de thème
                                </a>
                                <form action="/api/settings/logout-everywhere" method="post">
                                    <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                                        <LogOut className="h-4 w-4" /> Déconnexion globale
                                    </button>
                                </form>
                                <a href="#privacy" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                                    <Database className="h-4 w-4" /> Exporter mes données
                                </a>
                                <CookieBannerTrigger />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Layout 2 colonnes ===== */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* Colonne principale */}
                <div className="space-y-6">
                    {/* Profil */}
                    <Section id="profil" icon={<Settings className="h-4 w-4" />} title="Profil" subtitle="Avatar, nom affiché & e-mail">
                        <div className="grid gap-5 md:grid-cols-[240px_1fr]">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <AvatarUploadClient initialAvatarUrl={user?.avatarUrl ?? null} initialName={user?.name ?? ''} />
                            </div>
                            <div className="rounded-xl border border-border bg-background p-3">
                                <dl className="grid gap-3 text-sm">
                                    <div className="grid gap-1">
                                        <dt className="text-muted-foreground">Adresse e-mail</dt>
                                        <dd className="inline-flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium break-all">{user?.email}</span>
                                        </dd>
                                    </div>
                                    <div className="grid gap-1">
                                        <dt className="text-muted-foreground">Nom affiché</dt>
                                        <dd className="text-foreground">{user?.name ?? '—'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </Section>

                    {/* Préférences */}
                    <Section id="preferences" icon={<Bell className="h-4 w-4" />} title="Préférences" subtitle="Thème, langue, notifications et accessibilité">
                        <div className="grid gap-4">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Thème & notifications</div>
                                <UpdatePrefsClient
                                    initial={{
                                        theme: (user?.theme ?? 'system') as 'system' | 'light' | 'dark',
                                        marketing: !!user?.marketing,
                                        productUpdates: !!user?.productUpdates,
                                    }}
                                />
                                <div className="mt-3">
                                    <ThemeLivePreview />
                                </div>
                            </div>
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Langue & accessibilité</div>
                                <div className="space-y-4">
                                    <AccessibilityPrefsClient />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Confidentialité & données */}
                    <Section id="privacy" icon={<Cookie className="h-4 w-4" />} title="Confidentialité & données" subtitle="Consentement cookies, export et contrôle">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Consentement cookies (raccourci)</div>
                                <CookieQuickPrefsClient />
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Pour le détail, va sur{' '}
                                    <Link className="underline" href="/cookies/preferences">
                                        Préférences cookies
                                    </Link>
                                    .
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Exporter mes données</div>
                                <p className="text-xs text-muted-foreground mb-2">Récupère un export JSON de tes données de compte.</p>
                                <DataExportClient />
                            </div>
                        </div>
                    </Section>

                    {/* Sécurité */}
                    <Section id="security" icon={<ShieldCheck className="h-4 w-4" />} title="Sécurité" subtitle="Mot de passe, e-mail, 2FA & récupération">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Mot de passe</div>
                                <PasswordChangeClient />
                            </div>

                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Adresse e-mail</div>
                                <EmailChangeClient current={user?.email ?? ''} />
                            </div>

                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Validation en 2 étapes (TOTP)</div>
                                <TwoFactorClient />
                            </div>

                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="mb-2 text-sm font-medium">Contacts de récupération</div>
                                <RecoveryContactsClient />
                            </div>
                        </div>
                    </Section>

                    {/* Sessions */}
                    <Section id="sessions" icon={<MonitorSmartphone className="h-4 w-4" />} title="Appareils & sessions" subtitle="Gère tes connexions actives">
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-sm font-medium">Déconnexion globale</div>
                                        <div className="text-xs text-muted-foreground">Si tu suspectes une activité anormale, déconnecte toutes les sessions.</div>
                                    </div>
                                    <form action="/api/settings/logout-everywhere" method="post">
                                        <button className="rounded-lg px-3 py-1.5 text-sm text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                            Déconnecter tous les appareils
                                        </button>
                                    </form>
                                </div>
                                <p className="mt-2 text-[11px] text-muted-foreground">Astuce : change ton mot de passe après une déconnexion globale.</p>
                            </div>
                            <div className="rounded-xl border border-border bg-background p-3">
                                <header className="mb-3 text-sm font-semibold">Sessions</header>
                                <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement des sessions…</div>}>
                                    <SessionsListClient />
                                </Suspense>
                            </div>
                            <div className="rounded-xl border border-border bg-background p-3">
                                <header className="mb-3 text-sm font-semibold">Historique d’activité</header>
                                <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement de l’activité…</div>}>
                                    <ActivityLogClient />
                                </Suspense>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Colonne droite sticky */}
                <aside className="space-y-6 lg:sticky lg:top-24 lg:h-max">
                    <section className="rounded-2xl border border-brand-200 bg-white/80 p-5 ring-1 ring-white/40 shadow-sm">
                        <header className="mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-brand-600" />
                            <h3 className="text-base font-semibold">Résumé compte</h3>
                        </header>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">E-mail</span>
                                <span className="font-medium break-all">{user?.email}</span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Thème</span>
                                <span className="font-medium">{(user?.theme ?? 'system') === 'system' ? 'Système' : user?.theme === 'light' ? 'Clair' : 'Sombre'}</span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Marketing</span>
                                <span className="font-medium">{user?.marketing ? 'Abonné' : 'Désabonné'}</span>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Nouveautés produit</span>
                                <span className="font-medium">{user?.productUpdates ? 'Activées' : 'Désactivées'}</span>
                            </li>
                        </ul>

                        {/* Raccourcis comme l'admin */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href="/privacy" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                Politique de confidentialité
                            </Link>
                            <Link href="/cookies" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                Infos cookies
                            </Link>
                            <Link href="/help" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                Centre d’aide
                            </Link>
                        </div>
                    </section>
                    {/* Danger zone */}
                    <Section id="danger" icon={<Shield className="h-4 w-4" />} title="Zone à risque" subtitle="Suppression définitive du compte">
                        <DangerZoneClient email={user?.email ?? ''} />
                    </Section>
                </aside>
            </div>
        </main>
    );
}
