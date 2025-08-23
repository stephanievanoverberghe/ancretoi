// app/programs/page.tsx
'use client';

import Image from 'next/image';
import { PROGRAMS, formatPrice } from '@/lib/programs-index';

export default function ProgramsPage() {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-6 font-serif text-4xl">Programmes</h1>
            <div className="grid gap-6 md:grid-cols-2">
                {PROGRAMS.map((p) => {
                    const price = formatPrice(p.price);
                    const isDraft = p.status !== 'published';
                    return (
                        <a key={p.slug} href={`/programs/${p.slug}`} className="rounded-2xl border p-4 transition hover:shadow">
                            {/* ⬇️ ajoute relative ici */}
                            <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
                                {p.cover ? (
                                    <Image
                                        src={p.cover}
                                        alt={`Couverture du programme ${p.title}`}
                                        fill // ⬅️ pas besoin de width/height
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                    />
                                ) : null}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.level}</div>
                                <div className="text-sm font-medium">
                                    {isDraft ? <span className="rounded bg-muted px-2 py-0.5">Bientôt</span> : price ?? <span className="text-muted-foreground">À venir</span>}
                                </div>
                            </div>

                            <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
                            <p className="text-sm text-muted-foreground">{p.tagline}</p>

                            <ul className="mt-3 list-disc pl-5 text-sm">
                                {p.card_highlights.slice(0, 3).map((h, i) => (
                                    <li key={i}>{h}</li>
                                ))}
                            </ul>

                            <div className="mt-3 text-sm text-muted-foreground">{p.duration_days} jours</div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
