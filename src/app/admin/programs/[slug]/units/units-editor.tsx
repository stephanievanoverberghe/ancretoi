// app/admin/programs/[slug]/units/units-editor.tsx

'use client';

import { useEffect, useMemo, useRef, useState, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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

/* ---------------- UI helpers ---------------- */
function SectionTitle({ children }: { children: ReactNode }) {
    return <h3 className="font-semibold">{children}</h3>;
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children?: ReactNode; footer?: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const titleId = useId();

    useEffect(() => setMounted(true), []);

    // Scroll lock pendant l'ouverture
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);

    // ESC pour fermer
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
            {/* Dialog (carte centrée) */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {title && (
                    <div className="border-b px-5 py-4">
                        <h3 id={titleId} className="text-lg font-semibold">
                            {title}
                        </h3>
                    </div>
                )}
                <div className="px-5 py-4">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                    {footer}
                    <button onClick={onClose} className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:opacity-90">
                        Fermer
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/** Modale de confirmation générique (utilise bien cancelLabel → pas d’avertissement ESLint) */
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
                    <button onClick={onCancel} className="rounded border px-3 py-2">
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm} className="rounded bg-red-600 text-white px-3 py-2">
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="text-sm text-gray-700">{message}</div>
        </Modal>
    );
}

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
function hasApiError(x: unknown): x is ApiError {
    return typeof x === 'object' && x !== null && 'error' in x;
}
function uniqByKey<T extends { key: string }>(arr: T[]): T[] {
    const map = new Map<string, T>();
    for (const it of arr) if (!map.has(it.key)) map.set(it.key, it);
    return Array.from(map.values());
}
function uniqMerge<T extends { key: string }>(base: T[], add: T[]) {
    return uniqByKey([...base, ...add]);
}

/* =======================================================
   Paragraph editor (Markdown + toolbar)
======================================================= */
function mdRenderBasic(md: string) {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c as '&' | '<' | '>' | '"']!));
    let html = esc(md);
    html = html.replace(/^---$/gm, '<hr/>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    // Ordered list
    html = html.replace(/(^|\n)(\d+\.\s.*(?:\n\d+\.\s.*)*)/g, (_m: string, p1: string, block: string) => {
        const items = block
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
            .map((l: string) => l.replace(/^\d+\.\s*/, ''))
            .map((li: string) => `<li>${li}</li>`)
            .join('');
        return `${p1}<ol class="ml-5 list-decimal">${items}</ol>`;
    });
    // Unordered list
    html = html.replace(/(^|\n)(-\s.*(?:\n-\s.*)*)/g, (_m: string, p1: string, block: string) => {
        const items = block
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean)
            .map((l: string) => l.replace(/^-+\s*/, '').replace(/^- /, ''))
            .map((li: string) => `<li>${li}</li>`)
            .join('');
        return `${p1}<ul class="ml-5 list-disc">${items}</ul>`;
    });
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code class="px-1 rounded bg-gray-100">$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-purple-600 underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = `<p>${html}</p>`;
    return html;
}

