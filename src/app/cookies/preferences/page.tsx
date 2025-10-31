import type { Metadata } from 'next';
import Link from 'next/link';
import { Settings, ArrowLeft, Shield } from 'lucide-react';
import PreferencesForm from './components/PreferencesForm';

export const metadata: Metadata = {
    title: 'Préférences Cookies',
    description: 'Gérez votre consentement et vos préférences de cookies sur le site Ancre-toi.',
    alternates: { canonical: '/cookies/preferences' },
    openGraph: {
        title: 'Préférences Cookies',
        description: 'Gérez votre consentement et vos préférences de cookies sur le site Ancre-toi.',
        url: '/cookies/preferences',
        siteName: 'Ancre-toi',
        type: 'website',
    },
};

export default function CookiesPreferencesPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 py-10 md:py-14 space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Settings className="h-5 w-5 text-brand-700" />
                        Préférences cookies
                    </h1>
                    <div className="flex gap-2">
                        <Link href="/cookies" className="btn-secondary text-sm inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Retour
                        </Link>
                        <Link href="/privacy" className="btn text-sm inline-flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Confidentialité
                        </Link>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Gérez ici vos préférences de dépôt de cookies sur <strong>Ancre-toi</strong>.
                </p>
            </div>

            {/* Formulaire (client) */}
            <div className="rounded-2xl border border-brand-200 bg-white/80 ring-1 ring-white/40 shadow-sm p-6">
                <p className="text-sm text-muted-foreground mb-6">
                    Choisissez les catégories de cookies que vous autorisez. Vos choix sont enregistrés pour 12 mois et peuvent être modifiés à tout moment.
                </p>

                <PreferencesForm cookieName="at_consent" cookieDays={365} initial={{ preferences: false, analytics: false, marketing: false }} />
            </div>

            <div className="text-sm text-muted-foreground">
                Pour plus d’informations, consultez la{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-brand-700">
                    Politique de confidentialité
                </Link>{' '}
                ou les{' '}
                <Link href="/cookies" className="underline underline-offset-4 hover:text-brand-700">
                    Informations sur les cookies
                </Link>
                .
            </div>
        </div>
    );
}
