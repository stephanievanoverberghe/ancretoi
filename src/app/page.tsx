// app/page.tsx
import Hero from '@/components/home/sections/Hero';
import SocialProof from '@/components/home/sections/SocialProof';
import ProgramsGrid from '@/components/home/sections/ProgramsGrid';
import Pillars from '@/components/home/sections/Pillars';
import ResultsFelt from '@/components/home/sections/ResultsFelt';
import HowItWorks from '@/components/home/sections/HowItWorks';
import SampleDay from '@/components/home/sections/SampleDay';

import data from '@/data/programs/index.json';
import { getUserState } from '@/lib/user-state';
import Testimonials from '@/components/home/sections/Testimonials';
import Founder from '@/components/home/sections/Founder';
import LeadMagnet from '@/components/home/sections/LeadMagnet';
import FAQ from '@/components/home/sections/FAQ';
import FinalCTA from '@/components/home/sections/FinalCTA';
import BlogTeasers from '@/components/home/sections/BlogTeasers';

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
            <FAQ />
            <FinalCTA />
            <BlogTeasers />
        </>
    );
}