function ParagraphEditor({ value, onChange, onRemove, idx }: { value: string; onChange: (v: string) => void; onRemove: () => void; idx: number }) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const [preview, setPreview] = useState(false);

    function surround(prefix: string, suffix = prefix) {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const selected = value.slice(start, end);
        const after = value.slice(end);
        const newVal = `${before}${prefix}${selected || 'texte'}${suffix}${after}`;
        onChange(newVal);
        setTimeout(() => {
            ta.focus();
            ta.selectionStart = start + prefix.length;
            ta.selectionEnd = start + prefix.length + (selected || 'texte').length;
        }, 0);
    }
    function listify(ordered: boolean) {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const sel = value.slice(start, end) || 'élément';
        const after = value.slice(end);
        const lines = sel
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);
        const block = ordered
            ? lines.map((l: string, i: number) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '')}`).join('\n')
            : lines.map((l: string) => `- ${l.replace(/^-+\s*/, '')}`).join('\n');
        onChange(`${before}${block}${after}`);
        setTimeout(() => taRef.current?.focus(), 0);
    }
    function atLineStart(token: string) {
        const ta = taRef.current!;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const before = value.slice(0, start);
        const sel = value.slice(start, end) || 'titre';
        const after = value.slice(end);
        const block = sel
            .split('\n')
            .map((l: string) => `${token}${l.replace(/^#{1,3}\s*/, '').replace(/^>\s*/, '')}`)
            .join('\n');
        onChange(`${before}${block}${after}`);
        setTimeout(() => taRef.current?.focus(), 0);
    }

    return (
        <div className="rounded-xl border p-2">
            <div className="flex flex-wrap items-center gap-1 text-sm">
                <button type="button" className="px-2 py-1 rounded border font-semibold" onClick={() => surround('**')}>
                    B
                </button>
                <button type="button" className="px-2 py-1 rounded border italic" onClick={() => surround('*')}>
                    I
                </button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => surround('`')}>
                    Code
                </button>
                <span className="mx-1 text-gray-300">|</span>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => atLineStart('## ')}>
                    H2
                </button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => atLineStart('### ')}>
                    H3
                </button>
                <span className="mx-1 text-gray-300">|</span>
                <button type="button" className="px-2 py-1 rounded border" title="Liste à puces" onClick={() => listify(false)}>
                    •
                </button>
                <button type="button" className="px-2 py-1 rounded border" title="Liste numérotée" onClick={() => listify(true)}>
                    1.
                </button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => atLineStart('> ')}>
                    &gt;
                </button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => surround('[', '](https://)')}>
                    Lien
                </button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => onChange(value + (value.endsWith('\n') ? '' : '\n') + '---\n')}>
                    —
                </button>
                <span className="mx-1 text-gray-300">|</span>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => setPreview((p) => !p)}>
                    {preview ? 'Éditer' : 'Aperçu'}
                </button>
                <span className="ml-auto text-xs text-gray-500">Paragraphe {idx + 1}</span>
            </div>

            {preview ? (
                <div className="prose max-w-none mt-2 border rounded p-3" dangerouslySetInnerHTML={{ __html: mdRenderBasic(value || '') }} />
            ) : (
                <textarea
                    ref={taRef}
                    className="border rounded p-2 w-full mt-2"
                    rows={4}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Texte (Markdown autorisé)"
                />
            )}

            <div className="mt-2 flex items-center justify-end">
                <button type="button" onClick={onRemove} className="rounded border px-3 py-2">
                    Suppr
                </button>
            </div>
        </div>
    );
}

/* =======================================================
   Blocs génériques (bibliothèque)
======================================================= */
type BlockDef = {
    id: string;
    name: string;
    desc?: string;
    sliders?: JournalSlider[];
    questions?: JournalQuestion[];
    checks?: JournalCheck[];
};

