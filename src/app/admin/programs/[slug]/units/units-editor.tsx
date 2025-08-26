// src/app/admin/programs/[slug]/units/units-editor.tsx
'use client';

import { useState } from 'react';

type JournalSlider = { key: string; label: string; min: number; max: number; step: number };
type JournalQuestion = { key: string; label: string; placeholder?: string };
type JournalCheck = { key: string; label: string };

export type UnitLean = {
    unitIndex: number;
    title: string;
    durationMin: number;
    mantra?: string;
    videoAssetId?: string;
    audioAssetId?: string;
    contentParagraphs: string[];
    safetyNote?: string;
    journalSchema: {
        sliders: JournalSlider[];
        questions: JournalQuestion[];
        checks: JournalCheck[];
    };
    status: 'draft' | 'published';
};

type Props = {
    slug: string;
    initialUnits: UnitLean[];
};

export default function UnitsEditor({ slug, initialUnits }: Props) {
    // state
    const [units, setUnits] = useState<UnitLean[]>([...initialUnits].sort((a, b) => a.unitIndex - b.unitIndex));
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // helpers
    const nextIndex = units.length ? Math.max(...units.map((u) => u.unitIndex)) + 1 : 1;

    function addUnit() {
        setUnits((u) => [
            ...u,
            {
                unitIndex: nextIndex,
                title: `Jour ${nextIndex}`,
                durationMin: 25,
                mantra: '',
                videoAssetId: '',
                audioAssetId: '',
                contentParagraphs: [],
                safetyNote: '',
                journalSchema: {
                    sliders: [
                        { key: 'energie', label: 'Énergie', min: 0, max: 10, step: 1 },
                        { key: 'focus', label: 'Focus', min: 0, max: 10, step: 1 },
                        { key: 'paix', label: 'Paix', min: 0, max: 10, step: 1 },
                        { key: 'estime', label: 'Estime', min: 0, max: 10, step: 1 },
                    ],
                    questions: [],
                    checks: [],
                },
                status: 'draft',
            },
        ]);
    }

    function removeUnit(idx: number) {
        setUnits((u) => u.filter((x) => x.unitIndex !== idx));
    }

    function update<T extends keyof UnitLean>(idx: number, key: T, value: UnitLean[T]) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, [key]: value } : x)));
    }

    function updateParagraph(idx: number, i: number, value: string) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const arr = [...x.contentParagraphs];
                arr[i] = value;
                return { ...x, contentParagraphs: arr };
            })
        );
    }
    function addParagraph(idx: number) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, contentParagraphs: [...x.contentParagraphs, ''] } : x)));
    }
    function removeParagraph(idx: number, i: number) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const arr = x.contentParagraphs.filter((_, k) => k !== i);
                return { ...x, contentParagraphs: arr };
            })
        );
    }

    // Journal helpers
    function addQuestion(idx: number) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                return {
                    ...x,
                    journalSchema: {
                        ...x.journalSchema,
                        questions: [...x.journalSchema.questions, { key: `q${x.journalSchema.questions.length + 1}`, label: '', placeholder: '' }],
                    },
                };
            })
        );
    }
    function updateQuestion(idx: number, qIndex: number, field: keyof JournalQuestion, value: string) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const questions = x.journalSchema.questions.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q));
                return { ...x, journalSchema: { ...x.journalSchema, questions } };
            })
        );
    }
    function removeQuestion(idx: number, qIndex: number) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const questions = x.journalSchema.questions.filter((_, i) => i !== qIndex);
                return { ...x, journalSchema: { ...x.journalSchema, questions } };
            })
        );
    }

    async function save() {
        setSaving(true);
        setMessage(null);
        try {
            const body = {
                units: units
                    .slice()
                    .sort((a, b) => a.unitIndex - b.unitIndex)
                    .map((u) => ({
                        unitIndex: u.unitIndex,
                        title: u.title,
                        durationMin: u.durationMin,
                        mantra: u.mantra ?? '',
                        videoAssetId: u.videoAssetId ?? '',
                        audioAssetId: u.audioAssetId ?? '',
                        contentParagraphs: u.contentParagraphs,
                        safetyNote: u.safetyNote ?? '',
                        journal: u.journalSchema,
                        status: u.status,
                    })),
            };
            const res = await fetch(`/api/admin/units/${slug}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setMessage('Unités enregistrées ✅');
        } catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button onClick={addUnit} className="rounded bg-gray-100 px-3 py-2">
                    + Ajouter un jour
                </button>
                <button onClick={save} disabled={saving} className="rounded bg-purple-600 text-white px-3 py-2 disabled:opacity-60">
                    {saving ? 'Enregistrement…' : 'Enregistrer tout'}
                </button>
                {message && <div className="text-sm text-muted-foreground">{message}</div>}
            </div>

            {units
                .sort((a, b) => a.unitIndex - b.unitIndex)
                .map((u) => (
                    <div key={u.unitIndex} className="rounded-xl border p-4 space-y-3 bg-white">
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                className="border rounded p-2 w-20"
                                value={u.unitIndex}
                                onChange={(e) => update(u.unitIndex, 'unitIndex', Math.max(1, Number(e.target.value) || 1) as UnitLean['unitIndex'])}
                                title="Index (J1=1)"
                            />
                            <input
                                className="border rounded p-2 flex-1"
                                value={u.title}
                                onChange={(e) => update(u.unitIndex, 'title', e.target.value)}
                                placeholder="Titre du jour"
                            />
                            <select className="border rounded p-2" value={u.status} onChange={(e) => update(u.unitIndex, 'status', e.target.value as UnitLean['status'])}>
                                <option value="draft">draft</option>
                                <option value="published">published</option>
                            </select>
                            <button onClick={() => removeUnit(u.unitIndex)} className="ml-auto rounded border px-3 py-2">
                                Supprimer
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                            <input
                                type="number"
                                className="border rounded p-2"
                                value={u.durationMin}
                                onChange={(e) => update(u.unitIndex, 'durationMin', Number(e.target.value) || 0)}
                                placeholder="Durée (min)"
                            />
                            <input className="border rounded p-2" value={u.mantra ?? ''} onChange={(e) => update(u.unitIndex, 'mantra', e.target.value)} placeholder="Mantra" />
                            <input
                                className="border rounded p-2"
                                value={u.videoAssetId ?? ''}
                                onChange={(e) => update(u.unitIndex, 'videoAssetId', e.target.value)}
                                placeholder="Vidéo (id ou URL)"
                            />
                            <input
                                className="border rounded p-2"
                                value={u.audioAssetId ?? ''}
                                onChange={(e) => update(u.unitIndex, 'audioAssetId', e.target.value)}
                                placeholder="Audio (id ou URL)"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="font-semibold">Journal (questions libres) + curseurs par défaut</div>
                            {u.journalSchema.questions.map((q, i) => (
                                <div key={`${u.unitIndex}-q-${i}`} className="grid md:grid-cols-3 gap-2">
                                    <input
                                        className="border rounded p-2"
                                        value={q.key}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'key', e.target.value)}
                                        placeholder="key (ex: note)"
                                    />
                                    <input
                                        className="border rounded p-2"
                                        value={q.label}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'label', e.target.value)}
                                        placeholder="Label"
                                    />
                                    <input
                                        className="border rounded p-2"
                                        value={q.placeholder ?? ''}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'placeholder', e.target.value)}
                                        placeholder="Placeholder"
                                    />
                                    <button type="button" onClick={() => removeQuestion(u.unitIndex, i)} className="rounded border px-3 py-2">
                                        Supprimer
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addQuestion(u.unitIndex)} className="rounded bg-gray-100 px-3 py-1">
                                + Ajouter une question
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="font-semibold">Texte d’accompagnement (paragraphes)</div>
                            {u.contentParagraphs.map((p, i) => (
                                <div key={`${u.unitIndex}-p-${i}`} className="flex gap-2">
                                    <textarea
                                        className="border rounded p-2 w-full"
                                        rows={3}
                                        value={p}
                                        onChange={(e) => updateParagraph(u.unitIndex, i, e.target.value)}
                                        placeholder={`Paragraphe ${i + 1}`}
                                    />
                                    <button type="button" onClick={() => removeParagraph(u.unitIndex, i)} className="rounded border px-3 py-2">
                                        X
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addParagraph(u.unitIndex)} className="rounded bg-gray-100 px-3 py-1">
                                + Ajouter un paragraphe
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="font-semibold">Encadré sécurité</div>
                            <textarea
                                className="border rounded p-2 w-full"
                                rows={3}
                                value={u.safetyNote ?? ''}
                                onChange={(e) => update(u.unitIndex, 'safetyNote', e.target.value)}
                                placeholder="Rappels sécurité (court)"
                            />
                        </div>
                    </div>
                ))}
        </div>
    );
}
