// util simple pour garantir le même slug partout
export function normalizeProgramSlug(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-');
}

// Map des programmes (ajoute ici les autres plus tard)
export const PROGRAM_CATALOG = {
    'reset-7': { slug: 'reset-7', file: () => import('@/data/programs/reset7.json') },
    // 'boussole-10': { slug: 'boussole-10', file: () => import('@/data/programs/boussole10.json') },
} as const;

export type ProgramSlug = keyof typeof PROGRAM_CATALOG;

export function getProgramLoader(slugLike: string) {
    const slug = normalizeProgramSlug(slugLike);
    const entry = PROGRAM_CATALOG[slug as ProgramSlug];
    return entry?.file ?? null;
}
