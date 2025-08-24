// lib/programs-index.ts
import rawJson from '@/data/programs/index.json';

/* ---------------- Types ---------------- */
export type Price = {
    amount_cents: number | null;
    currency: 'EUR' | 'USD' | (string & {});
    tax_included: boolean;
    compare_at_cents: number | null;
    stripe_price_id: string | null;
};

export type FaqItem = { q: string; a: string };

export type ProgramDetail = {
    who: string;
    goals: string[];
    includes: string[];
    prerequisites: string[];
    outcomes: string[];
    faq: FaqItem[];
};

export type Program = {
    slug: string;
    title: string;
    tagline: string;
    duration_days: number;
    level: 'Basique' | 'Cible' | 'Premium' | (string & {});
    status: 'published' | 'draft' | 'archived' | (string & {});
    cover: string;
    price: Price;
    card_highlights: string[];
    detail: ProgramDetail;
};

export type InsideItem = { icon: string; label: string };

/* --------------- Type guards --------------- */
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number';
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

const isFaqArray = (v: unknown): v is FaqItem[] => Array.isArray(v) && v.every((x) => isObject(x) && isString(x.q) && isString(x.a));

const isInsideArray = (v: unknown): v is InsideItem[] => Array.isArray(v) && v.every((x) => isObject(x) && isString(x.icon) && isString(x.label));

/* --------------- Normalizers --------------- */
function normalizePrice(p: unknown): Price {
    const obj = isObject(p) ? p : {};
    return {
        amount_cents: isNumber(obj.amount_cents) ? obj.amount_cents : null,
        currency: isString(obj.currency) ? obj.currency : 'EUR',
        tax_included: isBoolean(obj.tax_included) ? obj.tax_included : false,
        compare_at_cents: isNumber(obj.compare_at_cents) ? obj.compare_at_cents : null,
        stripe_price_id: isString(obj.stripe_price_id) ? obj.stripe_price_id : null,
    };
}

function normalizeDetail(d: unknown): ProgramDetail {
    const obj = isObject(d) ? d : {};
    return {
        who: isString(obj.who) ? obj.who : '',
        goals: isStringArray(obj.goals) ? obj.goals : [],
        includes: isStringArray(obj.includes) ? obj.includes : [],
        prerequisites: isStringArray(obj.prerequisites) ? obj.prerequisites : [],
        outcomes: isStringArray(obj.outcomes) ? obj.outcomes : [],
        faq: isFaqArray(obj.faq) ? obj.faq : [],
    };
}

function normalizeProgram(row: unknown): Program | null {
    if (!isObject(row)) return null;
    const { slug, title, tagline, duration_days, level, status, cover, price, card_highlights, detail } = row;

    if (!isString(slug) || !isString(title) || !isString(tagline) || !isNumber(duration_days) || !isString(level) || !isString(status) || !isString(cover)) return null;

    return {
        slug,
        title,
        tagline,
        duration_days,
        level: level as Program['level'],
        status: status as Program['status'],
        cover,
        price: normalizePrice(price),
        card_highlights: isStringArray(card_highlights) ? card_highlights : [],
        detail: normalizeDetail(detail),
    };
}

function normalizeRoot(input: unknown): { programs: Program[]; inside: InsideItem[] } {
    const rootObj = isObject(input) ? input : {};
    let inside: InsideItem[] = isInsideArray(rootObj.inside) ? rootObj.inside : [];
    const rows: unknown[] = Array.isArray(rootObj.programs) ? rootObj.programs : [];

    const programs: Program[] = [];
    for (const row of rows) {
        // Compat : si quelqu’un a mis { inside: [...] } dans le tableau
        if (isObject(row) && isInsideArray(row.inside) && inside.length === 0) {
            inside = row.inside;
            continue;
        }
        const p = normalizeProgram(row);
        if (p) programs.push(p);
    }

    return { programs, inside };
}

/* --------------- Data (parsed) --------------- */
const ROOT = normalizeRoot(rawJson as unknown);

export const PROGRAMS: Program[] = ROOT.programs;

export const PROGRAMS_BY_SLUG: Record<string, Program> = Object.fromEntries(PROGRAMS.map((p) => [p.slug, p] as const));

export function getProgram(slug: string) {
    return PROGRAMS_BY_SLUG[slug];
}

export function getInsideItems(): InsideItem[] {
    return ROOT.inside;
}

/* --------------- Price formatter --------------- */
export function formatPrice(p?: Price | null) {
    if (!p || p.amount_cents === null) return null;
    const label = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: p.currency,
    }).format(p.amount_cents / 100);
    return label + (p.tax_included ? ' TTC' : ' HT');
}
