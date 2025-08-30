// src/lib/programs-index.ts
// (module partagé: types + utilitaires uniquement)

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

/* --------------- Price formatter --------------- */
export function formatPrice(p?: Price | null) {
    if (!p || p.amount_cents === null) return null;
    const label = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: p.currency,
    }).format(p.amount_cents / 100);
    return label + (p.tax_included ? ' TTC' : ' HT');
}
