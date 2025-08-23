// lib/programs-index.ts
import data from '@/data/programs/index.json';
export type Price = {
    amount_cents: number | null;
    currency: 'EUR' | 'USD' | string;
    tax_included: boolean;
    compare_at_cents: number | null;
    stripe_price_id: string | null;
};
export type ProgramCard = (typeof data.programs)[number] & { price: Price };

export const PROGRAMS: ProgramCard[] = data.programs;

export function getProgram(slug: string) {
    return PROGRAMS.find((p) => p.slug === slug);
}

export function formatPrice(p?: Price | null) {
    if (!p || p.amount_cents === null) return null;
    const label = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: p.currency }).format(p.amount_cents / 100);
    return label + (p.tax_included ? ' TTC' : ' HT');
}
