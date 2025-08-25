import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProgram } from '@/lib/programs-index';
import { getChargeLabel } from '@/lib/programs-compare';
import Hero from '@/components/program/sections/Hero';
import Who from '@/components/program/sections/Who';
import Experience from '@/components/program/sections/Experience';
import Inside from '@/components/program/sections/Inside';
import MethodMini from '@/components/program/sections/MethodMini';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const program = getProgram(slug);
    if (!program) {
        return {
            title: 'Programme introuvable',
            description: "Ce programme n'est pas (ou plus) disponible.",
            robots: { index: false, follow: false },
        };
    }

    const charge = getChargeLabel(program.slug) ?? '10–20 min/j';
    const titleBase = `${program.title} — ${program.duration_days} jours`;
    const title = `${titleBase}`;
    const description = `${program.tagline} ${charge}. Accès à vie.`.trim();
    const url = `/programs/${program.slug}`;
    const ogImage = program.cover ?? '/images/og-default.png';

    return {
        title,
        description,
        keywords: [program.title, program.slug, charge, program.level, 'rituels courts', 'respiration 4-6', 'journal intégré', 'habitudes tenables', 'Ancre-toi'],
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            siteName: 'Ancre-toi',
            type: 'website',
            locale: 'fr_FR',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: `${program.title} — ${program.duration_days} jours`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = getProgram(slug);
    if (!program) return notFound();

    const dailyLoad = getChargeLabel(program.slug) ?? undefined;

    const schemaOrg: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: program.title,
        description: program.tagline,
        brand: { '@type': 'Brand', name: 'Ancre-toi' },
        url: `/programs/${program.slug}`,
        image: program.cover ? [program.cover] : undefined,
        offers:
            program.price?.amount_cents != null
                ? {
                      '@type': 'Offer',
                      priceCurrency: program.price.currency,
                      price: (program.price.amount_cents / 100).toFixed(2),
                      availability: 'https://schema.org/InStock',
                  }
                : {
                      '@type': 'Offer',
                      availability: 'https://schema.org/PreOrder',
                  },
    };

    return (
        <div className="lg:pb-0 pb-[calc(72px+env(safe-area-inset-bottom))]">
            {/* JSON-LD Product */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

            <Hero program={program} dailyLoadLabel={dailyLoad} />
            <Who program={program} />
            <Experience slug={program.slug} />
            <Inside slug={program.slug} />
            <MethodMini slug={program.slug} />
        </div>
    );
}
