// app/page.tsx
import Hero from '@/components/sections/home/Hero';
import SocialProof from '@/components/sections/home/SocialProof';
import ProgramsGrid from '@/components/sections/home/ProgramsGrid';
import Pillars from '@/components/sections/home/Pillars';
import ResultsFelt from '@/components/sections/home/ResultsFelt';
import HowItWorks from '@/components/sections/home/HowItWorks';
import SampleDay from '@/components/sections/home/SampleDay';

import data from '@/data/programs/index.json';
import { getUserState } from '@/lib/user-state';

export default async function HomePage() {
    const { isAuthed, hasActiveProgram, activeProgramSlug } = await getUserState();

    return (
        <>
            <Hero />
            <SocialProof />
            <ProgramsGrid programs={data.programs} />
            <Pillars />
            <ResultsFelt />
            <HowItWorks isAuthed={isAuthed} />
            <SampleDay isAuthed={isAuthed} hasActiveProgram={hasActiveProgram} activeProgramSlug={activeProgramSlug} />
        </>
    );
}
