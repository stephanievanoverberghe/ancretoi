// src/app/member/[program]/day/[day]/page.tsx
import { notFound, redirect } from 'next/navigation';
import ProgramClient from './ProgramClient';
import type { ProgramJSON } from '@/types/program';
import { requireEnrollment } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PROGRAM_FILES: Record<string, () => Promise<{ default: unknown }>> = {
    'reset-7': () => import('@/data/programs/reset7.json'),
} as const;

// -- types sûrs pour l’accès
type EnrollmentResult = { ok: true; userId: string } | { ok: false };

function isProgramJSON(p: unknown): p is ProgramJSON {
    if (typeof p !== 'object' || p === null) return false;
    const o = p as Record<string, unknown>;
    if (!Array.isArray(o.days)) return false;
    return true;
}
function assertProgramShape(p: unknown): asserts p is ProgramJSON {
    if (!isProgramJSON(p)) throw new Error('Invalid program JSON');
}

export default async function Page(props: { params: Promise<{ program: string; day: string }> }) {
    const { program, day } = await props.params;

    // 🔒 garde d’accès
    const access = (await requireEnrollment(program)) as EnrollmentResult;
    if (!access.ok) redirect('/member?error=not_enrolled');

    const loader = PROGRAM_FILES[program];
    if (!loader) notFound();

    const { default: raw } = await loader();
    assertProgramShape(raw);
    const programData = raw;

    const dayNum = Number(day);
    const hasDay = programData.days.some((d) => d.day === dayNum);
    if (!Number.isInteger(dayNum) || !hasDay) notFound();

    // ✅ n’utilise que userId (plus de access.email)
    const userKey = access.userId;

    return <ProgramClient program={programData} programSlug={program} dayNum={dayNum} userKey={userKey} />;
}
