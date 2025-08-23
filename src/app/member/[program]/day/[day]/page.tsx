// src/app/member/[program]/day/[day]/page.tsx
import { notFound, redirect } from 'next/navigation';
import ProgramClient from './ProgramClient';
import type { ProgramJSON } from '@/types/program';
import { requireEnrollment } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ❗️On NE type PAS le JSON importé comme ProgramJSON ici.
type ProgramModule = { default: unknown };

const PROGRAM_FILES: Record<string, () => Promise<ProgramModule>> = {
    'reset-7': () => import('@/data/programs/reset7.json'),
    // 'boussole-10': () => import('@/data/programs/boussole10.json'),
} as const;

type Params = { program: string; day: string };

/* ---------- petites helpers sans `any` ---------- */
function get(obj: unknown, key: string): unknown {
    return typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>)[key] : undefined;
}
function isNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
}

/* ---------- assertion runtime → confère à TS que c'est bien ProgramJSON ---------- */
function assertProgramShape(p: unknown): asserts p is ProgramJSON {
    const days = get(p, 'days');
    if (!Array.isArray(days)) throw new Error('Invalid program JSON: missing days[]');

    for (const d of days) {
        const dayVal = get(d, 'day');
        if (!isNumber(dayVal)) throw new Error('Invalid program JSON: day.day must be number');
        // on pourrait pousser plus loin, mais ceci suffit pour lever l’ambiguïté de types
    }
}

export default async function Page(props: { params: Promise<Params> }) {
    const { program, day } = await props.params;

    // 🔒 Garde d’accès
    const access = await requireEnrollment(program);
    if (!access.ok) redirect('/member?error=not_enrolled');

    const loader = PROGRAM_FILES[program];
    if (!loader) notFound();

    // ⬇️ charge le JSON en `unknown`, puis on vérifie la forme
    const mod = await loader();
    assertProgramShape(mod.default);
    const programData = mod.default; // ← maintenant typé ProgramJSON

    const dayNum = Number(day);
    const hasDay = programData.days.some((d) => d.day === dayNum);
    if (!Number.isInteger(dayNum) || !hasDay) notFound();

    const userKey = access.userId; // identifiant stable pour le localStorage namespacé

    return <ProgramClient program={programData} programSlug={program} dayNum={dayNum} userKey={userKey} />;
}
