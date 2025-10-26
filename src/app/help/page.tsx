import 'server-only';
import Link from 'next/link';
import { HelpCircle, Mail, MessageSquare, LifeBuoy, BookOpen, NotebookPen, PlayCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HelpPage() {
    const faqs: { q: string; a: React.ReactNode }[] = [
        {
            q: 'Je ne peux pas accéder au jour suivant',
            a: (
                <p className="text-sm text-muted-foreground">
                    Le parcours est séquentiel. Pour débloquer le jour suivant, coche <span className="font-medium text-foreground">“Pratique faite”</span> et écris au moins une
                    réponse dans le journal. Ensuite, clique sur <span className="font-medium text-foreground">“Valider”</span> en haut à droite de la leçon.
                </p>
            ),
        },
        {
            q: 'Comment réinitialiser un jour ou tout le programme ?',
            a: (
                <p className="text-sm text-muted-foreground">
                    Dans la page d’une leçon, utilise le bouton <span className="font-medium text-foreground">“Effacer”</span> (modale de confirmation). Depuis la{' '}
                    <Link href="/learn/ancre-toi/conclusion" className="underline hover:text-foreground">
                        conclusion
                    </Link>
                    , tu peux réinitialiser <span className="font-medium text-foreground">tout le programme</span> (toutes les données seront supprimées).
                </p>
            ),
        },
        {
            q: 'Où retrouver / exporter mes notes ?',
            a: (
                <p className="text-sm text-muted-foreground">
                    Rendez-vous sur{' '}
                    <Link href="/notes" className="underline hover:text-foreground">
                        Mon carnet
                    </Link>{' '}
                    pour voir vos réponses et exporter en <span className="font-medium text-foreground">PDF</span> ou <span className="font-medium text-foreground">JSON</span>.
                </p>
            ),
        },
        {
            q: 'Problème d’affichage ou bug',
            a: (
                <p className="text-sm text-muted-foreground">
                    Videz le cache/navigateur, réessayez en navigation privée, puis changez de navigateur. Si le problème persiste, contactez-nous avec une capture d’écran et l’URL
                    concernée.
                </p>
            ),
        },
        {
            q: 'Paiement ou accès aux programmes',
            a: (
                <p className="text-sm text-muted-foreground">
                    Si un achat ne s’affiche pas, déconnectez-vous / reconnectez-vous. Vérifiez que vous utilisez le bon e-mail. Contactez-nous en indiquant la date et les 4
                    derniers chiffres de la carte utilisée.
                </p>
            ),
        },
    ];

    return (
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
            {/* Fil d’Ariane */}
            <Breadcrumbs items={[{ label: 'Mon espace', href: '/member' }, { label: 'Aide' }]} />

            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 backdrop-blur">
                <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                        <HelpCircle className="h-6 w-6 text-brand-600" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Centre d’aide</h1>
                        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                            On t’aide à avancer sereinement : questions fréquentes, résolution rapide des soucis, et comment nous contacter.
                        </p>

                        {/* Liens rapides */}
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            <QuickLink href="/continue" icon={<PlayCircle className="h-4 w-4" />} label="Continuer une leçon" />
                            <QuickLink href="/notes" icon={<NotebookPen className="h-4 w-4" />} label="Voir mes notes" />
                            <QuickLink href="/library" icon={<BookOpen className="h-4 w-4" />} label="Ressources" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACTS */}
            <section className="mt-8 grid gap-4 md:grid-cols-3">
                <ContactCard
                    title="Nous écrire"
                    desc="Pose une question ou signale un bug avec un maximum de détails."
                    actionLabel="Ouvrir l’e-mail"
                    href="mailto:support@exemple.com?subject=Support%20Ancre%20Toi&body=Explique ton souci ici (URL%20:%20…%20%7C%20navigateur%20:%20…%20%7C%20capture%20:%20…)"
                    icon={<Mail className="h-4 w-4" />}
                />
                <ContactCard
                    title="Assistance rapide"
                    desc="Besoin d’un coup de main immédiat ? On te répond vite."
                    actionLabel="Ouvrir le formulaire"
                    href="/contact"
                    icon={<MessageSquare className="h-4 w-4" />}
                />
                <ContactCard
                    title="Sécurité & accès"
                    desc="Problème de connexion ou d’accès : vérifie ces points."
                    actionLabel="Consulter"
                    href="#troubleshooting"
                    icon={<LifeBuoy className="h-4 w-4" />}
                />
            </section>

            {/* FAQ */}
            <section className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-foreground">Questions fréquentes</h2>
                <div className="mt-4 divide-y divide-border">
                    {faqs.map((item) => (
                        <details key={item.q} className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium text-foreground">
                                <span>{item.q}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                            </summary>
                            <div className="pb-4">{item.a}</div>
                        </details>
                    ))}
                </div>
            </section>

            {/* TROUBLESHOOTING */}
            <section id="troubleshooting" className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Résolution rapide</h2>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
                            <li>Essaye une autre connexion (4G/Wi-Fi) et recharge la page.</li>
                            <li>Ouvre en navigation privée, ou vide le cache du navigateur.</li>
                            <li>
                                Vérifie que tu es bien connecté·e avec <span className="font-medium text-foreground">le bon e-mail</span>.
                            </li>
                            <li>Sur mobile, force la fermeture de l’application / onglet puis relance.</li>
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href="/continue" className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                                Reprendre une leçon
                            </Link>
                            <Link href="/notes" className="rounded-xl px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                Voir mes notes
                            </Link>
                            <Link href="/library" className="rounded-xl px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                                Ressources
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

/* ── UI sous-composants (server-safe) ─────────────────────────────────── */

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

function ContactCard({ title, desc, actionLabel, href, icon }: { title: string; desc: string; actionLabel: string; href: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-muted/70">{icon}</div>
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                    <div className="mt-3">
                        <Link href={href} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                            {actionLabel}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
