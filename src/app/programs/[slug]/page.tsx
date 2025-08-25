import { notFound } from 'next/navigation';
import { getProgram } from '@/lib/programs-index';
import { getChargeLabel } from '@/lib/programs-compare';
import Hero from '@/components/program/sections/Hero';

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = getProgram(slug);
    if (!program) return notFound();

    const dailyLoad = getChargeLabel(program.slug) ?? undefined;

    return (
        <>
            <Hero program={program} dailyLoadLabel={dailyLoad} />
        </>
    );
}
