import Hero from '@/components/home/sections/Hero';
import SocialProof from '@/components/home/sections/SocialProof';
import ProgramsGrid from '@/components/home/sections/ProgramsGrid';
import Pillars from '@/components/home/sections/Pillars';
import ResultsFelt from '@/components/home/sections/ResultsFelt';
import HowItWorks from '@/components/home/sections/HowItWorks';
import SampleDay from '@/components/home/sections/SampleDay';
import { getUserState } from '@/lib/user-state';
import Testimonials from '@/components/home/sections/Testimonials';
import Founder from '@/components/home/sections/Founder';
import LeadMagnet from '@/components/home/sections/LeadMagnet';
import FAQ from '@/components/home/sections/FAQ';
import FinalCTA from '@/components/home/sections/FinalCTA';
import BlogTeasers from '@/components/home/sections/BlogTeasers';

// ⛔️ plus d'import du JSON — on lit la BDD via ProgramsGrid

export default async function HomePage() {
    const { isAuthed, hasActiveProgram, activeProgramSlug } = await getUserState();

    return (
        <>
            <Hero />
            <SocialProof />
            <ProgramsGrid />
            <Pillars />
            <ResultsFelt />
            <HowItWorks isAuthed={isAuthed} />
            <SampleDay isAuthed={isAuthed} hasActiveProgram={hasActiveProgram} activeProgramSlug={activeProgramSlug} />
            <Testimonials items={[]} />
            <Founder />
            <LeadMagnet />
            <FAQ />
            <FinalCTA />
            <BlogTeasers />
        </>
    );
}
