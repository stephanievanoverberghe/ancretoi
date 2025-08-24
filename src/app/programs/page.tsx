// app/programs/page.tsx
import type { Metadata } from 'next';
import ProgramsHero from '@/components/sections/programs/ProgramsHero';
import ProgramsGrid from '@/components/sections/home/ProgramsGrid';
import { PROGRAMS } from '@/lib/programs-index';

export const metadata: Metadata = {
    title: 'Programmes — Ancre-toi',
    description: 'Parcours bien-être courts, simples et tenables.',
    openGraph: {
        title: 'Programmes — Ancre-toi',
        description: 'Parcours bien-être courts, simples et tenables.',
    },
};

export default function ProgramsPage() {
    return (
        <>
            <ProgramsHero />
            <section id="grid" aria-labelledby="programs-grid-title" className="py-10">
                <h2 id="programs-grid-title" className="sr-only">
                    Choisir mon programme
                </h2>
                <ProgramsGrid programs={PROGRAMS} />
            </section>
        </>
    );
}
