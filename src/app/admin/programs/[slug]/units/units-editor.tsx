// app/admin/programs/[slug]/page/units-editor.tsx

'use client';

import { useEffect, useMemo, useRef, useState, useId, useCallback, type ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import {
    Plus,
    Copy,
    Trash2,
    Save,
    ChevronLeft,
    ChevronRight,
    Type,
    Italic,
    Code,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Eye,
    EyeOff,
    ScanLine,
    TimerReset,
    CheckSquare,
    StickyNote,
    Lock,
    Unlock,
} from 'lucide-react';

/* ---------------- Types ---------------- */
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
    contentParagraphs: string[]; // Markdown
    safetyNote?: string;
    journalSchema: {
        sliders: JournalSlider[];
        questions: JournalQuestion[];
        checks: JournalCheck[];
    };
    status: 'draft' | 'published';
};

type Props = { slug: string; initialUnits: UnitLean[] };

/* ---------------- Constants & utils ---------------- */
const SCAN_RGX = /^scan(\d+)_(sensation|zone|intensite)$/;
const S10 = (key: string, label: string): JournalSlider => ({ key, label, min: 0, max: 10, step: 1 });
const BASELINE: JournalSlider[] = [S10('energie', 'Énergie (/10)'), S10('focus', 'Focus (/10)'), S10('paix', 'Paix (/10)'), S10('estime', 'Estime (/10)')];
const CHECKOUT: JournalSlider[] = [
    S10('energie_out', 'Énergie (après) (/10)'),
    S10('focus_out', 'Focus (après) (/10)'),
    S10('paix_out', 'Paix (après) (/10)'),
    S10('estime_out', 'Estime (après) (/10)'),
];

type ApiError = { error: unknown; [k: string]: unknown };
const hasApiError = (x: unknown): x is ApiError => typeof x === 'object' && x !== null && 'error' in x;
function uniqByKey<T extends { key: string }>(arr: T[]): T[] {
    const map = new Map<string, T>();
    for (const it of arr) if (!map.has(it.key)) map.set(it.key, it);
    return Array.from(map.values());
}
function uniqMerge<T extends { key: string }>(base: T[], add: T[]) {
    return uniqByKey([...base, ...add]);
}

/* ---------------- UI Primitives ---------------- */

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {right}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'brand' | 'blue' }) {
    const cls = {
        default: 'border-border bg-background',
        brand: 'border-brand-200 bg-brand-50 text-brand-800',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
    }[tone];
    return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}

/* ---------------- Modal (full) ---------------- */
function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children?: ReactNode; footer?: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const titleId = useId();
    useEffect(() => setMounted(true), []);

    // Lock scroll + ESC
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, mounted, onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000]">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? titleId : undefined}
                    className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
                >
                    {title && (
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <h3 id={titleId} className="text-base font-semibold">
                                {title}
                            </h3>
                            <button onClick={onClose} className="rounded-full border border-border p-1.5 hover:bg-muted" aria-label="Fermer">
                                <span className="sr-only">Fermer</span>×
                            </button>
                        </div>
                    )}
                    <div className="px-5 py-4">{children}</div>
                    <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                        {footer}
                        <button onClick={onClose} className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    onCancel,
    onConfirm,
}: {
    open: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            footer={
                <>
                    <button onClick={onCancel} className="rounded border border-border px-3 py-2 text-sm">
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm} className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:opacity-90">
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="text-sm text-foreground/80">{message}</div>
        </Modal>
    );
}

/* ---------------- Markdown mini-render & editor ---------------- */
function mdRenderBasic(md: string) {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c as '&' | '<' | '>' | '"']!));
    let html = esc(md);
    html = html.replace(/^---$/gm, '<hr/>');
    html = html.replace(/^### (.*)$/gm, '<h3 class="text-base font-semibold mt-2 mb-1">$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2 class="text-lg font-semibold mt-2 mb-1">$1</h2>');
    html = html.replace(/^> (.*)$/gm, '<blockquote class="border-l-2 pl-3 text-muted-foreground">$1</blockquote>');
    html = html.replace(/(^|\n)(\d+\.\s.*(?:\n\d+\.\s.*)*)/g, (_m: string, p1: string, block: string) => {
        const items = block
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => l.replace(/^\d+\.\s*/, ''))
            .map((li) => `<li>${li}</li>`)
            .join('');
        return `${p1}<ol class="ml-5 list-decimal space-y-1">${items}</ol>`;
    });
    html = html.replace(/(^|\n)(-\s.*(?:\n-\s.*)*)/g, (_m: string, p1: string, block: string) => {
        const items = block
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => l.replace(/^-+\s*/, '').replace(/^- /, ''))
            .map((li) => `<li>${li}</li>`)
            .join('');
        return `${p1}<ul class="ml-5 list-disc space-y-1">${items}</ul>`;
    });
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code class="px-1 rounded bg-muted">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-brand-700 underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = `<p>${html}</p>`;
    return html;
}

