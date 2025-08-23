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
