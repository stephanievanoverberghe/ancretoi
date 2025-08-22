import Link from 'next/link';

const progs = [
    { slug: 'reset-7', title: 'RESET-7', desc: '7 jours · 10–15 min/jour', price: '39 €' },
    { slug: 'boussole-10', title: 'BOUSSOLE-10', desc: '10 jours · clarté & cap', price: '69 €' },
    { slug: 'ancre-30', title: 'ANCRE-30', desc: '30 jours · ancrage quotidien', price: '149 €' },
    { slug: 'alchimie-90', title: 'ALCHIMIE-90', desc: '12 semaines · transformation', price: '399 €' },
];

export default function Programs() {
    return (
        <section className="space-y-6">
            <h1 className="text-3xl font-semibold">Programmes</h1>
            <div className="grid gap-4 sm:grid-cols-2">
                {progs.map((p) => (
                    <Link key={p.slug} href={`/programmes/${p.slug}`} className="rounded-xl border p-4 hover:shadow-sm">
                        <h2 className="text-xl font-semibold">{p.title}</h2>
                        <p className="text-neutral-600">{p.desc}</p>
                        <div className="mt-2 text-sm text-neutral-900">{p.price}</div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
