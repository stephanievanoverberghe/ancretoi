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
import Testimonials from '@/components/sections/home/Testimonials';
import Founder from '@/components/sections/home/Founder';
import LeadMagnet from '@/components/sections/home/LeadMagnet';

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
            <Testimonials
                items={
                    [
                        // { name: 'Léa M.', before: 'Je me sens', highlight: 'plus claire et posée', after: 'dans mes choix quotidiens.' },
                        // { name: 'Nabil R.', before: 'Des rituels', highlight: 'courts qui tiennent', after: 'sans me cramer l’énergie.' },
                        // { name: 'Célia P.', before: 'J’ai retrouvé', highlight: 'présence & confiance', after: 'dans les moments clés.' },
                    ]
                }
            />
            <Founder />
            <LeadMagnet />
        </>
    );
}
