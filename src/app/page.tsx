// src/app/page.tsx
import Hero from '@/components/sections/home/Hero';
import HowItWorks from '@/components/sections/home/HowItWorks';
import Pillars from '@/components/sections/home/Pillars';
import ProgramsGrid from '@/components/sections/home/ProgramsGrid';
import ResultsFelt from '@/components/sections/home/ResultsFelt';
import SocialProof from '@/components/sections/home/SocialProof';
import data from '@/data/programs/index.json';
import { getSession } from '@/lib/session';

type ProgramJSON = {
    slug: string;
    title: string;
    duration_days: number;
    status?: string | null;
    price?: { amount_cents?: number | null } | null;
};

export default async function HomePage() {
    const session = await getSession();
    const isAuthed = !!session?.email;

    const programs = (data.programs as ProgramJSON[]).map((p) => ({
        slug: p.slug,
        title: p.title,
        duration_days: p.duration_days,
        status: p.status === 'published' ? 'published' : p.status === 'draft' ? 'draft' : undefined,
        price: { amount_cents: p.price?.amount_cents ?? null },
    }));

    return (
        <>
            <Hero />
            <SocialProof />
            <ProgramsGrid programs={programs} />
            <Pillars />
            <ResultsFelt />
            <HowItWorks isAuthed={isAuthed} />
        </>
    );
}
