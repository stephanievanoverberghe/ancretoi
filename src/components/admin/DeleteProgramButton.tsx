'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    slug: string;
    className?: string;
    afterDelete?: 'refresh' | 'redirect';
    redirectTo?: string;
};

export default function DeleteProgramButton({ slug, className, afterDelete = 'refresh', redirectTo = '/admin/programs' }: Props) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ programPage: number; units: number; states: number } | null>(null);
    const router = useRouter();

    async function loadPreview() {
        setError(null);
        try {
            const r = await fetch(`/api/admin/programs?slug=${encodeURIComponent(slug)}&dryRun=true`, { method: 'DELETE' });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
            setPreview(data.deleted ?? null);
        } catch (e) {
            setPreview(null);
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function confirmDelete() {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`/api/admin/programs?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
            setOpen(false);
            if (afterDelete === 'redirect') router.push(redirectTo);
            else router.refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    void loadPreview();
                }}
                className={className ?? 'rounded border px-3 py-2 text-sm text-red-600 hover:bg-red-50'}
            >
                Supprimer le programme
            </button>

            {!open ? null : (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
                    <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold">Supprimer “{slug}”</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Cela va supprimer la landing, toutes les unités et les états liés à ces unités.</p>
                        <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm">
                            <div className="font-medium mb-1">Aperçu (dry run)</div>
                            {preview ? (
                                <ul className="list-disc ml-5">
                                    <li>Landing : {preview.programPage}</li>
                                    <li>Unités : {preview.units}</li>
                                    <li>États : {preview.states}</li>
                                </ul>
                            ) : (
                                <div>Chargement…</div>
                            )}
                        </div>
                        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-sm">
                                Annuler
                            </button>
                            <button onClick={confirmDelete} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-60">
                                {busy ? 'Suppression…' : 'Supprimer définitivement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