function ToolbarButton({ onClick, children, title }: { onClick: () => void; children: ReactNode; title?: string }) {
    return (
        <button type="button" title={title} onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted">
            {children}
        </button>
    );
}

function ParagraphEditor({ value, onChange, onRemove, idx }: { value: string; onChange: (v: string) => void; onRemove: () => void; idx: number }) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const [preview, setPreview] = useState(false);

    const surround = (prefix: string, suffix = prefix) => {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const selected = value.slice(start, end);
        const after = value.slice(end);
        const body = selected || 'texte';
        const newVal = `${before}${prefix}${body}${suffix}${after}`;
        onChange(newVal);
        requestAnimationFrame(() => {
            ta.focus();
            ta.selectionStart = start + prefix.length;
            ta.selectionEnd = start + prefix.length + body.length;
        });
    };

    const listify = (ordered: boolean) => {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const sel = value.slice(start, end) || 'élément';
        const after = value.slice(end);
        const lines = sel
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        const block = ordered ? lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '')}`).join('\n') : lines.map((l) => `- ${l.replace(/^-+\s*/, '')}`).join('\n');
        onChange(`${before}${block}${after}`);
        requestAnimationFrame(() => taRef.current?.focus());
    };

    const atLineStart = (token: string, fallback = 'titre') => {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const sel = value.slice(start, end) || fallback;
        const after = value.slice(end);
        const block = sel
            .split('\n')
            .map((l) => `${token}${l.replace(/^#{1,3}\s*/, '').replace(/^>\s*/, '')}`)
            .join('\n');
        onChange(`${before}${block}${after}`);
        requestAnimationFrame(() => taRef.current?.focus());
    };

    return (
        <div className="rounded-2xl border border-border p-2">
            <div className="flex flex-wrap items-center gap-1 text-sm">
                <ToolbarButton onClick={() => surround('**')} title="Gras (Ctrl+B)">
                    <Type className="h-3.5 w-3.5" />B
                </ToolbarButton>
                <ToolbarButton onClick={() => surround('*')} title="Italique">
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => surround('`')} title="Code">
                    <Code className="h-3.5 w-3.5" />
                </ToolbarButton>
                <span className="mx-1 text-muted-foreground">|</span>
                <ToolbarButton onClick={() => atLineStart('## ')} title="Titre H2">
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => atLineStart('### ')} title="Titre H3">
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <span className="mx-1 text-muted-foreground">|</span>
                <ToolbarButton onClick={() => listify(false)} title="Liste à puces">
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => listify(true)} title="Liste numérotée">
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => atLineStart('> ', 'citation')} title="Bloc citation">
                    &gt;
                </ToolbarButton>
                <ToolbarButton onClick={() => surround('[', '](https://)')} title="Lien">
                    <LinkIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => onChange(value + (value.endsWith('\n') ? '' : '\n') + '---\n')} title="Séparateur">
                    —
                </ToolbarButton>
                <span className="ml-auto text-xs text-muted-foreground">Paragraphe {idx + 1}</span>
            </div>

            {preview ? (
                <div className="prose max-w-none mt-2 rounded-xl border border-border p-3" dangerouslySetInnerHTML={{ __html: mdRenderBasic(value || '') }} />
            ) : (
                <textarea
                    ref={taRef}
                    className="mt-2 w-full rounded-xl border border-border p-2"
                    rows={5}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Texte (Markdown autorisé)"
                />
            )}

            <div className="mt-2 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                    {preview ? (
                        <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Éditer
                        </>
                    ) : (
                        <>
                            <Eye className="h-3.5 w-3.5" />
                            Aperçu
                        </>
                    )}
                </button>
                <button type="button" onClick={onRemove} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
                    Supprimer le paragraphe
                </button>
            </div>
        </div>
    );
}

