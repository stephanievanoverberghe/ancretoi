import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';
import UpdatePrefsClient from './UpdatePrefsClient';
import AvatarUploadClient from './AvatarUploadClient';
import DangerZoneClient from './DangerZoneClient';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ShieldCheck, Mail, Bell, MonitorSmartphone, KeyRound, User2 } from 'lucide-react';

type PublicUser = {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    return (
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_60%_0%,#000_15%,transparent_75%)]">
                    <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-gold-200/30 blur-3xl" />
                </div>
                <div className="relative p-6 sm:p-8">
                    {/* Fil d’Ariane */}
                    <Breadcrumbs items={[{ label: 'Mon espace', href: '/member' }, { label: 'Paramètres' }]} />

                    <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-border bg-white">
                            {user?.avatarUrl ? (
                                <Image src={user.avatarUrl} alt="" fill className="object-cover" />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-muted-foreground">
                                    <User2 className="h-7 w-7" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {first ? `Bienvenue, ${first}. ` : ''}Gère ton profil, tes préférences et la sécurité de ton compte.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layout 2 colonnes */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Colonne principale */}
                <div className="space-y-6">
                    {/* Profil & avatar */}
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <header className="mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-brand-600" />
                            <h2 className="text-base font-semibold">Profil</h2>
                        </header>

                        <div className="grid gap-5 md:grid-cols-[200px_1fr]">
                            {/* ✅ Carte unique : avatar + nom (édition dans AvatarUploadClient) */}
                            <div className="rounded-xl border border-border bg-background p-3">
                                <AvatarUploadClient initialAvatarUrl={user?.avatarUrl ?? null} initialName={user?.name ?? ''} />
                            </div>

                            {/* ✅ Infos en lecture seule (plus de second formulaire) */}
                            <div className="rounded-xl border border-border bg-background p-3">
                                <dl className="grid gap-3 text-sm">
                                    <div className="grid gap-1">
                                        <dt className="text-muted-foreground">Adresse e-mail</dt>
                                        <dd className="inline-flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{user?.email}</span>
                                        </dd>
                                    </div>
                                    <div className="grid gap-1">
                                        <dt className="text-muted-foreground">Nom affiché</dt>
                                        <dd className="text-foreground">{user?.name ?? '—'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    {/* Préférences */}
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <header className="mb-4 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-brand-600" />
                            <h2 className="text-base font-semibold">Préférences</h2>
                        </header>

                        <UpdatePrefsClient
                            initial={{
                                theme: (user?.theme ?? 'system') as 'system' | 'light' | 'dark',
                                marketing: !!user?.marketing,
                                productUpdates: !!user?.productUpdates,
                            }}
                        />
                    </section>

                    {/* Sécurité */}
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <header className="mb-4 flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-brand-600" />
                            <h2 className="text-base font-semibold">Sécurité</h2>
                        </header>

                        <div className="grid gap-3">
                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-medium">Mot de passe</div>
                                        <div className="text-xs text-muted-foreground">Change ton mot de passe régulièrement.</div>
                                    </div>
                                    <Link href="/reset-password" className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                                        Modifier
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-background p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-sm font-medium">Appareils & sessions</div>
                                        <div className="text-xs text-muted-foreground">Tu vois une activité suspecte ? Déconnecte tout le monde.</div>
                                    </div>
                                    <form action="/api/settings/logout-everywhere" method="post">
                                        <button className="rounded-lg px-3 py-1.5 text-sm text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                            Déconnecter tous les appareils
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Colonne droite */}
                <aside className="space-y-6">
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <header className="mb-3 flex items-center gap-2">
                            <MonitorSmartphone className="h-5 w-5 text-brand-600" />
                            <h3 className="text-base font-semibold">Résumé compte</h3>
                        </header>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">E-mail</span>
                                <span className="font-medium">{user?.email}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Thème</span>
                                <span className="font-medium">{(user?.theme ?? 'system') === 'system' ? 'Système' : user?.theme === 'light' ? 'Clair' : 'Sombre'}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Marketing</span>
                                <span className="font-medium">{user?.marketing ? 'Abonné' : 'Désabonné'}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Nouveautés produit</span>
                                <span className="font-medium">{user?.productUpdates ? 'Activées' : 'Désactivées'}</span>
                            </li>
                        </ul>
                    </section>

                    {/* Danger zone */}
                    <DangerZoneClient email={user?.email ?? ''} />
                </aside>
            </div>
        </main>
    );
}
