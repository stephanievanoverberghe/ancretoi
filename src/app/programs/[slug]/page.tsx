// app/programs/[slug]/page.tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProgram, formatPrice } from '@/lib/programs-index';

type Props = { params: { slug: string } };

export default function ProgramDetail({ params }: Props) {
    const p = getProgram(params.slug);
    if (!p) return notFound();

    const price = formatPrice(p.price);
    const isDraft = p.status !== 'published';
    const isFree = p.price?.amount_cents === 0;

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <a href="/programs" className="underline">
                ← Programmes
            </a>

            {/* ⬇️ relative + fill */}
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
                                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: p.price.currency }).format(p.price.compare_at_cents / 100)}
                                </div>
                            </>
                        ) : (
                            <div className="text-2xl font-semibold">{price ?? 'Prix à venir'}</div>
                        )}
                    </div>

                    <div className="mt-3">
                        {p.price?.amount_cents === null ? (
                            <button className="cursor-not-allowed rounded-lg bg-muted px-4 py-2 text-foreground/70">Bientôt</button>
                        ) : isFree ? (
                            <a className="rounded-lg bg-brand px-4 py-2 text-white" href={`/membre/${p.slug}/jour/1`}>
                                Commencer gratuitement
                            </a>
                        ) : (
                            <a className="rounded-lg bg-brand px-4 py-2 text-white" href={`/programs/${p.slug}#commencer`}>
                                Acheter
                            </a>
                        )}
                    </div>

                    {p.price?.tax_included && p.price?.amount_cents !== null && <div className="mt-1 text-xs text-muted-foreground">Prix TTC</div>}
                </div>
            )}

            {/* ...le reste inchangé */}
        </div>
    );
}