const LIB_BLOCKS: BlockDef[] = [
    { id: 'baseline', name: 'Baseline 0–10', sliders: BASELINE, desc: 'État initial /10 (générique).' },
    { id: 'checkout', name: 'Check-out 0–10', sliders: CHECKOUT, desc: 'État après pratique /10.' },
    {
        id: 'scan',
        name: 'Scan somatique (×1)',
        questions: [
            { key: 'scan1_sensation', label: 'Sensation 1 (quoi)', placeholder: 'chaud / lourd / picote…' },
            { key: 'scan1_zone', label: 'Zone 1 (où)', placeholder: 'poitrine / mâchoire / ventre…' },
            { key: 'scan1_intensite', label: 'Intensité 1 (/10)', placeholder: '0–10' },
        ],
    },
    {
        id: 'emotion',
        name: 'Émotion (3 champs)',
        questions: [
            { key: 'emotion_dominante', label: 'Émotion dominante', placeholder: 'joie / sérénité / peur / colère / tristesse / fatigue / autre' },
            { key: 'emotion_zone', label: 'Où dans le corps ?', placeholder: 'poitrine / gorge / ventre…' },
            { key: 'emotion_intensite', label: 'Intensité émotion (/10)', placeholder: '0–10' },
        ],
    },
    {
        id: 'micro',
        name: 'Micro-action (≤5 min)',
        questions: [
            { key: 'microPasAction', label: 'Micro-action précise', placeholder: 'ex. boire un verre d’eau' },
            { key: 'microPasQuandOu', label: 'Quand / Où ?', placeholder: 'après le café / à la fenêtre' },
            { key: 'microPasSiAlors', label: 'Déclencheur si/alors', placeholder: 'Si j’oublie → je lance un minuteur 5 min' },
        ],
    },
    {
        id: 'needs',
        name: 'Besoins (cases)',
        checks: [
            { key: 'besoin_eau', label: 'Eau' },
            { key: 'besoin_manger', label: 'Manger' },
            { key: 'besoin_bouger', label: 'Bouger' },
            { key: 'besoin_etirement', label: 'Étirement' },
            { key: 'besoin_airfrais', label: 'Air frais' },
            { key: 'besoin_silence', label: 'Silence' },
            { key: 'besoin_contact', label: 'Contact' },
            { key: 'besoin_solitude', label: 'Solitude' },
        ],
    },
    { id: 'needs_other', name: 'Autre besoin (texte)', questions: [{ key: 'besoin_autre', label: 'Autre besoin (texte)', placeholder: 'préciser…' }] },
    {
        id: 'std_checks',
        name: 'Checks standards',
        checks: [
            { key: 'pratiqueFaite', label: 'Pratique faite (respiration + écriture)' },
            { key: 'mantra3x', label: 'Mantra répété 3×' },
        ],
    },
    // Frameworks génériques
    {
        id: 'rain',
        name: 'RAIN',
        questions: [
            { key: 'contexte_rapide', label: 'Contexte (quoi/quand)', placeholder: '' },
            { key: 'rain_reconnaitre', label: 'R — Reconnaître', placeholder: '“Je reconnais qu’il y a…”' },
            { key: 'rain_accepter', label: 'A — Accepter', placeholder: '“C’est ok que ce soit là maintenant parce que…”' },
            { key: 'rain_investiguer', label: 'I — Investiguer (de quoi ça parle ?)', placeholder: '' },
            { key: 'rain_besoin', label: 'Besoin principal', placeholder: '' },
            { key: 'rain_nourrir_phrase', label: 'N — Nourrir (phrase de soin)', placeholder: 'ex. “Je suis là pour toi.”' },
            { key: 'rain_nourrir_geste', label: 'N — Nourrir (geste ≤ 2 min)', placeholder: 'main sur le cœur, eau, étirement…' },
            { key: 'rain_quand_ou', label: 'Quand / Où (pour le geste)', placeholder: '' },
            { key: 'rain_sialors', label: 'Si/Alors (rappel)', placeholder: '' },
        ],
    },
    {
        id: 'smart',
        name: 'SMART',
        questions: [
            { key: 'smart_objectif', label: 'Objectif (verbe + résultat)', placeholder: '' },
            { key: 'smart_pourquoi', label: 'Pourquoi c’est important (2 lignes)', placeholder: '' },
            { key: 'smart_mesure', label: 'Mesure de réussite', placeholder: '' },
            { key: 'smart_echeance', label: 'Échéance (date)', placeholder: 'JJ/MM/AAAA' },
            { key: 'smart_confiance', label: 'Score de confiance (0–10)', placeholder: '0–10' },
            { key: 'mp1_action', label: 'Micro-pas #1 — action', placeholder: '' },
            { key: 'mp1_quand_ou', label: 'Micro-pas #1 — Quand/Où', placeholder: '' },
            { key: 'mp1_sialors', label: 'Micro-pas #1 — Si/Alors', placeholder: '' },
            { key: 'mp2_action', label: 'Micro-pas #2 — action', placeholder: '' },
            { key: 'mp2_quand_ou', label: 'Micro-pas #2 — Quand/Où', placeholder: '' },
            { key: 'mp2_sialors', label: 'Micro-pas #2 — Si/Alors', placeholder: '' },
        ],
    },
    {
        id: 'cnv_orbd',
        name: 'CNV — ORBD',
        questions: [
            { key: 'cnv_obs', label: 'Observation', placeholder: '“Quand …” (fait concret)' },
            { key: 'cnv_ressenti', label: 'Ressenti (1 mot)', placeholder: '“je me sens …”' },
            { key: 'cnv_besoin', label: 'Besoin (valeur)', placeholder: 'clarté / repos / temps concentré…' },
            { key: 'cnv_demande', label: 'Demande (précise, datée)', placeholder: '“Est-ce que tu peux … d’ici … ?”' },
        ],
    },
    {
        id: 'cia_croyance',
        name: 'Croyance — C-I-A',
        questions: [
            { key: 'croyance_phrase', label: 'Croyance (phrase exacte)', placeholder: '' },
            { key: 'preuves_pour_1', label: 'Preuve pour #1', placeholder: '' },
            { key: 'preuves_contre_1', label: 'Preuve contre #1', placeholder: '' },
            { key: 'impact_moi', label: 'Impact sur moi', placeholder: '' },
            { key: 'alt_pont', label: 'Alternative — Pont', placeholder: '' },
            { key: 'micro_preuve_action', label: 'Micro-preuve (action ≤ 5 min)', placeholder: '' },
        ],
    },
    {
        id: 'bilan_finale',
        name: 'Bilan / Finale',
        questions: [
            { key: 'bilan_garde', label: 'Je garde (ce qui m’aide)', placeholder: '' },
            { key: 'bilan_allege', label: 'J’allège (ce qui pèse)', placeholder: '' },
            { key: 'bilan_apprends', label: 'J’apprends (insight clé)', placeholder: '' },
            { key: 'rituel_geste', label: 'Rituel d’entretien (≤ 2 min)', placeholder: 'respirations / eau / étirement…' },
            { key: 'rituel_quand_ou', label: 'Quand/Où', placeholder: '' },
            { key: 'rituel_sialors', label: 'Si/Alors', placeholder: '' },
            { key: 'lettre_a_moi', label: 'Lettre à moi (150–250 mots)', placeholder: 'Commence par “Cher/Chère [ton prénom]…”' },
            { key: 'signature_date', label: 'Date', placeholder: 'JJ/MM/AAAA' },
            { key: 'signature_nom', label: 'Signature', placeholder: '' },
        ],
    },
];

