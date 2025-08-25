// imports à ajouter
import { getChargeLabel } from '@/lib/programs-compare';
import Hero from '@/components/program/sections/Hero';
import { getProgram } from '@/lib/programs-index';
import { notFound } from 'next/navigation';

export default async function ProgramPage({ params }: { params: { slug: string } }) {
    const program = getProgram(params.slug);
    if (!program) return notFound();

    const dailyLoad = getChargeLabel(program.slug) ?? undefined;

    return (
        <>
            <Hero program={program} dailyLoadLabel={dailyLoad} />
        </>
    );
}
