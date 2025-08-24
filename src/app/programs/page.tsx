// app/programs/page.tsx
import type { Metadata } from 'next';
import data from '@/data/programs/index.json';
import ProgramsHero from '@/components/sections/programs/ProgramsHero';
import CollectionsGrid from '@/components/sections/programs/CollectionsGrid';
import ProgramsCompare from '@/components/sections/programs/Compare';
import Inside from '@/components/sections/programs/Inside';

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
            <CollectionsGrid programs={data.programs} />
            <ProgramsCompare />
            <Inside />
        </>
    );
}
