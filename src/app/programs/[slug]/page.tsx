// app/programs/[slug]/page.tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProgram, formatPrice } from '@/lib/programs-index';
import BuyButton from '@/components/BuyButton';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };

export default async function ProgramDetail({ params }: Props) {
    const { slug } = await params;
    const p = getProgram(slug);
    if (!p) return notFound();

    const price = formatPrice(p.price);
    const isDraft = p.status !== 'published';
    const isFree = p.price?.amount_cents === 0;

    return (
        <div className="mx-auto max-w-3xl space-y-6 py-16 sm:py-20 lg:py-24">
            <Link href="/programs" className="underline">
                ← Programmes
            </Link>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
                {p.cover ? <Image src={p.cover} alt={`Couverture du programme ${p.title}`} fill sizes="100vw" priority className="object-cover" /> : null}
            </div>

            <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {p.level} • {p.duration_days} jours
            </div>
            <h1 className="font-serif text-4xl">{p.title}</h1>
            <p className="text-lg text-muted-foreground">{p.tagline}</p>

            {!isDraft && (
                <div className="rounded-xl border bg-card/50 p-4">
                    <div className="flex items-baseline gap-3">
                        {p.price?.compare_at_cents && p.price.amount_cents !== null && p.price.compare_at_cents > p.price.amount_cents ? (
                            <>
                                <div className="text-2xl font-semibold">{price}</div>
                                <div className="text-sm text-muted-foreground line-through">
                                    {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: p.price.currency,
                                    }).format(p.price.compare_at_cents / 100)}
                                </div>
                            </>
                        ) : (
                            <div className="text-2xl font-semibold">{price ?? 'Prix à venir'}</div>
                        )}
                    </div>

                    <div className="mt-3">
                        {p.price?.amount_cents === null ? (
                            <button className="cursor-not-allowed rounded-lg bg-muted px-4 py-2 text-foreground/70">Bientôt</button>
                        ) : (
                            <BuyButton slug={p.slug} isFree={isFree} />
                        )}
                    </div>

                    {p.price?.tax_included && p.price?.amount_cents !== null && <div className="mt-1 text-xs text-muted-foreground">Prix TTC</div>}
                </div>
            )}

            {/* sections descriptives */}
            <section>
                <h2 className="mb-2 text-xl font-semibold">Pour qui ?</h2>
                <p>{p.detail.who}</p>
            </section>
            <section>
                <h2 className="mb-2 text-xl font-semibold">Objectifs</h2>
                <ul className="space-y-1 list-disc pl-5">
                    {p.detail.goals.map((g, i) => (
                        <li key={i}>{g}</li>
                    ))}
                </ul>
            </section>
            <section>
                <h2 className="mb-2 text-xl font-semibold">Ce qui est inclus</h2>
                <ul className="space-y-1 list-disc pl-5">
                    {p.detail.includes.map((g, i) => (
                        <li key={i}>{g}</li>
                    ))}
                </ul>
            </section>
            <section>
                <h2 className="mb-2 text-xl font-semibold">Résultats attendus</h2>
                <ul className="space-y-1 list-disc pl-5">
                    {p.detail.outcomes.map((g, i) => (
                        <li key={i}>{g}</li>
                    ))}
                </ul>
            </section>
            <section>
                <h2 className="mb-2 text-xl font-semibold">FAQ</h2>
                <div className="space-y-3">
                    {p.detail.faq.map((f, i) => (
                        <details key={i} className="rounded-lg border p-3">
                            <summary className="cursor-pointer font-medium">{f.q}</summary>
                            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}
