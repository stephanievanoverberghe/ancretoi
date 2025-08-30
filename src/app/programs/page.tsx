import type { Metadata } from 'next';
import 'server-only';

import CollectionsGridServer from '@/components/programs/sections/CollectionsGridServer';

import ProgramsHero from '@/components/programs/sections/ProgramsHero';
import ProgramsCompare from '@/components/programs/sections/Compare';
import Inside from '@/components/programs/sections/Inside';
import MethodMini from '@/components/programs/sections/MethodMini';
import ProgramsFAQ from '@/components/programs/sections/ProgramsFAQ';
import FinalCTA from '@/components/home/sections/FinalCTA';

export const metadata: Metadata = {
    title: 'Programmes',
    description: 'Parcours bien-être courts, simples et tenables.',
    openGraph: {
        title: 'Programmes — Ancre-toi',
        description: 'Parcours bien-être courts, simples et tenables.',
    },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ProgramsPage() {
    return (
        <>
            <ProgramsHero />
            <CollectionsGridServer />
            <ProgramsCompare />
            <Inside />
            <MethodMini />
            <ProgramsFAQ />
            <FinalCTA />
        </>
    );
}
