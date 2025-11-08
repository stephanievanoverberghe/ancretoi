'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Trash2, Loader2, AlertTriangle, BadgeInfo, Tag } from 'lucide-react';

type Props = {
    slug: string;
    className?: string;
    afterDelete?: 'refresh' | 'redirect';
    redirectTo?: string;
    label?: string;
};

type PreviewCategory = {
    _id: string;
    slug: string;
    name: string;
    color: string | null;
    icon: string | null;
    description?: string | null;
    postsUsing: number;
};

type ApiResponse<T> = {
    ok: boolean;
    error?: string;
    doc?: T;
};

export default function DeleteCategoryButton({ slug, className, afterDelete = 'refresh', redirectTo = '/admin/blog/categories', label }: Props) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pending, start] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [preview, setPreview] = useState<PreviewCategory | null>(null);
    const [confirm, setConfirm] = useState(false);

    const router = useRouter();
    const titleId = useId();
    const descId = useId();

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === 'Escape' && !pending) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, pending]);

    async function safeJson<T>(response: Response): Promise<T | string> {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return (await response.json()) as T;
        }
        return await response.text();
    }

    function onOpen() {
        setConfirm(false);
        setError(null);
        setPreview(null);
        setOpen(true);

        start(async () => {
            try {
                const r = await fetch(`/api/admin/blog/categories/delete/?slug=${encodeURIComponent(slug)}&dryRun=true`, { method: 'GET' });

                const payload = await safeJson<ApiResponse<PreviewCategory>>(r);

                if (typeof payload === 'string') {
                    if (payload.startsWith('<!DOCTYPE') || payload.startsWith('<html')) {
                        throw new Error("La requête de prévisualisation a retourné du HTML (probable redirection d'auth). Es-tu bien connecté en admin ?");
                    }
                    throw new Error(payload);
                }

                if (!r.ok || !payload.ok) {
                    throw new Error(payload.error || `HTTP ${r.status}`);
                }

                setPreview(payload.doc ?? null);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        });
    }

    function onConfirm() {
        setError(null);
        start(async () => {
            try {
                const r = await fetch(`/api/admin/blog/categories/delete/?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });

                const payload = await safeJson<ApiResponse<null>>(r);

                if (typeof payload === 'string') {
                    if (payload.startsWith('<!DOCTYPE') || payload.startsWith('<html')) {
                        throw new Error("La suppression a retourné du HTML (probable redirection d'auth).");
                    }
                    throw new Error(payload);
                }

                if (!r.ok || !payload.ok) {
                    throw new Error(payload.error || `HTTP ${r.status}`);
                }

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
            <button type="button" onClick={onOpen} className={triggerClasses} title="Supprimer la catégorie (hard delete)">
                <Trash2 className="h-4 w-4 transition-transform group-hover:-rotate-6" />
                {label ?? 'Supprimer'}
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
                                        Supprimer la catégorie « {slug} »
                                    </h3>
                                    <p id={descId} className="mt-0.5 text-sm text-muted-foreground">
                                        Action <strong>définitive</strong> : la catégorie sera supprimée de la base.
                                    </p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-3 px-5 py-4">
                                <div className="rounded-lg border bg-red-50/40 p-3">
                                    <div className="mb-2 text-sm font-medium text-red-800">Aperçu (dry run)</div>
                                    {preview ? (
                                        <ul className="grid gap-2 text-sm">
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <BadgeInfo className="h-4 w-4 text-red-600" />
                                                Nom&nbsp;: <span className="font-semibold truncate">{preview.name}</span>
                                            </li>
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <BadgeInfo className="h-4 w-4 text-red-600" />
                                                Slug&nbsp;: <span className="truncate">{preview.slug}</span>
                                            </li>
                                            <li className="flex items-center gap-1.5 rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                <Tag className="h-4 w-4 text-red-600" />
                                                Articles liés&nbsp;: <span className="font-semibold">{preview.postsUsing}</span>
                                            </li>
                                            {preview.description ? (
                                                <li className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-red-100">
                                                    <div className="text-[11px] text-gray-500">Description</div>
                                                    <div className="text-sm">{preview.description}</div>
                                                </li>
                                            ) : null}
                                        </ul>
                                    ) : error ? (
                                        <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-red-700">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                                        </div>
                                    )}
                                </div>

                                <label className="mt-1 flex items-start gap-2 text-sm">
                                    <input type="checkbox" className="mt-0.5" checked={confirm} disabled={pending} onChange={(e) => setConfirm(e.target.checked)} />
                                    <span>Je comprends que la catégorie sera supprimée définitivement. Les articles liés devront être re-catégorisés manuellement.</span>
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
