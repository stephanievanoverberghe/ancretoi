// src/app/member/[program]/day/[day]/ProgramClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProgramJSON, Day, DaySection, Exercise, AnyField, SliderField, SelectField, MultiSelectField, NumberField, RepeaterField } from '@/types/program';

type ValuesMap = Record<string, unknown>;

function cls(...parts: Array<string | false | undefined>) {
    return parts.filter(Boolean).join(' ');
}
function formatSeconds(total: number) {
    const m = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
    const s = Math.floor(total % 60)
        .toString()
        .padStart(2, '0');
    return `${m}:${s}`;
}
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// ----- storage keys (namespacées par user) -----
function keyDay(userKey: string, programSlug: string, day: number) {
    return `${userKey}:${programSlug}:day:${day}`;
}
function keyLastDay(userKey: string, programSlug: string) {
    return `${userKey}:${programSlug}:lastDay`;
}

// ---------- Timer ----------
function Timer({ seconds = 0 }: { seconds?: number }) {
    const [left, setLeft] = useState(seconds);
    const [running, setRunning] = useState(false);

    useEffect(() => setLeft(seconds), [seconds]);
    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [running]);
    useEffect(() => {
        if (left === 0 && running) setRunning(false);
    }, [left, running]);

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex min-w-[48px] justify-center rounded-md bg-gray-100 px-2 py-1 font-mono">{formatSeconds(left)}</span>
            <button type="button" onClick={() => setRunning((v) => !v)} className="rounded-md border px-2 py-1 hover:bg-gray-50">
                {running ? 'Pause' : 'Start'}
            </button>
            <button
                type="button"
                onClick={() => {
                    setLeft(seconds);
                    setRunning(false);
                }}
                className="rounded-md border px-2 py-1 hover:bg-gray-50"
            >
                Reset
            </button>
        </div>
    );
}

// ---------- Fields ----------
type FieldProps = {
    field: AnyField;
    value: unknown;
    onChange: (val: unknown) => void;
    namePath: string;
};

