'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, AlertTriangle, Video, Link2, BadgeInfo } from 'lucide-react';

type Props = {
    slug: string;
    className?: string;
    /** que faire après suppression ? */
    afterDelete?: 'refresh' | 'redirect';
    /** cible si redirect */
    redirectTo?: string;
};

type PreviewDoc = {
    _id: string;
    slug: string;
    title: string;
    status: 'draft' | 'published';
    videoUrl: string | null;
};

export default function DeleteInspirationButton({ slug, className, afterDelete = 'refresh', redirectTo = '/admin/inspirations' }: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [preview, setPreview] = useState<PreviewDoc | null>(null);
    const [confirm, setConfirm] = useState(false);

    const router = useRouter();
    const titleId = useId();
    const descId = useId();

    useEffect(() => setMounted(true), []);

    // lock scroll pendant la modale
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // ESC pour fermer
    useEffect(() => {
        if (!open) return;
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape' && !pending) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, pending]);

    function onOpen() {
        setConfirm(false);
        setError(null);
        setPreview(null);
        setOpen(true);

        // Dry run
        start(async () => {
            try {
                const r = await fetch(`/api/admin/inspirations?slug=${encodeURIComponent(slug)}&dryRun=true`, { method: 'DELETE' });
                const data = await r.json();
                if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);
                setPreview(data.doc ?? null);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        });
    }

    function onConfirm() {
        setError(null);
        start(async () => {
            try {
                const r = await fetch(`/api/admin/inspirations?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
                const data = await r.json();
                if (!r.ok || !data?.ok) throw new Error(data?.error || `HTTP ${r.status}`);

                setOpen(false);
                if (afterDelete === 'redirect') router.push(redirectTo!);
                else router.refresh();
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        });
    }

    const triggerClasses = [
        'group inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium cursor-pointer',
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
                        <div className="absolute inset-0 bg-black/55" onClick={() => !pending && setOpen(false)} aria-hidden />
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
                                        Cette action est <strong>définitive</strong> (soft delete). La carte et la page publique ne seront plus visibles.
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-3 px-5 py-4">
                                {/* Aperçu */}
                                <div className="rounded-lg border bg-red-50/40 p-3">
                                    <div className="mb-2 text-sm font-medium text-red-800">Aperçu (dry run)</div>
                                    {preview ? (
                                        <ul className="grid gap-2 text-sm">
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <BadgeInfo className="h-4 w-4 text-red-600" />
                                                Titre&nbsp;: <span className="font-semibold truncate">{preview.title || 'Sans titre'}</span>
                                            </li>
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <Video className="h-4 w-4 text-red-600" />
                                                Statut&nbsp;: <span className="font-semibold">{preview.status}</span>
                                            </li>
                                            {preview.videoUrl && (
                                                <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                    <Link2 className="h-4 w-4 text-red-600" />
                                                    Vidéo&nbsp;: <span className="truncate">{preview.videoUrl}</span>
                                                </li>
                                            )}
                                        </ul>
                                    ) : error ? (
                                        <div className="text-sm text-red-700">{error}</div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-red-700">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                                        </div>
                                    )}
                                </div>

                                {/* Consentement */}
                                <label className="mt-1 flex items-start gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5"
                                        checked={confirm}
                                        disabled={pending}
                                        onChange={(e) => (e.target.checked ? setConfirm(true) : setConfirm(false))}
                                    />
                                    <span>
                                        Je comprends que cette opération est irréversible pour l’interface (donnée conservée en base via <em>deletedAt</em>).
                                    </span>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
                                <button
                                    onClick={() => !pending && setOpen(false)}
                                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                                    disabled={pending}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={!confirm || pending}
                                    className={[
                                        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white',
                                        'bg-red-600 hover:bg-red-700 disabled:opacity-60',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40',
                                    ].join(' ')}
                                >
                                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    {pending ? 'Suppression…' : 'Supprimer définitivement'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