/* =======================================================
   Component
======================================================= */
export default function UnitsEditor({ slug, initialUnits }: Props) {
    /* ---------- state ---------- */
    const [units, setUnits] = useState<UnitLean[]>(
        [...initialUnits]
            .sort((a, b) => a.unitIndex - b.unitIndex)
            .map((u) => ({
                ...u,
                journalSchema: {
                    sliders: u.journalSchema?.sliders ?? [],
                    questions: u.journalSchema?.questions ?? [],
                    checks: u.journalSchema?.checks ?? [],
                },
                contentParagraphs: u.contentParagraphs ?? [],
            }))
    );

    // navigation
    const indices = useMemo(() => units.map((u) => u.unitIndex).sort((a, b) => a - b), [units]);

    const minIndex = indices[0] ?? 1;
    const maxIndex = indices[indices.length - 1] ?? 1;
    const [current, setCurrent] = useState<number>(minIndex);
    const currentUnit = useMemo(() => units.find((u) => u.unitIndex === current) ?? units[0], [units, current]);

    // flags & modales
    const [saving, setSaving] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [successInfo, setSuccessInfo] = useState<{ count: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: ReactNode; onConfirm: () => void } | null>(null);
    const [pruneMode, setPruneMode] = useState(false);

    /* ---------- save ---------- */
    const actuallySaveAll = useCallback(async () => {
        try {
            setSaving(true);
            setErrorMsg(null);
            const payload = {
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
                        journal: {
                            sliders: u.journalSchema.sliders,
                            questions: u.journalSchema.questions,
                            checks: u.journalSchema.checks,
                        },
                        status: u.status,
                    })),
            };

            const res = await fetch(`/api/admin/units?slug=${encodeURIComponent(slug)}&prune=${pruneMode ? 'true' : 'false'}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', accept: 'application/json' },
                body: JSON.stringify(payload),
            });

            const ct = res.headers.get('content-type') || '';
            const data: unknown = ct.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                if (hasApiError(data)) throw new Error(String((data as ApiError).error ?? `HTTP ${res.status}`));
                throw new Error(typeof data === 'string' ? data : `HTTP ${res.status}`);
            }

            setSuccessInfo({ count: payload.units.length });
            setSuccessOpen(true);
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }, [pruneMode, slug, units]);

    const saveAll = useCallback(() => {
        if (!pruneMode) {
            void actuallySaveAll();
            return;
        }
        setConfirm({
            open: true,
            title: 'Confirmer le “prune”',
            message: (
                <div className="space-y-1">
                    <p>
                        Tu as activé <strong>prune</strong> — les unités non présentes dans ce payload seront supprimées en base.
                    </p>
                    <p>Tu confirmes ?</p>
                </div>
            ),
            onConfirm: () => {
                setConfirm(null);
                void actuallySaveAll();
            },
        });
    }, [actuallySaveAll, pruneMode]);

    // keyboard save (ctrl/cmd + s) – dépend UNIQUEMENT de saveAll (stable)
    const onKeySave = useCallback(
        (e: ReactKeyboardEvent | KeyboardEvent) => {
            const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
            const domEvt = e as KeyboardEvent;
            const withMod = (isMac && domEvt.metaKey) || (!isMac && domEvt.ctrlKey);
            if ('key' in e && (e.key === 's' || e.key === 'S') && withMod) {
                e.preventDefault();
                void saveAll();
            }
        },
        [saveAll]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => onKeySave(e);
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onKeySave]);

    /* ---------- helpers nav ---------- */
    const goPrev = () => {
        const pos = indices.indexOf(current);
        if (pos > 0) setCurrent(indices[pos - 1]);
    };
    const goNext = () => {
        const pos = indices.indexOf(current);
        if (pos !== -1 && pos < indices.length - 1) setCurrent(indices[pos + 1]);
    };

    /* ---------- unit ops ---------- */
    const nextIndex = useMemo(() => (units.length ? Math.max(...units.map((u) => u.unitIndex)) + 1 : 1), [units]);

    function addUnit(after?: number) {
        const newIdx = after ? after + 1 : nextIndex;
        const newUnit: UnitLean = {
            unitIndex: newIdx,
            title: `Jour ${newIdx}`,
            durationMin: 20,
            mantra: '',
            videoAssetId: '',
            audioAssetId: '',
            contentParagraphs: [],
            safetyNote: '',
            journalSchema: { sliders: [], questions: [], checks: [] },
            status: 'draft',
        };
        setUnits((u) => [...u, newUnit].sort((a, b) => a.unitIndex - b.unitIndex));
        setCurrent(newIdx);
    }

    function duplicateUnit(idx: number) {
        const src = units.find((u) => u.unitIndex === idx);
        if (!src) return;
        const newIdx = nextIndex;
        const clone: UnitLean = {
            ...structuredClone(src),
            unitIndex: newIdx,
            title: src.title.replace(/^Unité\s+\d+|Jour\s+\d+/i, `Jour ${newIdx}`) || `Jour ${newIdx}`,
            status: 'draft',
        };
        setUnits((u) => [...u, clone].sort((a, b) => a.unitIndex - b.unitIndex));
        setCurrent(newIdx);
    }

    function askDelete(idx: number) {
        setConfirm({
            open: true,
            title: `Supprimer le jour ${idx} ?`,
            message: 'Cette action supprimera définitivement cette unité en base de données.',
            onConfirm: () => void doDelete(idx),
        });
    }

    async function doDelete(idx: number) {
        try {
            const res = await fetch(`/api/admin/units?slug=${encodeURIComponent(slug)}&unitIndex=${idx}`, {
                method: 'DELETE',
                headers: { accept: 'application/json' },
            });
            const ct = res.headers.get('content-type') || '';
            const data: unknown = ct.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                if (hasApiError(data)) throw new Error(String((data as ApiError).error ?? `HTTP ${res.status}`));
                throw new Error(typeof data === 'string' ? data : `HTTP ${res.status}`);
            }
            setUnits((prev) => {
                const next = prev.filter((x) => x.unitIndex !== idx).sort((a, b) => a.unitIndex - b.unitIndex);
                const ids = next.map((u) => u.unitIndex);
                setCurrent(ids.length ? ids[Math.max(0, ids.findIndex((i) => i > idx) - 1)] ?? ids[0] : 0);
                return next;
            });
        } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setConfirm(null);
        }
    }

    function update<T extends keyof UnitLean>(idx: number, key: T, value: UnitLean[T]) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, [key]: value } : x)));
    }

    /* ---------- paragraphs ---------- */
    function addParagraph(idx: number) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, contentParagraphs: [...x.contentParagraphs, ''] } : x)));
    }
    function updateParagraph(idx: number, i: number, value: string) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, contentParagraphs: x.contentParagraphs.map((p, k) => (k === i ? value : p)) } : x)));
    }
    function removeParagraph(idx: number, i: number) {
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, contentParagraphs: x.contentParagraphs.filter((_, k) => k !== i) })));
    }

    /* ---------- sliders / questions / checks ---------- */
    const addSlider = (idx: number) =>
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, journalSchema: { ...x.journalSchema, sliders: [...x.journalSchema.sliders, S10('', 'Score (/10)')] } } : x)));
    const updateSlider = (idx: number, sIndex: number, field: keyof JournalSlider, value: string | number) =>
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const sliders = x.journalSchema.sliders.map((s, i) => (i === sIndex ? { ...s, [field]: value } : s));
                return { ...x, journalSchema: { ...x.journalSchema, sliders } };
            })
        );
    const removeSlider = (idx: number, sIndex: number) =>
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, sliders: x.journalSchema.sliders.filter((_, i) => i !== sIndex) } })));

    const addQuestion = (idx: number) =>
        setUnits((u) =>
            u.map((x) =>
                x.unitIndex === idx
                    ? {
                          ...x,
                          journalSchema: {
                              ...x.journalSchema,
                              questions: [...x.journalSchema.questions, { key: `q${x.journalSchema.questions.length + 1}`, label: '', placeholder: '' }],
                          },
                      }
                    : x
            )
        );

    const updateQuestion = (idx: number, qIndex: number, field: keyof JournalQuestion, value: string) =>
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const questions = x.journalSchema.questions.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q));
                return { ...x, journalSchema: { ...x.journalSchema, questions } };
            })
        );

    const removeQuestion = (idx: number, qIndex: number) =>
        setUnits((u) =>
            u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, questions: x.journalSchema.questions.filter((_, i) => i !== qIndex) } }))
        );

    const addCheck = (idx: number) =>
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, checks: [...x.journalSchema.checks, { key: '', label: '' }] } })));

    const updateCheck = (idx: number, cIndex: number, field: keyof JournalCheck, value: string) =>
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const checks = x.journalSchema.checks.map((c, i) => (i === cIndex ? { ...c, [field]: value } : c));
                return { ...x, journalSchema: { ...x.journalSchema, checks } };
            })
        );

    const removeCheck = (idx: number, cIndex: number) =>
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, checks: x.journalSchema.checks.filter((_, i) => i !== cIndex) } })));

    /* ---------- SCAN helpers ---------- */
    function getScanIndices(u: UnitLean): number[] {
        const set = new Set<number>();
        for (const q of u.journalSchema.questions) {
            const m = q.key.match(SCAN_RGX);
            if (m) set.add(Number(m[1]));
        }
        return Array.from(set).sort((a, b) => a - b);
    }
    const nextScanIndex = (u: UnitLean) => {
        const ids = getScanIndices(u);
        return ids.length ? Math.max(...ids) + 1 : 1;
    };
    function addScan(idx: number) {
        setUnits((arr) =>
            arr.map((x) => {
                if (x.unitIndex !== idx) return x;
                const n = nextScanIndex(x);
                const add: JournalQuestion[] = [
                    { key: `scan${n}_sensation`, label: `Sensation ${n} (quoi)`, placeholder: 'chaud / lourd / picote…' },
                    { key: `scan${n}_zone`, label: `Zone ${n} (où)`, placeholder: 'poitrine / mâchoire / ventre…' },
                    { key: `scan${n}_intensite`, label: `Intensité ${n} (/10)`, placeholder: '0–10' },
                ];
                return { ...x, journalSchema: { ...x.journalSchema, questions: uniqMerge(x.journalSchema.questions, add) } };
            })
        );
    }
    function removeScan(idx: number, scanIndex: number) {
        const kill = new Set([`scan${scanIndex}_sensation`, `scan${scanIndex}_zone`, `scan${scanIndex}_intensite`]);
        setUnits((arr) =>
            arr.map((x) =>
                x.unitIndex !== idx
                    ? x
                    : {
                          ...x,
                          journalSchema: { ...x.journalSchema, questions: x.journalSchema.questions.filter((q) => !kill.has(q.key)) },
                      }
            )
        );
    }

    if (!currentUnit) {
        return (
            <div className="flex items-center gap-2">
                <button onClick={() => addUnit()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
                    <Plus className="h-4 w-4" /> Créer une unité
                </button>
            </div>
        );
    }

    const u = currentUnit;

    const sliderKeys = new Set(u.journalSchema.sliders.map((s) => s.key));
    const hasBaseline = BASELINE.every((s) => sliderKeys.has(s.key));
    const hasCheckout = CHECKOUT.every((s) => sliderKeys.has(s.key));
    const scanIndices = getScanIndices(u);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            {/* ───────── Sidebar (sticky) ───────── */}
            <aside className="lg:sticky lg:top-4 lg:self-start rounded-2xl border border-border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Parcours — {slug}</h2>
                    <Badge tone={u.status === 'published' ? 'blue' : 'default'}>{u.status === 'published' ? <>publié</> : <>brouillon</>}</Badge>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <button onClick={goPrev} disabled={current === minIndex} className="rounded-lg border px-2 py-1 disabled:opacity-50">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={goNext} disabled={current === maxIndex} className="rounded-lg border px-2 py-1 disabled:opacity-50">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => addUnit(current)} className="ml-auto inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted">
                        <Plus className="h-4 w-4" /> Ajouter
                    </button>
                </div>

                <div className="mt-3 max-h-[50vh] overflow-auto rounded-xl border">
                    <ul className="divide-y">
                        {indices.map((i) => (
                            <li key={`nav-${i}`}>
                                <button
                                    onClick={() => setCurrent(i)}
                                    className={['flex w-full items-center justify-between px-3 py-2 text-sm', i === current ? 'bg-brand-50 text-brand-900' : 'hover:bg-muted'].join(
                                        ' '
                                    )}
                                >
                                    <span>Jour {i}</span>
                                    {i === current ? <span className="text-xs">•</span> : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => duplicateUnit(u.unitIndex)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-xs hover:bg-muted">
                        <Copy className="h-3.5 w-3.5" /> Dupl.
                    </button>
                    <button onClick={() => askDelete(u.unitIndex)} className="inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-xs hover:bg-muted">
                        <Trash2 className="h-3.5 w-3.5" /> Suppr.
                    </button>
                    <label className="inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-1 text-xs">
                        <input type="checkbox" className="mr-1" checked={pruneMode} onChange={(e) => setPruneMode(e.target.checked)} />
                        prune
                    </label>
                </div>

                <button
                    onClick={saveAll}
                    disabled={saving}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                    title="Ctrl/Cmd + S"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </aside>

            {/* ───────── Main editor ───────── */}
            <main className="space-y-4">
                {/* Header sticky */}
                <div className="sticky top-0 z-[5] -mx-2 mb-2 flex items-center gap-2 rounded-xl border border-border bg-white/90 px-2 py-2 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <button onClick={goPrev} disabled={current === minIndex} className="rounded-lg border px-2 py-1 disabled:opacity-50" title="Précédent">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={goNext} disabled={current === maxIndex} className="rounded-lg border px-2 py-1 disabled:opacity-50" title="Suivant">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="ml-2 text-sm text-muted-foreground">Jour {u.unitIndex}</div>
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => duplicateUnit(u.unitIndex)} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted">
                            <Copy className="h-4 w-4" /> Dupliquer
                        </button>
                        <button onClick={() => askDelete(u.unitIndex)} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted">
                            <Trash2 className="h-4 w-4" /> Supprimer
                        </button>
                        <button
                            onClick={saveAll}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </div>

                {/* Meta */}
                <Section
                    title="Métadonnées du jour"
                    right={
                        <div className="flex items-center gap-2">
                            <Badge tone={u.status === 'published' ? 'blue' : 'default'}>{u.status === 'published' ? <>publié</> : <>brouillon</>}</Badge>
                            {u.status === 'published' ? (
                                <Badge tone="default">
                                    <Unlock className="mr-1 inline h-3 w-3" />
                                    visible
                                </Badge>
                            ) : (
                                <Badge tone="default">
                                    <Lock className="mr-1 inline h-3 w-3" />
                                    caché
                                </Badge>
                            )}
                        </div>
                    }
                >
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="flex items-center gap-2">
                            <label className="w-20 text-xs text-muted-foreground">Index</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-xl border border-border p-2"
                                value={u.unitIndex}
                                onChange={(e) => update(u.unitIndex, 'unitIndex', Math.max(1, Number(e.target.value) || 1) as UnitLean['unitIndex'])}
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                            <label className="w-20 text-xs text-muted-foreground">Titre</label>
                            <input
                                className="w-full rounded-xl border border-border p-2"
                                value={u.title}
                                onChange={(e) => update(u.unitIndex, 'title', e.target.value)}
                                placeholder="Titre du jour"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-xs text-muted-foreground">Statut</label>
                            <select
                                className="w-full rounded-xl border border-border p-2"
                                value={u.status}
                                onChange={(e) => update(u.unitIndex, 'status', e.target.value as UnitLean['status'])}
                            >
                                <option value="draft">draft</option>
                                <option value="published">published</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-xs text-muted-foreground">Durée (min)</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-xl border border-border p-2"
                                value={u.durationMin}
                                onChange={(e) => update(u.unitIndex, 'durationMin', Math.max(1, Number(e.target.value) || 1))}
                            />
                        </div>
                        <div className="md:col-span-3 flex items-center gap-2">
                            <label className="w-20 text-xs text-muted-foreground">Mantra</label>
                            <input
                                className="w-full rounded-xl border border-border p-2"
                                value={u.mantra ?? ''}
                                onChange={(e) => update(u.unitIndex, 'mantra', e.target.value)}
                                placeholder="Mantra"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                            <label className="w-24 text-xs text-muted-foreground">Vidéo</label>
                            <input
                                className="w-full rounded-xl border border-border p-2"
                                value={u.videoAssetId ?? ''}
                                onChange={(e) => update(u.unitIndex, 'videoAssetId', e.target.value)}
                                placeholder="ID ou URL"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                            <label className="w-24 text-xs text-muted-foreground">Audio</label>
                            <input
                                className="w-full rounded-xl border border-border p-2"
                                value={u.audioAssetId ?? ''}
                                onChange={(e) => update(u.unitIndex, 'audioAssetId', e.target.value)}
                                placeholder="ID ou URL"
                            />
                        </div>
                    </div>
                </Section>

                {/* Journal */}
                <Section
                    title="Journal — curseurs / questions / checks"
                    right={
                        <div className="flex items-center gap-2">
                            <Badge tone="default">
                                <TimerReset className="mr-1 inline h-3 w-3" />
                                {u.journalSchema.sliders.length} sliders
                            </Badge>
                            <Badge tone="default">
                                <StickyNote className="mr-1 inline h-3 w-3" />
                                {u.journalSchema.questions.length} questions
                            </Badge>
                            <Badge tone="default">
                                <CheckSquare className="mr-1 inline h-3 w-3" />
                                {u.journalSchema.checks.length} cases
                            </Badge>
                        </div>
                    }
                >
                    {/* sliders */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Curseurs 0–10</span>
                            <button
                                type="button"
                                onClick={() => addSlider(u.unitIndex)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                            >
                                <Plus className="h-4 w-4" /> Curseur
                            </button>
                            <div className="ml-auto flex gap-2 text-xs">
                                <Badge tone={hasBaseline ? 'brand' : 'default'}>Baseline {hasBaseline ? '✓' : '—'}</Badge>
                                <Badge tone={hasCheckout ? 'blue' : 'default'}>Check-out {hasCheckout ? '✓' : '—'}</Badge>
                            </div>
                        </div>
                        {u.journalSchema.sliders.map((s, i) => (
                            <div key={`sl-${u.unitIndex}-${i}`} className="grid gap-2 md:grid-cols-4">
                                <input
                                    className="rounded-xl border border-border p-2"
                                    value={s.key}
                                    onChange={(e) => updateSlider(u.unitIndex, i, 'key', e.target.value)}
                                    placeholder="key (unique)"
                                />
                                <input
                                    className="rounded-xl border border-border p-2 md:col-span-2"
                                    value={s.label}
                                    onChange={(e) => updateSlider(u.unitIndex, i, 'label', e.target.value)}
                                    placeholder="Label"
                                />
                                <button type="button" onClick={() => removeSlider(u.unitIndex, i)} className="rounded-xl border border-border px-3 py-2 hover:bg-muted">
                                    Suppr
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* scans */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                                <ScanLine className="mr-1 inline h-4 w-4" /> Scans somatiques
                            </span>
                            <button
                                type="button"
                                onClick={() => addScan(u.unitIndex)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                            >
                                <Plus className="h-4 w-4" /> Scan
                            </button>
                            {scanIndices.length > 0 && <span className="ml-1 text-xs text-muted-foreground">({scanIndices.length})</span>}
                        </div>
                        {scanIndices.length > 0 && (
                            <div className="space-y-2">
                                {scanIndices.map((n) => {
                                    const sKey = `scan${n}_sensation`,
                                        zKey = `scan${n}_zone`,
                                        iKey = `scan${n}_intensite`;
                                    const sIdx = u.journalSchema.questions.findIndex((q) => q.key === sKey);
                                    const zIdx = u.journalSchema.questions.findIndex((q) => q.key === zKey);
                                    const iIdx = u.journalSchema.questions.findIndex((q) => q.key === iKey);
                                    const sQ = u.journalSchema.questions[sIdx] ?? { key: sKey, label: `Sensation ${n} (quoi)`, placeholder: '...' };
                                    const zQ = u.journalSchema.questions[zIdx] ?? { key: zKey, label: `Zone ${n} (où)`, placeholder: '...' };
                                    const iQ = u.journalSchema.questions[iIdx] ?? { key: iKey, label: `Intensité ${n} (/10)`, placeholder: '0–10' };
                                    return (
                                        <div key={`scan-${u.unitIndex}-${n}`} className="grid items-start gap-2 md:grid-cols-10">
                                            <input
                                                className="rounded-xl border border-border p-2 md:col-span-3"
                                                value={sQ.label}
                                                onChange={(e) => updateQuestion(u.unitIndex, sIdx, 'label', e.target.value)}
                                                placeholder="Sensation (quoi)"
                                            />
                                            <input
                                                className="rounded-xl border border-border p-2 md:col-span-3"
                                                value={zQ.label}
                                                onChange={(e) => updateQuestion(u.unitIndex, zIdx, 'label', e.target.value)}
                                                placeholder="Zone (où)"
                                            />
                                            <input
                                                className="rounded-xl border border-border p-2 md:col-span-3"
                                                value={iQ.label}
                                                onChange={(e) => updateQuestion(u.unitIndex, iIdx, 'label', e.target.value)}
                                                placeholder="Intensité (/10)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeScan(u.unitIndex, n)}
                                                className="rounded-xl border border-border px-3 py-2 md:col-span-1 hover:bg-muted"
                                            >
                                                Suppr
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* autres questions */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Questions</span>
                            <button
                                type="button"
                                onClick={() => addQuestion(u.unitIndex)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                            >
                                <Plus className="h-4 w-4" /> Question
                            </button>
                        </div>
                        {u.journalSchema.questions
                            .filter((q) => !q.key.match(SCAN_RGX))
                            .map((q, i) => (
                                <div key={`q-${u.unitIndex}-${q.key}-${i}`} className="grid gap-2 md:grid-cols-4">
                                    <input
                                        className="rounded-xl border border-border p-2"
                                        value={q.key}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'key', e.target.value)}
                                        placeholder="key"
                                    />
                                    <input
                                        className="rounded-xl border border-border p-2"
                                        value={q.label}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'label', e.target.value)}
                                        placeholder="Label"
                                    />
                                    <input
                                        className="rounded-xl border border-border p-2"
                                        value={q.placeholder ?? ''}
                                        onChange={(e) => updateQuestion(u.unitIndex, i, 'placeholder', e.target.value)}
                                        placeholder="Placeholder"
                                    />
                                    <button type="button" onClick={() => removeQuestion(u.unitIndex, i)} className="rounded-xl border border-border px-3 py-2 hover:bg-muted">
                                        Suppr
                                    </button>
                                </div>
                            ))}
                    </div>

                    {/* checks */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Cases à cocher</span>
                            <button
                                type="button"
                                onClick={() => addCheck(u.unitIndex)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                            >
                                <Plus className="h-4 w-4" /> Case
                            </button>
                        </div>
                        {u.journalSchema.checks.map((c, i) => (
                            <div key={`c-${u.unitIndex}-${i}-${c.key}`} className="grid gap-2 md:grid-cols-3">
                                <input
                                    className="rounded-xl border border-border p-2"
                                    value={c.key}
                                    onChange={(e) => updateCheck(u.unitIndex, i, 'key', e.target.value)}
                                    placeholder="key"
                                />
                                <input
                                    className="rounded-xl border border-border p-2"
                                    value={c.label}
                                    onChange={(e) => updateCheck(u.unitIndex, i, 'label', e.target.value)}
                                    placeholder="Label"
                                />
                                <button type="button" onClick={() => removeCheck(u.unitIndex, i)} className="rounded-xl border border-border px-3 py-2 hover:bg-muted">
                                    Suppr
                                </button>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Texte */}
                <Section title="Texte d’accompagnement (Markdown)">
                    <div className="space-y-3">
                        {u.contentParagraphs.map((p, i) => (
                            <ParagraphEditor
                                key={`p-${u.unitIndex}-${i}`}
                                idx={i}
                                value={p}
                                onChange={(val) => updateParagraph(u.unitIndex, i, val)}
                                onRemove={() => removeParagraph(u.unitIndex, i)}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => addParagraph(u.unitIndex)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        >
                            <Plus className="h-4 w-4" /> Ajouter un paragraphe
                        </button>
                    </div>
                </Section>

                {/* Sécurité */}
                <Section title="Encadré sécurité">
                    <textarea
                        className="w-full rounded-xl border border-border p-2"
                        rows={3}
                        value={u.safetyNote ?? ''}
                        onChange={(e) => update(u.unitIndex, 'safetyNote', e.target.value)}
                        placeholder="Rappels sécurité (court)"
                    />
                </Section>
            </main>

            {/* Modales */}
            <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Unités enregistrées ✅" footer={null}>
                <p className="text-sm text-muted-foreground">
                    {successInfo?.count ?? 0} unité(s) sauvegardée(s) pour <span className="font-medium">{slug}</span>.
                </p>
                <div className="mt-2 text-xs text-muted-foreground">{new Date().toLocaleString('fr-FR')}</div>
            </Modal>

            <Modal open={!!errorMsg} onClose={() => setErrorMsg(null)} title="Enregistrement impossible" footer={null}>
                <p className="text-sm text-red-700">{errorMsg}</p>
            </Modal>

            <ConfirmModal
                open={!!confirm?.open}
                title={confirm?.title ?? ''}
                message={confirm?.message ?? ''}
                cancelLabel="Annuler"
                confirmLabel="Confirmer"
                onCancel={() => setConfirm(null)}
                onConfirm={() => confirm?.onConfirm()}
            />
        </div>
    );
}
