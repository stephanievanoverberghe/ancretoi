// lib/programs.ts
import type { ProgramJSON } from '@/types/program';

/** util simple pour garantir le même slug partout */
export function normalizeProgramSlug(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-');
}

/** Map des programmes (ajoute ici les autres plus tard) */
export const PROGRAM_CATALOG = {
    'reset-7': { slug: 'reset-7', file: () => import('@/data/programs/reset7.json') },
    // 'boussole-10': { slug: 'boussole-10', file: () => import('@/data/programs/boussole10.json') },
    // 'ancrage-30':  { slug: 'ancrage-30',  file: () => import('@/data/programs/ancrage30.json') },
    // 'alchimie-90': { slug: 'alchimie-90', file: () => import('@/data/programs/alchimie90.json') },
} as const;

export type ProgramSlug = keyof typeof PROGRAM_CATALOG;

export type ProgramCatalogEntry = {
    slug: ProgramSlug | string;
    file: () => Promise<{ default: ProgramJSON }>;
};

export function getProgramLoader(slugLike: string): ProgramCatalogEntry['file'] | null {
    const slug = normalizeProgramSlug(slugLike);
    const entry = (PROGRAM_CATALOG as Record<string, ProgramCatalogEntry>)[slug];
    return entry?.file ?? null;
}

/** Helper typed: charge directement le JSON détaillé (retourne `null` si absent) */
export async function loadProgramDetailed(slugLike: string): Promise<ProgramJSON | null> {
    const loader = getProgramLoader(slugLike);
    if (!loader) return null;
    const mod = await loader();
    return mod.default as ProgramJSON;
}
