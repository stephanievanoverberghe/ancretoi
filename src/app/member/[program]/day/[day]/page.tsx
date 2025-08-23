// src/app/member/[program]/day/[day]/page.tsx
import { notFound, redirect } from 'next/navigation';
import ProgramClient from './ProgramClient';
import type { ProgramJSON } from '@/types/program';
import { requireEnrollmentOrPreview } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// On NE type pas le JSON importé ici.
type ProgramModule = { default: unknown };

const PROGRAM_FILES: Record<string, () => Promise<ProgramModule>> = {
    'reset-7': () => import('@/data/programs/reset7.json'),
    // 'boussole-10': () => import('@/data/programs/boussole10.json'),
} as const;

type Params = { program: string; day: string };

// helpers
function get(obj: unknown, key: string): unknown {
    return typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>)[key] : undefined;
}
function isNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
}
function assertProgramShape(p: unknown): asserts p is ProgramJSON {
    const days = get(p, 'days');
    if (!Array.isArray(days)) throw new Error('Invalid program JSON: missing days[]');
    for (const d of days) {
        const dayVal = get(d, 'day');
        if (!isNumber(dayVal)) throw new Error('Invalid program JSON: day.day must be number');
    }
}

export default async function Page({ params }: { params: Params }) {
    const { program, day } = params;

    // Programme connu ?
    const loader = PROGRAM_FILES[program];
    if (!loader) notFound();

    // Jour demandé
    const dayNum = Number(day);
    if (!Number.isInteger(dayNum)) notFound();

    // 🔒 Accès : connecté obligatoire, puis enrolled OU preview day1
    const access = await requireEnrollmentOrPreview(program, dayNum);
    if (!access.ok) {
        if (access.reason === 'auth') {
            redirect(`/login?next=${encodeURIComponent(`/member/${program}/day/${dayNum}`)}`);
        }
        // pas inscrit & jour non autorisé → fiche programme verrouillée
        redirect(`/programs/${program}?locked=1`);
    }

    // Charge et valide le JSON
    const mod = await loader();
    assertProgramShape(mod.default);
    const programData = mod.default as ProgramJSON;

    // Le jour existe ?
    const hasDay = programData.days.some((d) => d.day === dayNum);
    if (!hasDay) notFound();

    // userKey: id user (toujours connecté à ce stade)
    const userKey = access.userId;

    return (
        <ProgramClient
            program={programData}
            programSlug={program}
            dayNum={dayNum}
            userKey={userKey}
            accessMode={access.mode} // 'enrolled' | 'preview'
        />
    );
}
