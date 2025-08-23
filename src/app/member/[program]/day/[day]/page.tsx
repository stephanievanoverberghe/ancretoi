// src/app/member/[program]/day/[day]/page.tsx
import { notFound } from 'next/navigation';
import ProgramClient from './ProgramClient';
import type { ProgramJSON } from '@/types/program';

// on tape l'import comme unknown pour éviter le conflit “string vs union”
const PROGRAM_FILES: Record<string, () => Promise<{ default: unknown }>> = {
    'reset-7': () => import('@/data/programs/reset7.json'),
    // ajoute d'autres slugs ici
} as const;

function assertProgramShape(p: unknown): asserts p is ProgramJSON {
    if (!p || typeof p !== 'object' || !Array.isArray((p as { days?: unknown }).days)) {
        throw new Error('Invalid program JSON: missing days[]');
    }
}

export default async function Page({ params }: { params: { program: string; day: string } }) {
    const { program, day } = params;

    const loader = PROGRAM_FILES[program];
    if (!loader) notFound();

    const mod = await loader();
    assertProgramShape(mod.default);
    const programData = mod.default; // ProgramJSON

    const dayNum = Number(day);
    const dayData = programData.days.find((d) => d.day === dayNum);
    if (!Number.isInteger(dayNum) || !dayData) notFound();

    return <ProgramClient programSlug={program} dayNum={dayNum} program={programData} />;
}
