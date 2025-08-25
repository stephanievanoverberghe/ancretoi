// app/programs/page.tsx
import type { Metadata } from 'next';
import data from '@/data/programs/index.json';
import ProgramsHero from '@/components/programs/sections/ProgramsHero';
import CollectionsGrid from '@/components/programs/sections/CollectionsGrid';
import ProgramsCompare from '@/components/programs/sections/Compare';
import Inside from '@/components/programs/sections/Inside';
import MethodMini from '@/components/programs/sections/MethodMini';
import ProgramsFAQ from '@/components/programs/sections/ProgramsFAQ';
import FinalCTA from '@/components/home/sections/FinalCTA';

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
            <MethodMini />
            <ProgramsFAQ />
            <FinalCTA />
        </>
    );
}
