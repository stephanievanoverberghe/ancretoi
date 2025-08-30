// components/home/sections/ProgramsGridClient.tsx
'use client';

import ProgramCard, { type ProgramCardProgram } from '@/components/programs/cards/ProgramCard';

type Props = { programs: ProgramCardProgram[] };

export default function ProgramsGridClient({ programs }: Props) {
    return (
        <section id="programmes" aria-labelledby="programmes-title" className="relative mx-[calc(50%-50vw)] w-screen py-14 sm:py-16 lg:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 lg:mb-12 text-center">
                    <h2 id="programmes-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Programmes guidés
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">7 • 10 • 30 • 90 jours — juste ce qu’il faut, au bon rythme.</p>
                </header>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
                    {programs.map((p, idx) => (
                        <li key={p.slug}>
                            <ProgramCard program={p} position={idx + 1} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
