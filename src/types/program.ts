// types/programs.ts

// ====== DÉTAILLÉ (tes types existants) ======
export type ExerciseType = 'breath' | 'journal' | 'practice' | 'movement' | 'walk' | 'planning' | 'reflection' | 'checklist' | 'message';

type ScalarFieldBase = { key: string; label: string; required?: boolean };

export type TextField = ScalarFieldBase & { type: 'text' };
export type TextareaField = ScalarFieldBase & { type: 'textarea' };
export type NumberField = ScalarFieldBase & { type: 'number'; min?: number; max?: number };
export type SliderField = ScalarFieldBase & { type: 'slider'; min: number; max: number };
export type SelectField = ScalarFieldBase & { type: 'select'; options: string[] };
export type MultiSelectField = ScalarFieldBase & { type: 'multi_select'; options: string[] };
export type BooleanField = ScalarFieldBase & { type: 'boolean' };
export type RepeaterField = ScalarFieldBase & {
    type: 'repeater';
    schema: (TextField | TextareaField | NumberField | TextField | SelectField | BooleanField)[];
    min_items?: number;
    max_items?: number;
};

export type AnyField = TextField | TextareaField | NumberField | SliderField | SelectField | MultiSelectField | BooleanField | RepeaterField;

export type Exercise = {
    key: string;
    title: string;
    type: ExerciseType;
    timer_sec?: number;
    required?: boolean;
    completed?: boolean;
    description?: string;
    fields: AnyField[];
};

export type DaySection = { duration_min?: string; exercises: Exercise[] };

export type Day = {
    day: number;
    title: string;
    objectives?: string[];
    outcomes?: string[];
    blocks: { morning?: DaySection; noon?: DaySection; evening?: DaySection };
    daily_check?: Record<string, AnyField>;
};

export type ProgramJSON = {
    product: string;
    version: string;
    timezone?: string;
    created_at?: string;
    updated_at?: string;
    days: Day[];
};

// ====== MÉTADONNÉES (index des programmes) ======
export type Price = {
    amount_cents: number | null;
    currency: string;
    tax_included?: boolean | null;
    compare_at_cents?: number | null;
    stripe_price_id?: string | null;
};

export type FaqItem = { q: string; a: string };

export type ProgramDetailMeta = {
    who?: string;
    goals?: string[];
    includes?: string[];
    prerequisites?: string[];
    outcomes?: string[];
    faq?: FaqItem[];
};

export type ProgramMedia = {
    /** Image 21:9 optionnelle pour le fond du hero */
    hero21x9?: string;
};

export type ProgramMeta = {
    slug: string;
    title: string;
    tagline: string;
    duration_days: number;
    level: string;
    status: 'published' | 'draft' | 'archived' | string;
    cover?: string;
    price?: Price;
    card_highlights?: string[];
    detail?: ProgramDetailMeta;
    /** Optionnel : pour brancher une image 21:9 subtile dans le Hero */
    media?: ProgramMedia;
    /** Optionnel : pour surcharger le libellé de charge/jour */
    meta?: { daily_load_label?: string };
};

export type InsideItem = { icon: string; label: string };

export type ProgramsIndex = {
    version: string;
    updated_at: string;
    inside: InsideItem[];
    programs: ProgramMeta[];
};
