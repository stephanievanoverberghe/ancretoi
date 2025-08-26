'use client';

import { useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

/* ---------------- Types de champs journal ---------------- */

type FieldTextShort = {
    id: string;
    type: 'text_short';
    label: string;
    required?: boolean;
    minLen?: number;
    maxLen?: number;
    placeholder?: string;
};

type FieldTextLong = {
    id: string;
    type: 'text_long';
    label: string;
    required?: boolean;
    minLen?: number;
    maxLen?: number;
    placeholder?: string;
};

type FieldSlider = {
    id: string;
    type: 'slider';
    label: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
};

type FieldCheckbox = {
    id: string;
    type: 'checkbox';
    label: string;
    required?: boolean;
};

type FieldChips = {
    id: string;
    type: 'chips';
    label: string;
    required?: boolean;
    options?: string[];
};

type FieldScoreGroup = {
    id: string;
    type: 'score_group';
    label: string;
    required?: boolean;
};

type Field = FieldTextShort | FieldTextLong | FieldSlider | FieldCheckbox | FieldChips | FieldScoreGroup;

type JournalSchema = { fields: Field[] };

/* ---------------- Types Unit côté DB & Form ---------------- */

type UnitDoc = {
    programSlug: string;
    unitType: 'day';
    unitIndex: number;
    title: string;
    introText?: string;
    mantra?: string;
    durationMin?: number;
    videoAssetId?: string;
    status?: 'draft' | 'published';
    journalSchema?: JournalSchema;
};

type UnitForm = {
    programSlug: string;
    unitIndex: number;
    title: string;
    introText?: string;
    mantra?: string;
    durationMin?: number;
    videoAssetId?: string;
    fields: Field[];
    status?: 'draft' | 'published';
};

/* ---------------- Utils ---------------- */

function toCommaString(arr?: string[]) {
    return (arr ?? []).join(', ');
}

function fromCommaString(s: string) {
    return s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function uid(prefix = 'f') {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function assertUniqueIds(fields: Field[]) {
    const ids = fields.map((f) => f.id);
    const seen = new Set<string>();
    for (const id of ids) {
        if (!id) throw new Error('Chaque champ doit avoir un id non vide.');
        if (!/^[a-z0-9_]+$/.test(id)) {
            throw new Error(`L'id "${id}" doit contenir uniquement [a-z0-9_].`);
        }
        if (seen.has(id)) throw new Error(`ID de champ dupliqué: "${id}".`);
        seen.add(id);
    }
}

/* ---------------- Composant principal ---------------- */

export default function UnitsEditor({ slug, initialUnits }: { slug: string; initialUnits: UnitDoc[] }) {
    const [currentIndex, setCurrentIndex] = useState<number>(initialUnits?.[0]?.unitIndex || 1);

    const currentUnit = useMemo<UnitDoc>(() => {
        const found = initialUnits.find((u) => u.unitIndex === currentIndex) ?? undefined;
        return (
            found ?? {
                programSlug: slug,
                unitType: 'day',
                unitIndex: currentIndex,
                title: '',
                introText: '',
                mantra: '',
                durationMin: 20,
                status: 'draft',
                journalSchema: { fields: [] },
            }
        );
    }, [initialUnits, currentIndex, slug]);

    const form = useForm<UnitForm>({
        defaultValues: {
            programSlug: slug,
            unitIndex: currentIndex,
            title: currentUnit.title || '',
            introText: currentUnit.introText || '',
            mantra: currentUnit.mantra || '',
            durationMin: currentUnit.durationMin ?? 20,
            videoAssetId: currentUnit.videoAssetId || '',
            fields: currentUnit.journalSchema?.fields ?? [],
            status: currentUnit.status ?? 'draft',
        },
    });

    const {
        fields: journalFields,
        append,
        remove,
        move,
        update,
    } = useFieldArray<UnitForm, 'fields'>({
        control: form.control,
        name: 'fields',
    });

    /* --------- Ajouts rapides de champs --------- */

    function addTextShort() {
        append({
            id: uid('txt'),
            type: 'text_short',
            label: 'Texte court',
            required: false,
        } as FieldTextShort);
    }
    function addTextLong() {
        append({
            id: uid('text'),
            type: 'text_long',
            label: 'Texte long',
            required: true,
        } as FieldTextLong);
    }
    function addSlider() {
        append({
            id: uid('sld'),
            type: 'slider',
            label: 'Intensité',
            min: 0,
            max: 10,
            step: 1,
        } as FieldSlider);
    }
    function addCheckbox() {
        append({
            id: uid('chk'),
            type: 'checkbox',
            label: 'Pratique faite',
            required: false,
        } as FieldCheckbox);
    }
    function addChips() {
        append({
            id: uid('tag'),
            type: 'chips',
            label: 'Mots-clés',
            options: [],
        } as FieldChips);
    }
    function addScoreGroup() {
        append({
            id: uid('score'),
            type: 'score_group',
            label: 'Scores (Énergie/Focus/Paix/Estime)',
            required: true,
        } as FieldScoreGroup);
    }

    /* --------- Bibliothèque de blocs pédagogiques --------- */

    function addBlockBaselineJ1() {
        append([
            { id: 'baseline', type: 'score_group', label: 'Score de base', required: true } as FieldScoreGroup,
            { id: 'intention', type: 'text_long', label: 'Ton intention', required: true, minLen: 20 } as FieldTextLong,
        ]);
    }

    function addBlockRAIN() {
        append([
            { id: 'emotion', type: 'text_short', label: 'Émotion du jour', required: true, maxLen: 60 } as FieldTextShort,
            { id: 'soin', type: 'text_long', label: 'Ta phrase de soin', required: true, minLen: 40 } as FieldTextLong,
            { id: 'intensity', type: 'slider', label: 'Intensité', min: 0, max: 10, step: 1 } as FieldSlider,
            { id: 'mantra', type: 'text_short', label: 'Ton mantra du jour', placeholder: 'Je peux ressentir sans me perdre.' } as FieldTextShort,
        ]);
    }

    function addBlockCIA() {
        append([
            { id: 'cible', type: 'text_short', label: 'Cible concrète', required: true } as FieldTextShort,
            { id: 'impact', type: 'text_long', label: 'Impact si tu agis', required: true } as FieldTextLong,
            { id: 'action', type: 'text_long', label: 'Action minuscule aujourd’hui', required: true } as FieldTextLong,
            { id: 'done', type: 'checkbox', label: 'Action effectuée ?', required: false } as FieldCheckbox,
        ]);
    }

    function addBlockCNV() {
        append([
            { id: 'observation', type: 'text_long', label: 'Observation (sans jugement)', required: true } as FieldTextLong,
            { id: 'sentiment', type: 'text_short', label: 'Ce que je ressens', required: true } as FieldTextShort,
            { id: 'besoin', type: 'text_short', label: 'Mon besoin', required: true } as FieldTextShort,
            { id: 'demande', type: 'text_long', label: 'Ma demande concrète', required: true } as FieldTextLong,
        ]);
    }

    function addBlockPlan30() {
        append([
            { id: 'objectif30', type: 'text_long', label: 'Objectif sur 30 jours', required: true } as FieldTextLong,
            { id: 'premier_pas', type: 'text_short', label: 'Premier pas demain', required: true } as FieldTextShort,
            { id: 'rituel', type: 'text_short', label: 'Ton rituel de maintien', required: true } as FieldTextShort,
            { id: 'ok_pratique', type: 'checkbox', label: 'Je m’engage à pratiquer', required: false } as FieldCheckbox,
        ]);
    }

    function addBlockBilanJ7() {
        append([
            { id: 'delta_scores', type: 'score_group', label: 'Tes scores aujourd’hui', required: true } as FieldScoreGroup,
            { id: 'prise_conscience', type: 'text_long', label: 'Ta plus grande prise de conscience', required: true } as FieldTextLong,
            { id: 'lettre_a_toi', type: 'text_long', label: 'Lettre à toi-même', required: true, minLen: 60 } as FieldTextLong,
        ]);
    }

    /* --------- Envoi --------- */

    async function onSubmit(v: UnitForm) {
        try {
            assertUniqueIds(v.fields);
            const res = await fetch('/api/admin/units', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(v),
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || 'Erreur serveur');
            }
            alert('Jour enregistré ✅');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Échec enregistrement ❌\n${msg}`);
        }
    }

    /* --------- UI --------- */

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Sélecteur des 7 jours */}
            <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <button
                        type="button"
                        key={i}
                        className={`px-3 py-1 rounded ${i === currentIndex ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => {
                            setCurrentIndex(i);
                            const next = initialUnits.find((u) => u.unitIndex === i) ?? undefined;
                            form.reset({
                                programSlug: slug,
                                unitIndex: i,
                                title: next?.title || '',
                                introText: next?.introText || '',
                                mantra: next?.mantra || '',
                                durationMin: next?.durationMin ?? 20,
                                videoAssetId: next?.videoAssetId || '',
                                fields: next?.journalSchema?.fields || [],
                                status: next?.status ?? 'draft',
                            });
                        }}
                    >
                        Jour {i}
                    </button>
                ))}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Entête unité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input {...form.register('title', { required: true })} placeholder="Titre" className="border rounded p-2" />
                    <input {...form.register('mantra')} placeholder="Mantra" className="border rounded p-2" />
                    <input {...form.register('videoAssetId')} placeholder="VideoAssetId" className="border rounded p-2" />
                    <input type="number" {...form.register('durationMin', { valueAsNumber: true })} placeholder="Durée (min)" className="border rounded p-2" />
                </div>

                <textarea {...form.register('introText')} placeholder="Texte d’accompagnement (300–500 mots)" rows={5} className="border rounded p-2 w-full" />

                {/* Bibliothèque & ajout de champs */}
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <span className="font-semibold my-1 mr-2">Ajouter un champ :</span>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addTextShort}>
                            + texte court
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addTextLong}>
                            + texte long
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addSlider}>
                            + slider
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addCheckbox}>
                            + checkbox
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addChips}>
                            + chips
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={addScoreGroup}>
                            + score_group
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="font-semibold my-1 mr-2">Blocs pédagogiques :</span>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockBaselineJ1}>
                            Baseline J1
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockRAIN}>
                            RAIN (J3)
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockCIA}>
                            C-I-A (J4)
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockCNV}>
                            CNV (J5)
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockPlan30}>
                            Plan 30j (J6)
                        </button>
                        <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={addBlockBilanJ7}>
                            Bilan (J7)
                        </button>
                    </div>
                </div>

                {/* Éditeur des champs */}
                <div className="space-y-3">
                    <h3 className="font-semibold">Journal — champs</h3>

                    {journalFields.map((f, i) => {
                        const field = f as unknown as Field; // seule concession locale, compatible avec RHF ids
                        const baseRow = (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input {...form.register(`fields.${i}.id` as const)} placeholder="id (ex: intention)" className="border rounded p-2" />
                                <select
                                    {...form.register(`fields.${i}.type` as const)}
                                    className="border rounded p-2"
                                    onChange={(e) => {
                                        const nextType = e.target.value as Field['type'];
                                        // si on change de type, on nettoie les props spécifiques
                                        const next: Field = { id: form.getValues(`fields.${i}.id`), label: form.getValues(`fields.${i}.label`), type: nextType } as Field;
                                        if (nextType === 'slider') Object.assign(next, { min: 0, max: 10, step: 1 });
                                        if (nextType === 'chips') Object.assign(next, { options: [] as string[] });
                                        update(i, next);
                                    }}
                                >
                                    <option value="text_short">text_short</option>
                                    <option value="text_long">text_long</option>
                                    <option value="slider">slider</option>
                                    <option value="checkbox">checkbox</option>
                                    <option value="chips">chips</option>
                                    <option value="score_group">score_group</option>
                                </select>
                                <input {...form.register(`fields.${i}.label` as const)} placeholder="Label" className="border rounded p-2" />
                            </div>
                        );

                        return (
                            <div key={f.id} className="border rounded p-3 space-y-2 bg-white">
                                {baseRow}

                                {/* Props spécifiques selon type */}
                                {field.type === 'text_short' || field.type === 'text_long' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input {...form.register(`fields.${i}.placeholder` as const)} placeholder="Placeholder" className="border rounded p-2" />
                                        <input
                                            type="number"
                                            {...form.register(`fields.${i}.minLen` as const, { valueAsNumber: true })}
                                            placeholder="minLen"
                                            className="border rounded p-2"
                                        />
                                        <input
                                            type="number"
                                            {...form.register(`fields.${i}.maxLen` as const, { valueAsNumber: true })}
                                            placeholder="maxLen"
                                            className="border rounded p-2"
                                        />
                                    </div>
                                ) : null}

                                {field.type === 'slider' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            {...form.register(`fields.${i}.min` as const, { valueAsNumber: true })}
                                            placeholder="min"
                                            className="border rounded p-2"
                                        />
                                        <input
                                            type="number"
                                            {...form.register(`fields.${i}.max` as const, { valueAsNumber: true })}
                                            placeholder="max"
                                            className="border rounded p-2"
                                        />
                                        <input
                                            type="number"
                                            {...form.register(`fields.${i}.step` as const, { valueAsNumber: true })}
                                            placeholder="step"
                                            className="border rounded p-2"
                                        />
                                    </div>
                                ) : null}

                                {field.type === 'chips' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input
                                            defaultValue={toCommaString((field as FieldChips).options)}
                                            onChange={(e) =>
                                                update(i, {
                                                    ...(form.getValues(`fields.${i}`) as FieldChips),
                                                    options: fromCommaString(e.target.value),
                                                } as FieldChips)
                                            }
                                            placeholder="Options séparées par des virgules"
                                            className="border rounded p-2"
                                        />
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" {...form.register(`fields.${i}.required` as const)} /> requis
                                    </label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => move(i, Math.max(0, i - 1))} className="px-2 py-1 bg-gray-100 rounded">
                                            ↑
                                        </button>
                                        <button type="button" onClick={() => move(i, Math.min(journalFields.length - 1, i + 1))} className="px-2 py-1 bg-gray-100 rounded">
                                            ↓
                                        </button>
                                        <button type="button" onClick={() => remove(i)} className="px-2 py-1 bg-red-100 rounded">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <select {...form.register('status')} className="border rounded p-2">
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                    </select>
                    <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white">
                        Enregistrer
                    </button>
                </div>

                {/* champs cachés */}
                <input type="hidden" {...form.register('programSlug')} />
                <input type="hidden" {...form.register('unitIndex', { valueAsNumber: true })} />
            </form>
        </div>
    );
}
