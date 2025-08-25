// lib/programs-compare.ts
import raw from '@/data/programs/compare.json';

/* ---------------- Types ---------------- */
export type CompareRow = {
    slug: string;
    objectif: string;
    duree: string;
    charge: string;
    niveau: string;
    ideal_si: string;
    cta: string;
};
export type CompareRoot = { rows: CompareRow[] };

/* --------------- Type guards utilitaires --------------- */
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isString = (v: unknown): v is string => typeof v === 'string';

const isRow = (v: unknown): v is CompareRow =>
    isObject(v) && isString(v.slug) && isString(v.objectif) && isString(v.duree) && isString(v.charge) && isString(v.niveau) && isString(v.ideal_si) && isString(v.cta);

const isRows = (v: unknown): v is CompareRow[] => Array.isArray(v) && v.every(isRow);

/* --------------- Normalisation --------------- */
function normalizeRoot(input: unknown): CompareRow[] {
    const root = isObject(input) ? input : {};
    const rows = isRows(root.rows) ? root.rows : [];
    return rows;
}

/* --------------- Data --------------- */
const ROWS: CompareRow[] = normalizeRoot(raw as unknown);

export const COMPARE_BY_SLUG: Record<string, CompareRow> = Object.fromEntries(ROWS.map((r) => [r.slug, r] as const));

/** Renvoie la ligne complète de compare.json pour un slug donné */
export function getCompareRow(slug: string): CompareRow | undefined {
    return COMPARE_BY_SLUG[slug];
}

/** Label de charge/jour pour un slug donné (ex "15–20 min/j"), ou null si absent */
export function getChargeLabel(slug: string): string | null {
    return COMPARE_BY_SLUG[slug]?.charge ?? null;
}