function FieldRenderer({ field, value, onChange, namePath }: FieldProps) {
    const base = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10';
    const labelCls = 'mb-1 block text-sm font-medium';

    switch (field.type) {
        case 'text':
            return (
                <label className="block">
                    <span className={labelCls}>{field.label}</span>
                    <input name={namePath} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} type="text" />
                </label>
            );

        case 'textarea':
            return (
                <label className="block">
                    <span className={labelCls}>{field.label}</span>
                    <textarea name={namePath} className={cls(base, 'min-h-[120px]')} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
                </label>
            );

        case 'number': {
            const f = field as NumberField;
            const v = typeof value === 'number' ? value : '';
            return (
                <label className="block">
                    <span className={labelCls}>{field.label}</span>
                    <input
                        name={namePath}
                        className={base}
                        value={v as number | string}
                        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        type="number"
                        min={f.min}
                        max={f.max}
                    />
                </label>
            );
        }

        case 'slider': {
            const f = field as SliderField;
            const v = typeof value === 'number' ? value : Math.round((f.min + f.max) / 2);
            return (
                <label className="block">
                    <div className="flex items-center justify-between">
                        <span className={labelCls}>{field.label}</span>
                        <span className="text-xs text-gray-500">{v}</span>
                    </div>
                    <input name={namePath} className="w-full" type="range" min={f.min} max={f.max} value={v} onChange={(e) => onChange(Number(e.target.value))} />
                </label>
            );
        }

        case 'select': {
            const f = field as SelectField;
            return (
                <label className="block">
                    <span className={labelCls}>{field.label}</span>
                    <select name={namePath} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
                        <option value="">— Choisir —</option>
                        {f.options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </label>
            );
        }

        case 'multi_select': {
            const f = field as MultiSelectField;
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
                <div>
                    <div className={labelCls}>{field.label}</div>
                    <div className="flex flex-wrap gap-2">
                        {f.options.map((opt) => {
                            const checked = selected.includes(opt);
                            return (
                                <label key={opt} className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                                    <input
                                        type="checkbox"
                                        className="accent-black"
                                        checked={checked}
                                        onChange={(e) => {
                                            if (e.target.checked) onChange([...selected, opt]);
                                            else onChange(selected.filter((x) => x !== opt));
                                        }}
                                    />
                                    <span>{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            );
        }

        case 'boolean':
            return (
                <label className="inline-flex items-center gap-2">
                    <input name={namePath} type="checkbox" className="h-4 w-4 accent-black" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
                    <span className={labelCls}>{field.label}</span>
                </label>
            );

        case 'repeater': {
            const f = field as RepeaterField;
            const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
            const min = f.min_items ?? 0;
            const canAdd = f.max_items ? items.length < f.max_items : true;

            return (
                <div>
                    <div className={labelCls}>{field.label}</div>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="rounded-lg border p-3">
                                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                                    <div>Entrée #{idx + 1}</div>
                                    <button
                                        type="button"
                                        className={cls('rounded-md border px-2 py-1 hover:bg-gray-50', items.length <= min && 'opacity-50 cursor-not-allowed')}
                                        onClick={() => {
                                            if (items.length <= min) return;
                                            const next = items.slice();
                                            next.splice(idx, 1);
                                            onChange(next);
                                        }}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {f.schema.map((sub, sidx) => (
                                        <FieldRenderer
                                            key={sidx}
                                            field={sub as AnyField}
                                            value={isRecord(item) ? item[sub.key] : undefined}
                                            onChange={(val) => {
                                                const next = items.slice();
                                                const current = isRecord(next[idx]) ? next[idx] : {};
                                                next[idx] = {
                                                    ...(current as Record<string, unknown>),
                                                    [sub.key]: val,
                                                };
                                                onChange(next);
                                            }}
                                            namePath={`${namePath}[${idx}].${sub.key}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2">
                        <button
                            type="button"
                            className={cls('rounded-md border px-3 py-1 text-sm hover:bg-gray-50', !canAdd && 'opacity-50 cursor-not-allowed')}
                            onClick={() => {
                                if (!canAdd) return;
                                const empty: Record<string, unknown> = {};
                                f.schema.forEach((s) => {
                                    empty[s.key] = s.type === 'boolean' ? false : '';
                                });
                                onChange([...(items || []), empty]);
                            }}
                        >
                            + Ajouter une entrée
                        </button>
                    </div>
                </div>
            );
        }

        default:
            return <div className="text-sm text-gray-500">Type de champ non géré: {(field as { type: string }).type}</div>;
    }
}

// ---------- Exercise/Section ----------
function ExerciseCard({ ex, values, setValue }: { ex: Exercise; values: Record<string, unknown>; setValue: (fieldPath: string, val: unknown) => void }) {
    const baseKey = `ex.${ex.key}`;

    return (
        <div className="rounded-2xl border p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">{ex.type}</div>
                    <h3 className="text-lg font-semibold">{ex.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {typeof ex.timer_sec === 'number' && <Timer seconds={ex.timer_sec} />}
                    {ex.required && <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">requis</span>}
                </div>
            </div>
            {ex.description && <p className="mb-3 text-sm text-gray-600">{ex.description}</p>}

            {ex.fields?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                    {ex.fields.map((f) => (
                        <FieldRenderer
                            key={f.key}
                            field={f}
                            value={values[`${baseKey}.${f.key}`]}
                            onChange={(val) => setValue(`${baseKey}.${f.key}`, val)}
                            namePath={`${baseKey}.${f.key}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-sm text-gray-500">Aucun champ à remplir.</div>
            )}

            <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">Clé: {ex.key}</div>
                <label className="inline-flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-black"
                        checked={!!values[`${baseKey}.__done`]}
                        onChange={(e) => setValue(`${baseKey}.__done`, e.target.checked)}
                    />
                    <span>Marquer comme terminé</span>
                </label>
            </div>
        </div>
    );
}

function Section({
    label,
    section,
    values,
    setValue,
}: {
    label: string;
    section?: DaySection;
    values: Record<string, unknown>;
    setValue: (fieldPath: string, val: unknown) => void;
}) {
    if (!section) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">{label}</h2>
                {section.duration_min && <div className="text-xs text-gray-500">~ {section.duration_min} min</div>}
            </div>
            <div className="grid gap-4">
                {section.exercises.map((ex) => (
                    <ExerciseCard key={ex.key} ex={ex} values={values} setValue={setValue} />
                ))}
            </div>
        </div>
    );
}

// ---------- Page client ----------
export default function ProgramClient({
    program,
    programSlug,
    dayNum,
    userKey, // ✅ nouveau
}: {
    program: ProgramJSON;
    programSlug: string;
    dayNum: number;
    userKey: string;
}) {
    const router = useRouter();
    const maxDay = program.days.length;
    const dayData: Day | undefined = useMemo(() => program.days.find((d) => d.day === dayNum), [program.days, dayNum]);
    const dayId = dayData?.day ?? null;

    const [values, setValues] = useState<ValuesMap>({});
    const [loaded, setLoaded] = useState(false);
    const [autoSaved, setAutoSaved] = useState<'idle' | 'saving' | 'saved'>('idle');

    // load (avec migration éventuelle depuis anciennes clés non-namespacées)
    useEffect(() => {
        if (!dayId) return;
        const k = keyDay(userKey, programSlug, dayId);
        try {
            let raw = localStorage.getItem(k);

            // migration simple: ancien format `${programSlug}:day:${dayId}`
            if (!raw) {
                const oldK = `${programSlug}:day:${dayId}`;
                const old = localStorage.getItem(oldK);
                if (old) {
                    localStorage.setItem(k, old);
                    localStorage.removeItem(oldK);
                    raw = old;
                }
            }

            setValues(raw ? (JSON.parse(raw) as ValuesMap) : {});
        } catch {
            setValues({});
        }
        setLoaded(true);
    }, [dayId, programSlug, userKey]);

    // save
    useEffect(() => {
        if (!loaded || !dayId) return;
        const k = keyDay(userKey, programSlug, dayId);
        const kLast = keyLastDay(userKey, programSlug);

        setAutoSaved('saving');
        const id = setTimeout(() => {
            try {
                localStorage.setItem(k, JSON.stringify(values));
                localStorage.setItem(kLast, String(dayId));
                setAutoSaved('saved');
                setTimeout(() => setAutoSaved('idle'), 1200);
            } catch {
                setAutoSaved('idle');
            }
        }, 800);
        return () => clearTimeout(id);
    }, [values, loaded, dayId, programSlug, userKey]);

    if (!dayData) return <div className="mx-auto max-w-3xl p-6">Jour introuvable.</div>;

    const setValue = (path: string, val: unknown) => setValues((prev) => ({ ...prev, [path]: val }));
    const goto = (d: number) => router.push(`/member/${programSlug}/day/${d}`);

    const dc = dayData.daily_check || {};

    return (
        <div className="mx-auto max-w-4xl p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-gray-500">
                    {program.product} • Jour {dayData.day}/{maxDay}
                </div>
                <h1 className="text-3xl font-serif">{dayData.title}</h1>
                <div className="mt-2 text-xs text-gray-500">Version {program.version}</div>
            </div>

            {/* Objectifs / Résultats */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
                {dayData.objectives?.length ? (
                    <div className="rounded-2xl border p-4">
                        <div className="mb-2 text-sm font-semibold">Objectifs du jour</div>
                        <ul className="list-disc pl-5 text-sm text-gray-700">
                            {dayData.objectives.map((obj, i) => (
                                <li key={i}>{obj}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                {dayData.outcomes?.length ? (
                    <div className="rounded-2xl border p-4">
                        <div className="mb-2 text-sm font-semibold">Résultats attendus</div>
                        <ul className="list-disc pl-5 text-sm text-gray-700">
                            {dayData.outcomes.map((o, i) => (
                                <li key={i}>{o}</li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

            {/* Daily check */}
            {dc && Object.keys(dc).length > 0 && (
                <div className="mb-6 rounded-2xl border p-4">
                    <div className="mb-3 text-sm font-semibold">Check-in du jour</div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {Object.values(dc).map((f) => (
                            <FieldRenderer
                                key={f.key}
                                field={f as AnyField}
                                value={values[`daily.${f.key}`]}
                                onChange={(val) => setValue(`daily.${f.key}`, val)}
                                namePath={`daily.${f.key}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sections */}
            <div className="space-y-8">
                <Section label="Matin" section={dayData.blocks.morning} values={values} setValue={setValue} />
                <Section label="Midi" section={dayData.blocks.noon} values={values} setValue={setValue} />
                <Section label="Soir" section={dayData.blocks.evening} values={values} setValue={setValue} />
            </div>

            {/* Footer */}
            <div className="mt-10 flex items-center justify-between">
                <div className="flex gap-2">
                    {dayNum > 1 && (
                        <button onClick={() => goto(dayNum - 1)} className="rounded-md border px-3 py-2 hover:bg-gray-50">
                            ← Jour précédent
                        </button>
                    )}
                    {dayNum < maxDay && (
                        <button onClick={() => goto(dayNum + 1)} className="rounded-md border px-3 py-2 hover:bg-gray-50">
                            Jour suivant →
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {autoSaved === 'saving' && 'Sauvegarde…'}
                    {autoSaved === 'saved' && 'Sauvegardé ✅'}
                </div>
            </div>
        </div>
    );
}
