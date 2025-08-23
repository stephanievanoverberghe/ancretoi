// src/app/page.tsx
import Hero from '@/components/sections/home/Hero';
import Pillars from '@/components/sections/home/Pillars';
import ProgramsGrid from '@/components/sections/home/ProgramsGrid';
import SocialProof from '@/components/sections/home/SocialProof';
import data from '@/data/programs/index.json';

export default function HomePage() {
    return (
        <>
            <Hero />
            <SocialProof />
            <ProgramsGrid programs={data.programs} />
            <Pillars />
        </>
    );
}
