'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, AlertTriangle, FileText, Layers, Database } from 'lucide-react';

type Props = {
    slug: string;
    className?: string;
    afterDelete?: 'refresh' | 'redirect';
    /** utilisé seulement si afterDelete === 'redirect' */
    redirectTo?: string; // défaut: /admin/programs?deleted=1&slug=...
};

type PreviewCounts = { programPage: number; units: number; states: number };

export default function DeleteProgramButton({ slug, className, afterDelete = 'redirect', redirectTo }: Props) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewCounts | null>(null);
    const [confirm, setConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const titleId = useId();
    const descId = useId();

    useEffect(() => setMounted(true), []);

    // lock scroll while modal is open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    async function loadPreview() {
        setError(null);
        setPreview(null);
        try {
            // ✅ cohérent avec /api/admin/programs/[slug]
            const r = await fetch(`/api/admin/programs/${encodeURIComponent(slug)}?dryRun=1`, {
                method: 'DELETE',
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
            setPreview(data.deleted ?? { programPage: 0, units: 0, states: 0 });
        } catch (e) {
            setPreview(null);
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function confirmDelete() {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`/api/admin/programs/${encodeURIComponent(slug)}`, { method: 'DELETE' });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

            setOpen(false);

            if (afterDelete === 'redirect') {
                const to = redirectTo || `/admin/programs?deleted=1&slug=${encodeURIComponent(slug)}`;
                router.push(to);
            } else {
                router.refresh();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    function onOpen() {
        setConfirm(false);
        setError(null);
        setOpen(true);
        void loadPreview();
    }

    // Close on ESC
    useEffect(() => {
        if (!open) return;
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape' && !busy) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, busy]);

    const triggerClasses = [
        'group mx-auto inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium cursor-pointer',
        'border-red-200 bg-red-50/70 text-red-700 hover:bg-red-50 hover:border-red-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <button type="button" onClick={onOpen} className={triggerClasses}>
                <Trash2 className="h-4 w-4 transition-transform group-hover:-rotate-6" />
                Supprimer
            </button>

            {mounted &&
                open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={descId}
                    >
                        <div className="absolute inset-0 bg-black/55" onClick={() => !busy && setOpen(false)} aria-hidden />
                        <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-red-100">
                            {/* Header */}
                            <div className="flex items-start gap-3 border-b px-5 py-4">
                                <div className="rounded-full bg-red-50 p-2 text-red-600 ring-1 ring-red-100">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 id={titleId} className="truncate text-lg font-semibold">
                                        Supprimer « {slug} »
                                    </h3>
                                    <p id={descId} className="mt-0.5 text-sm text-muted-foreground">
                                        Action définitive : landing, unités et états associés seront supprimés.
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-3 px-5 py-4">
                                <div className="rounded-lg border bg-red-50/40 p-3">
                                    <div className="mb-2 text-sm font-medium text-red-800">Aperçu (dry run)</div>
                                    {preview ? (
                                        <ul className="grid grid-cols-3 gap-2 text-sm">
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <FileText className="h-4 w-4 text-red-600" /> Landing: <span className="font-semibold">{preview.programPage}</span>
                                            </li>
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <Layers className="h-4 w-4 text-red-600" /> Unités: <span className="font-semibold">{preview.units}</span>
                                            </li>
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <Database className="h-4 w-4 text-red-600" /> États: <span className="font-semibold">{preview.states}</span>
                                            </li>
                                        </ul>
                                    ) : error ? (
                                        <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{error}</div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-red-700">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                                        </div>
                                    )}
                                </div>

                                <label className="mt-1 flex items-start gap-2 text-sm">
                                    <input type="checkbox" className="mt-0.5" checked={confirm} disabled={busy} onChange={(e) => setConfirm(e.target.checked)} />
                                    <span>Je comprends que cette opération est irréversible.</span>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                                <button
                                    onClick={() => !busy && setOpen(false)}
                                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                                    disabled={busy}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={!confirm || busy}
                                    className={[
                                        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white',
                                        'bg-red-600 hover:bg-red-700 disabled:opacity-60',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
                                    ].join(' ')}
                                >
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    {busy ? 'Suppression…' : 'Supprimer définitivement'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
