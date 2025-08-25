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
    schema: (
        | TextField
        | TextareaField
        | NumberField
        | SliderField // 👈 ajouté
        | SelectField
        | MultiSelectField // 👈 ajouté
        | BooleanField
    )[];
    min_items?: number;
    max_items?: number;
};

export type MediaAsset = {
    video?: string; // URL HLS/MP4
    poster?: string; // image 16:9
    captions_vtt?: string; // sous-titres FR
    chapters_vtt?: string; // chapitres (optionnel)
    transcript_pdf?: string; // transcript (optionnel)
    transcript_txt?: string; // transcript (optionnel)
    duration_sec?: number; // durée réelle de la vidéo
    sensitivity?: 'low' | 'med' | 'high'; // niveau de sensibilité (optionnel)
};

export type AnyField = TextField | TextareaField | NumberField | SliderField | SelectField | MultiSelectField | BooleanField | RepeaterField;

export type Exercise = {
    key: string;
    title: string;
    type: ExerciseType;
    timer_sec?: number;
    required?: boolean;
    /** NOTE: runtime plutôt que contenu → à sortir si tu crées des types de “state” */
    completed?: boolean;
    description?: string;
    fields: AnyField[];
    media?: MediaAsset; // 👈 nouveau
};

export type DaySection = { duration_min?: number | string; exercises: Exercise[] };

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
    hero21x9?: string;
    teaser_video?: string;
    teaser_poster?: string;
    teaser_captions_vtt?: string;
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