/* ---------- Blocs personnalisés (localStorage) ---------- */
type CustomBlock = BlockDef & { createdAt: number };
const CUSTOM_KEY = 'units_editor_custom_blocks_v1';
function loadCustomBlocks(): CustomBlock[] {
    try {
        const raw = localStorage.getItem(CUSTOM_KEY);
        return raw ? (JSON.parse(raw) as CustomBlock[]) : [];
    } catch {
        return [];
    }
}
function saveCustomBlocks(arr: CustomBlock[]) {
    try {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
    } catch {}
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
    const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
    useEffect(() => {
        setCustomBlocks(loadCustomBlocks());
    }, []);

    // nav 1-carte
    const indices = useMemo(() => units.map((u) => u.unitIndex).sort((a, b) => a - b), [units]);
    const minIndex = indices[0] ?? 1;
    const maxIndex = indices[indices.length - 1] ?? 1;
    const [current, setCurrent] = useState<number>(minIndex);
    const currentUnit = useMemo(() => units.find((u) => u.unitIndex === current) ?? units[0], [units, current]);

    const [saving, setSaving] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [successInfo, setSuccessInfo] = useState<{ count: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: ReactNode; onConfirm: () => void } | null>(null);
    const [pruneMode, setPruneMode] = useState(false);

    // “Save as block” modal
    const [saveBlockOpen, setSaveBlockOpen] = useState(false);
    const [saveBlockName, setSaveBlockName] = useState('');

    const nextIndex = useMemo(() => (units.length ? Math.max(...units.map((u) => u.unitIndex)) + 1 : 1), [units]);

    /* ---------- nav helpers ---------- */
    function goPrev() {
        const pos = indices.indexOf(current);
        if (pos > 0) setCurrent(indices[pos - 1]);
    }
    function goNext() {
        const pos = indices.indexOf(current);
        if (pos !== -1 && pos < indices.length - 1) setCurrent(indices[pos + 1]);
    }
    function jumpTo(idx: number) {
        setCurrent(idx);
    }

    /* ---------- unit ops ---------- */
    function addUnit(after?: number) {
        const newIdx = after ? after + 1 : nextIndex;
        const newUnit: UnitLean = {
            unitIndex: newIdx,
            title: `Unité ${newIdx}`,
            durationMin: 25,
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
            title: src.title.replace(/^Unité\s+\d+|Jour\s+\d+/i, `Unité ${newIdx}`) || `Unité ${newIdx}`,
            status: 'draft',
        };
        setUnits((u) => [...u, clone].sort((a, b) => a.unitIndex - b.unitIndex));
        setCurrent(newIdx);
    }

    function askDelete(idx: number) {
        setConfirm({
            open: true,
            title: `Supprimer l’unité ${idx} ?`,
            message: 'Cette action supprimera définitivement cette unité en base de données.',
            onConfirm: () => doDelete(idx),
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
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const arr = [...x.contentParagraphs];
                arr[i] = value;
                return { ...x, contentParagraphs: arr };
            })
        );
    }
    function removeParagraph(idx: number, i: number) {
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, contentParagraphs: x.contentParagraphs.filter((_, k) => k !== i) })));
    }

    /* ---------- sliders /10 ---------- */
    function addSlider(idx: number) {
        setUnits((u) => u.map((x) => (x.unitIndex === idx ? { ...x, journalSchema: { ...x.journalSchema, sliders: [...x.journalSchema.sliders, S10('', 'Score (/10)')] } } : x)));
    }
    function updateSlider(idx: number, sIndex: number, field: keyof JournalSlider, value: string | number) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const sliders = x.journalSchema.sliders.map((s, i) => (i === sIndex ? { ...s, [field]: value } : s));
                return { ...x, journalSchema: { ...x.journalSchema, sliders } };
            })
        );
    }
    function removeSlider(idx: number, sIndex: number) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const sliders = x.journalSchema.sliders.filter((_, i) => i !== sIndex);
                return { ...x, journalSchema: { ...x.journalSchema, sliders } };
            })
        );
    }

    /* ---------- questions / checks ---------- */
    function addQuestion(idx: number) {
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
            u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, questions: x.journalSchema.questions.filter((_, i) => i !== qIndex) } }))
        );
    }
    function addCheck(idx: number) {
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, checks: [...x.journalSchema.checks, { key: '', label: '' }] } })));
    }
    function updateCheck(idx: number, cIndex: number, field: keyof JournalCheck, value: string) {
        setUnits((u) =>
            u.map((x) => {
                if (x.unitIndex !== idx) return x;
                const checks = x.journalSchema.checks.map((c, i) => (i === cIndex ? { ...c, [field]: value } : c));
                return { ...x, journalSchema: { ...x.journalSchema, checks } };
            })
        );
    }
    function removeCheck(idx: number, cIndex: number) {
        setUnits((u) => u.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, checks: x.journalSchema.checks.filter((_, i) => i !== cIndex) } })));
    }

    /* ---------- SCAN helpers ---------- */
    function getScanIndices(u: UnitLean): number[] {
        const set = new Set<number>();
        for (const q of u.journalSchema.questions) {
            const m = q.key.match(SCAN_RGX);
            if (m) set.add(Number(m[1]));
        }
        return Array.from(set).sort((a, b) => a - b);
    }
    function nextScanIndex(u: UnitLean): number {
        const ids = getScanIndices(u);
        return ids.length ? Math.max(...ids) + 1 : 1;
    }
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
            arr.map((x) => (x.unitIndex !== idx ? x : { ...x, journalSchema: { ...x.journalSchema, questions: x.journalSchema.questions.filter((q) => !kill.has(q.key)) } }))
        );
    }

    /* ---------- appliquer un bloc & blocs persos ---------- */
    function applyBlock(idx: number, block: BlockDef) {
        setUnits((state) =>
            state.map((x) => {
                if (x.unitIndex !== idx) return x;
                const sliders = block.sliders ? uniqMerge(x.journalSchema.sliders, block.sliders) : x.journalSchema.sliders;
                const questions = block.questions ? uniqMerge(x.journalSchema.questions, block.questions) : x.journalSchema.questions;
                const checks = block.checks ? uniqMerge(x.journalSchema.checks, block.checks) : x.journalSchema.checks;
                return { ...x, journalSchema: { sliders, questions, checks } };
            })
        );
    }

    function openSaveBlockModal() {
        setSaveBlockName('');
        setSaveBlockOpen(true);
    }
    function confirmSaveBlock() {
        const name = saveBlockName.trim();
        if (!name) return;
        const u = units.find((uu) => uu.unitIndex === current);
        if (!u) return;
        const block: CustomBlock = {
            id: `custom_${Date.now()}`,
            name,
            desc: '',
            sliders: u.journalSchema.sliders.map((s) => ({ ...s })),
            questions: u.journalSchema.questions.map((q) => ({ ...q })),
            checks: u.journalSchema.checks.map((c) => ({ ...c })),
            createdAt: Date.now(),
        };
        const next = [...customBlocks, block];
        setCustomBlocks(next);
        saveCustomBlocks(next);
        setSaveBlockOpen(false);
    }
    function removeCustomBlock(id: string) {
        const next = customBlocks.filter((b) => b.id !== id);
        setCustomBlocks(next);
        saveCustomBlocks(next);
    }

    /* ---------- save ---------- */
    async function actuallySaveAll() {
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
    }

    function saveAll() {
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
    }

    if (!currentUnit) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => addUnit()} className="rounded bg-gray-100 px-3 py-2">
                        + Créer une unité
                    </button>
                </div>
            </div>
        );
    }

    /* ---------- render ---------- */
    const u = currentUnit;

    const sliderKeys = new Set(u.journalSchema.sliders.map((s) => s.key));
    const hasBaseline = BASELINE.every((s) => sliderKeys.has(s.key));
    const hasCheckout = CHECKOUT.every((s) => sliderKeys.has(s.key));
    const scanIndices = getScanIndices(u);

    return (
        <div className="space-y-5">
            {/* Toolbar globale */}
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => addUnit(current)} className="rounded bg-gray-100 px-3 py-2">
                    + Ajouter une unité (après {current})
                </button>

                <button onClick={saveAll} disabled={saving} className="rounded bg-purple-600 text-white px-3 py-2 disabled:opacity-60">
                    {saving ? 'Enregistrement…' : 'Enregistrer tout'}
                </button>

                <button onClick={() => duplicateUnit(u.unitIndex)} className="rounded border px-3 py-2">
                    Dupliquer
                </button>
                <button onClick={() => askDelete(u.unitIndex)} className="rounded border px-3 py-2">
                    Supprimer
                </button>

                <label className="ml-auto inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={pruneMode} onChange={(e) => setPruneMode(e.target.checked)} />
                    <span>Prune (supprimer les unités absentes)</span>
                </label>
            </div>

            {/* Navigation compacte */}
            <div className="rounded-xl border bg-white p-3 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={goPrev} disabled={current === minIndex} className="rounded border px-3 py-2 disabled:opacity-50">
                            ←
                        </button>
                        <button onClick={goNext} disabled={current === maxIndex} className="rounded border px-3 py-2 disabled:opacity-50">
                            →
                        </button>
                    </div>
                    <div className="flex-1 px-3">
                        <input type="range" min={minIndex} max={maxIndex} value={current} onChange={(e) => jumpTo(Number(e.target.value))} className="w-full" />
                    </div>
                    <select className="border rounded p-2" value={current} onChange={(e) => jumpTo(Number(e.target.value))} title="Aller à l’unité">
                        {indices.map((i) => (
                            <option key={i} value={i}>
                                Unité {i}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {indices.map((i) => (
                        <button
                            key={i}
                            onClick={() => jumpTo(i)}
                            className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${i === current ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}
                        >
                            {i}
                        </button>
                    ))}
                </div>
            </div>

            {/* Carte d’édition */}
            <div className="rounded-2xl border bg-white p-4 space-y-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="number"
                        className="border rounded p-2 w-24"
                        value={u.unitIndex}
                        onChange={(e) => update(u.unitIndex, 'unitIndex', Math.max(1, Number(e.target.value) || 1) as UnitLean['unitIndex'])}
                        title="Index (>=1)"
                    />
                    <input
                        className="border rounded p-2 flex-1 min-w-[240px]"
                        value={u.title}
                        onChange={(e) => update(u.unitIndex, 'title', e.target.value)}
                        placeholder="Titre de l’unité"
                    />
                    <select className="border rounded p-2" value={u.status} onChange={(e) => update(u.unitIndex, 'status', e.target.value as UnitLean['status'])}>
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                    </select>
                </div>

                {/* Meta line */}
                <div className="grid md:grid-cols-4 gap-3">
                    <input
                        type="number"
                        min={1}
                        className="border rounded p-2"
                        value={u.durationMin}
                        onChange={(e) => update(u.unitIndex, 'durationMin', Math.max(1, Number(e.target.value) || 1))}
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

                {/* Bibliothèque de blocs */}
                <div className="space-y-2">
                    <SectionTitle>Bibliothèque de blocs</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                        {LIB_BLOCKS.map((b) => (
                            <button key={b.id} onClick={() => applyBlock(u.unitIndex, b)} className="rounded border px-2 py-1 text-sm hover:bg-gray-50" title={b.desc || ''}>
                                + {b.name}
                            </button>
                        ))}
                        <button onClick={() => addScan(u.unitIndex)} className="rounded border px-2 py-1 text-sm">
                            + Scan (auto #)
                        </button>
                    </div>

                    {/* Blocs personnalisés */}
                    <div className="mt-2 rounded-xl border p-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Blocs personnalisés</span>
                            <button onClick={openSaveBlockModal} className="rounded bg-gray-100 px-2 py-1 text-xs">
                                + Sauver l’unité → bloc
                            </button>
                        </div>
                        {customBlocks.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {customBlocks.map((cb) => (
                                    <div key={cb.id} className="flex items-center gap-1">
                                        <button onClick={() => applyBlock(u.unitIndex, cb)} className="rounded border px-2 py-1 text-xs">
                                            + {cb.name}
                                        </button>
                                        <button onClick={() => removeCustomBlock(cb.id)} className="rounded border px-1 text-xs" title="Supprimer">
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-gray-500">Aucun bloc personnalisé encore.</div>
                        )}
                    </div>
                </div>

                {/* Sliders /10 */}
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">Curseurs 0–10 (affichés “/10” côté utilisateur)</span>
                        <button type="button" onClick={() => addSlider(u.unitIndex)} className="rounded bg-gray-100 px-2 py-1 text-sm">
                            + Curseur
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full border ${hasBaseline ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50'}`}>
                            Baseline {hasBaseline ? 'active' : '—'}
                        </span>
                        <span className={`px-2 py-1 rounded-full border ${hasCheckout ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50'}`}>
                            Check-out {hasCheckout ? 'active' : '—'}
                        </span>
                    </div>
                    {u.journalSchema.sliders.map((s, i) => (
                        <div key={`${u.unitIndex}-s-${i}`} className="grid md:grid-cols-4 gap-2">
                            <input className="border rounded p-2" value={s.key} onChange={(e) => updateSlider(u.unitIndex, i, 'key', e.target.value)} placeholder="key (unique)" />
                            <input
                                className="border rounded p-2 md:col-span-2"
                                value={s.label}
                                onChange={(e) => updateSlider(u.unitIndex, i, 'label', e.target.value)}
                                placeholder="Label (ex. Énergie (/10))"
                            />
                            <button type="button" onClick={() => removeSlider(u.unitIndex, i)} className="rounded border px-3 py-2">
                                Suppr
                            </button>
                        </div>
                    ))}
                </div>

                {/* Questions (y compris scans) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Questions</span>
                        <button type="button" onClick={() => addQuestion(u.unitIndex)} className="rounded bg-gray-100 px-2 py-1 text-sm">
                            + Question
                        </button>
                    </div>

                    {scanIndices.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Scans ajoutés : {scanIndices.length}</div>
                            {scanIndices.map((n) => {
                                const sKey = `scan${n}_sensation`,
                                    zKey = `scan${n}_zone`,
                                    iKey = `scan${n}_intensite`;
                                const sQ = u.journalSchema.questions.find((q) => q.key === sKey) ?? { key: sKey, label: `Sensation ${n} (quoi)`, placeholder: '...' };
                                const zQ = u.journalSchema.questions.find((q) => q.key === zKey) ?? { key: zKey, label: `Zone ${n} (où)`, placeholder: '...' };
                                const iQ = u.journalSchema.questions.find((q) => q.key === iKey) ?? { key: iKey, label: `Intensité ${n} (/10)`, placeholder: '0–10' };
                                const idxS = u.journalSchema.questions.findIndex((q) => q.key === sKey);
                                const idxZ = u.journalSchema.questions.findIndex((q) => q.key === zKey);
                                const idxI = u.journalSchema.questions.findIndex((q) => q.key === iKey);
                                return (
                                    <div key={`scan-row-${n}`} className="grid md:grid-cols-10 gap-2 items-start">
                                        <input
                                            className="border rounded p-2 md:col-span-3"
                                            value={sQ.label}
                                            onChange={(e) => updateQuestion(u.unitIndex, idxS, 'label', e.target.value)}
                                            placeholder="Sensation (quoi)"
                                        />
                                        <input
                                            className="border rounded p-2 md:col-span-3"
                                            value={zQ.label}
                                            onChange={(e) => updateQuestion(u.unitIndex, idxZ, 'label', e.target.value)}
                                            placeholder="Zone (où)"
                                        />
                                        <input
                                            className="border rounded p-2 md:col-span-3"
                                            value={iQ.label}
                                            onChange={(e) => updateQuestion(u.unitIndex, idxI, 'label', e.target.value)}
                                            placeholder="Intensité (/10)"
                                        />
                                        <button type="button" onClick={() => removeScan(u.unitIndex, n)} className="rounded border px-3 py-2 md:col-span-1">
                                            Suppr
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {u.journalSchema.questions
                        .filter((q) => !q.key.match(SCAN_RGX))
                        .map((q, i) => (
                            <div key={`${u.unitIndex}-q-${q.key}-${i}`} className="grid md:grid-cols-4 gap-2">
                                <input className="border rounded p-2" value={q.key} onChange={(e) => updateQuestion(u.unitIndex, i, 'key', e.target.value)} placeholder="key" />
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
                                    Suppr
                                </button>
                            </div>
                        ))}
                </div>

                {/* Checks */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Cases à cocher</span>
                        <button type="button" onClick={() => addCheck(u.unitIndex)} className="rounded bg-gray-100 px-2 py-1 text-sm">
                            + Case
                        </button>
                    </div>
                    {u.journalSchema.checks.map((c, i) => (
                        <div key={`${u.unitIndex}-c-${i}`} className="grid md:grid-cols-3 gap-2">
                            <input className="border rounded p-2" value={c.key} onChange={(e) => updateCheck(u.unitIndex, i, 'key', e.target.value)} placeholder="key" />
                            <input className="border rounded p-2" value={c.label} onChange={(e) => updateCheck(u.unitIndex, i, 'label', e.target.value)} placeholder="Label" />
                            <button type="button" onClick={() => removeCheck(u.unitIndex, i)} className="rounded border px-3 py-2">
                                Suppr
                            </button>
                        </div>
                    ))}
                </div>

                {/* Texte d’accompagnement (Markdown + toolbar) */}
                <div className="space-y-2">
                    <SectionTitle>Texte d’accompagnement (Markdown + outils)</SectionTitle>
                    {u.contentParagraphs.map((p, i) => (
                        <ParagraphEditor
                            key={`${u.unitIndex}-p-${i}`}
                            idx={i}
                            value={p}
                            onChange={(val) => updateParagraph(u.unitIndex, i, val)}
                            onRemove={() => removeParagraph(u.unitIndex, i)}
                        />
                    ))}
                    <button type="button" onClick={() => addParagraph(u.unitIndex)} className="rounded bg-gray-100 px-3 py-1">
                        + Ajouter un paragraphe
                    </button>
                </div>

                {/* Sécurité */}
                <div className="space-y-1">
                    <SectionTitle>Encadré sécurité</SectionTitle>
                    <textarea
                        className="border rounded p-2 w-full"
                        rows={3}
                        value={u.safetyNote ?? ''}
                        onChange={(e) => update(u.unitIndex, 'safetyNote', e.target.value)}
                        placeholder="Rappels sécurité (court)"
                    />
                </div>
            </div>

            {/* Modales */}
            <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Unités enregistrées ✅" footer={null}>
                <p className="text-sm text-muted-foreground">
                    {successInfo?.count ?? 0} unité(s) sauvegardée(s) pour <span className="font-medium">{slug}</span>.
                </p>
                <div className="mt-2 text-xs text-gray-500">{new Date().toLocaleString('fr-FR')}</div>
            </Modal>

            <Modal open={!!errorMsg} onClose={() => setErrorMsg(null)} title="Enregistrement impossible">
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

            {/* Save-as-block */}
            <Modal
                open={saveBlockOpen}
                onClose={() => setSaveBlockOpen(false)}
                title="Sauver l’unité comme bloc"
                footer={
                    <>
                        <button onClick={() => setSaveBlockOpen(false)} className="rounded border px-3 py-2">
                            Annuler
                        </button>
                        <button onClick={confirmSaveBlock} className="rounded bg-purple-600 text-white px-3 py-2">
                            Sauver
                        </button>
                    </>
                }
            >
                <input autoFocus className="mt-2 w-full border rounded p-2" placeholder="Nom du bloc" value={saveBlockName} onChange={(e) => setSaveBlockName(e.target.value)} />
            </Modal>
        </div>
    );
}
