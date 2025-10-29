'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Crown, ChevronDown, Eye, User as UserIcon, Ban, Undo2, Trash2, Settings2, AlertTriangle, Loader2, Mail } from 'lucide-react';

/* ================== Types UI ================== */
export type UiUser = {
    _id: string;
    name: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAtIso: string;
    avatarUrl: string | null;
    isSelf: boolean;
    isArchived?: boolean;
    isSuspended?: boolean;
};

export type UiEnrollment = {
    programSlug: string;
    programTitle: string;
    coverUrl: string | null;
    level: 'Basique' | 'Cible' | 'Premium' | null;
    status: 'active' | 'completed' | 'paused';
    startedAtIso: string | null;
    updatedAtIso: string | null;
    progressPct: number | null;
    currentDay: number | null;
    unitsCount: number | null;
};

export type UiUserDetail = {
    _id: string;
    name: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAtIso: string;
    avatarUrl: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
    passwordChangedAtIso?: string | null;
    enrollments: UiEnrollment[];
    isArchived?: boolean;
    isSuspended?: boolean;
    limits?: { maxConcurrentPrograms: number | null; features: string[] };
};

type Props = {
    users: UiUser[];
    setRoleAction: (fd: FormData) => Promise<void>;
    getUserDetailAction: (fd: FormData) => Promise<UiUserDetail>;
    archiveUserAction: (fd: FormData) => Promise<void>;
    restoreUserAction: (fd: FormData) => Promise<void>;
    suspendUserAction: (fd: FormData) => Promise<void>;
    unsuspendUserAction: (fd: FormData) => Promise<void>;
    hardDeleteUserAction: (fd: FormData) => Promise<void>;
    setUserLimitsAction: (fd: FormData) => Promise<void>;
};

type RoleFilter = 'all' | 'admin' | 'user';
type StatusFilter = 'all' | 'active' | 'archived' | 'suspended';
type SortKey = 'recent' | 'alpha';

/* ================== Utils ================== */
function timeLabel(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR');
}
function formatRelative(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = 60 * 1000,
        hr = 60 * min,
        day = 24 * hr;
    if (diff < hr) return `${Math.max(1, Math.round(diff / min))} min`;
    if (diff < day) return `${Math.round(diff / hr)} h`;
    return d.toLocaleDateString('fr-FR');
}
function RoleBadge({ role }: { role: 'user' | 'admin' }) {
    const cls = role === 'admin' ? 'bg-amber-100 text-amber-800 ring-amber-200' : 'bg-zinc-100 text-zinc-800 ring-zinc-200';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${cls}`}>{role}</span>;
}
function StateBadges({ archived, suspended }: { archived?: boolean; suspended?: boolean }) {
    return (
        <div className="flex items-center gap-1">
            {suspended && <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 ring-amber-200 px-2 py-0.5 text-[11px]">suspendu</span>}
            {archived && <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-800 ring-zinc-200 px-2 py-0.5 text-[11px]">archivé</span>}
        </div>
    );
}

/* ================== Confirm modale (réutilisable) ================== */
type ConfirmTone = 'red' | 'amber' | 'zinc';
type ConfirmConfig = {
    title: string;
    description: string;
    confirmLabel: string;
    tone: ConfirmTone;
    requiresCheckbox?: boolean;
};
function toneClasses(tone: ConfirmTone) {
    if (tone === 'red')
        return { ring: 'ring-red-100', iconBox: 'bg-red-50 text-red-600 ring-red-100', cta: 'bg-red-600 hover:bg-red-700', infoRing: 'ring-red-100', infoBg: 'bg-red-50/40' };
    if (tone === 'amber')
        return {
            ring: 'ring-amber-100',
            iconBox: 'bg-amber-50 text-amber-700 ring-amber-100',
            cta: 'bg-amber-600 hover:bg-amber-700',
            infoRing: 'ring-amber-100',
            infoBg: 'bg-amber-50/40',
        };
    return { ring: 'ring-zinc-100', iconBox: 'bg-zinc-50 text-zinc-700 ring-zinc-100', cta: 'bg-zinc-800 hover:bg-black', infoRing: 'ring-zinc-100', infoBg: 'bg-zinc-50/40' };
}

function ConfirmActionModal({
    open,
    onClose,
    onConfirm,
    config,
    preview,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    config: ConfirmConfig;
    preview?: { lines: Array<{ label: string; value: string }> };
}) {
    const [mounted, setMounted] = useState(false);
    const [pending, start] = useTransition();
    const [checked, setChecked] = useState(false);
    const titleId = useId();
    const descId = useId();
    const t = toneClasses(config.tone);

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
            if (ev.key === 'Escape' && !pending) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, pending, onClose]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby={titleId} aria-describedby={descId}>
            <div className="absolute inset-0 bg-black/55" onClick={() => !pending && onClose()} aria-hidden />
            <div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ${t.ring}`}>
                {/* Header */}
                <div className="flex items-start gap-3 border-b px-5 py-4">
                    <div className={`rounded-full p-2 ring-1 ${t.iconBox}`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 id={titleId} className="truncate text-lg font-semibold">
                            {config.title}
                        </h3>
                        <p id={descId} className="mt-0.5 text-sm text-muted-foreground">
                            {config.description}
                        </p>
                    </div>
                </div>

                {/* Aperçu */}
                {preview && preview.lines.length > 0 && (
                    <div className={`mx-5 mt-4 rounded-lg ${t.infoBg} p-3 ring-1 ${t.infoRing}`}>
                        <div className="mb-2 text-sm font-medium">Aperçu</div>
                        <ul className="grid gap-2 text-sm">
                            {preview.lines.map((ln) => (
                                <li key={ln.label} className="flex items-center justify-between rounded-md bg-white/70 px-2 py-1 ring-1">
                                    <span className="text-gray-600">{ln.label}</span>
                                    <span className="font-semibold truncate">{ln.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Checkbox si nécessaire */}
                {config.requiresCheckbox && (
                    <label className="m-5 mt-3 flex items-start gap-2 text-sm">
                        <input type="checkbox" className="mt-0.5" checked={checked} disabled={pending} onChange={(e) => setChecked(e.target.checked)} />
                        <span>
                            Je comprends que cette opération est <strong>irréversible</strong>.
                        </span>
                    </label>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t px-5 py-3">
                    <button onClick={() => !pending && onClose()} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60" disabled={pending}>
                        Annuler
                    </button>
                    <button
                        onClick={() => start(onConfirm)}
                        disabled={pending || (config.requiresCheckbox ? !checked : false)}
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-60 ${t.cta}`}
                    >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                        {pending ? 'Traitement…' : config.confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ================== Quick View + ACTIONS dans la modale ================== */
function RoleSwitcher({ userId, role, isSelf, setRoleAction }: { userId: string; role: 'user' | 'admin'; isSelf: boolean; setRoleAction: (fd: FormData) => Promise<void> }) {
    const [pending, start] = useTransition();
    const make = (next: 'user' | 'admin') => {
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('role', next);
        return setRoleAction(fd);
    };
    return (
        <div className="inline-flex w-full items-center justify-center overflow-hidden rounded-lg ring-1 ring-gray-200 bg-gray-50">
            <button
                disabled={pending || (isSelf && role !== 'admin')}
                onClick={() => start(() => make('user'))}
                className={['px-3 py-1.5 text-xs cursor-pointer', role === 'admin' ? 'text-gray-800 hover:bg-white' : 'bg-white text-brand-700 font-medium'].join(' ')}
                title="Basculer en user"
            >
                <UserIcon className="mr-1 inline h-3.5 w-3.5" /> user
            </button>
            <button
                disabled={pending}
                onClick={() => start(() => make('admin'))}
                className={['px-3 py-1.5 text-xs cursor-pointer', role === 'admin' ? 'bg-white text-amber-700 font-medium' : 'text-gray-800 hover:bg-white'].join(' ')}
                title="Basculer en admin"
            >
                <Crown className="mr-1 inline h-3.5 w-3.5" /> admin
            </button>
        </div>
    );
}

function LimitsInline({
    initialMax,
    initialFeatures,
    onSave,
}: {
    initialMax: number | null | undefined;
    initialFeatures: string[] | undefined;
    onSave: (payload: Record<string, string>) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [max, setMax] = useState<string>(initialMax != null ? String(initialMax) : '');
    const [features, setFeatures] = useState<string>((initialFeatures ?? []).join(','));
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-brand-300 hover:bg-brand-50"
            >
                <Settings2 className="h-4 w-4" /> Limites
            </button>
        );
    }
    return (
        <div className="col-span-2 rounded-lg border p-2">
            <div className="text-xs text-gray-600 mb-1">Limites</div>
            <div className="flex items-center gap-2">
                <input
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    inputMode="numeric"
                    placeholder="Max programmes"
                    className="w-1/3 rounded-md border px-2 py-1 text-xs"
                />
                <input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="features: forum,chat" className="w-full rounded-md border px-2 py-1 text-xs" />
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
                <button onClick={() => setOpen(false)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
                    Annuler
                </button>
                <button
                    onClick={async () => {
                        await onSave({ maxConcurrentPrograms: max, features });
                        setOpen(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
                >
                    Enregistrer
                </button>
            </div>
        </div>
    );
}

function UserQuickViewModal({
    open,
    onClose,
    detail,
    selfEmail,
    actions,
}: {
    open: boolean;
    onClose: () => void;
    detail: UiUserDetail | null;
    selfEmail: string;
    actions: {
        setRoleAction: (fd: FormData) => Promise<void>;
        archiveUserAction: (fd: FormData) => Promise<void>;
        restoreUserAction: (fd: FormData) => Promise<void>;
        suspendUserAction: (fd: FormData) => Promise<void>;
        unsuspendUserAction: (fd: FormData) => Promise<void>;
        hardDeleteUserAction: (fd: FormData) => Promise<void>;
        setUserLimitsAction: (fd: FormData) => Promise<void>;
    };
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmCfg, setConfirmCfg] = useState<ConfirmConfig | null>(null);
    const [confirmPreview, setConfirmPreview] = useState<{ lines: Array<{ label: string; value: string }> } | undefined>(undefined);
    const [confirmFn, setConfirmFn] = useState<(() => Promise<void>) | null>(null);

    function openConfirm(cfg: ConfirmConfig, run: () => Promise<void>, d: UiUserDetail) {
        setConfirmCfg(cfg);
        setConfirmFn(() => run);
        setConfirmPreview({
            lines: [
                { label: 'Utilisateur', value: d.name || d.email },
                { label: 'Email', value: d.email },
                { label: 'Rôle', value: d.role },
            ],
        });
        setConfirmOpen(true);
    }

    function doRun(fn: (fd: FormData) => Promise<void>, userId: string, extra?: Record<string, string>) {
        const fd = new FormData();
        fd.append('userId', userId);
        if (extra) for (const [k, v] of Object.entries(extra)) fd.append(k, v);
        return fn(fd);
    }

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1200]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-brand-100">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b p-4">
                        <div className="min-w-0">
                            <div className="font-semibold truncate">{detail ? detail.name || detail.email : '—'}</div>
                            <div className="text-xs text-muted-foreground truncate">{detail?.email ?? '—'}</div>
                            <div className="mt-1 text-xs text-gray-600">
                                Rôle: <span className="font-medium">{detail?.role ?? '—'}</span> • Inscrit le {timeLabel(detail?.createdAtIso ?? null)}
                            </div>
                        </div>
                        <button onClick={onClose} className="ml-auto rounded-md border px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer">
                            Fermer
                        </button>
                    </div>

                    {/* Body */}
                    <div className="grid gap-4 p-4 md:grid-cols-3">
                        {/* Profil + Inscriptions */}
                        <div className="md:col-span-2 space-y-3">
                            {/* Banner plein cadre */}
                            <div className="relative h-40 w-full overflow-hidden rounded-xl ring-1 ring-black/5 bg-gray-100">
                                {detail?.avatarUrl ? (
                                    <Image src={detail.avatarUrl} alt={detail.name || detail.email} fill className="object-cover" sizes="100vw" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">Aucune image</div>
                                )}
                            </div>

                            {/* Profil */}
                            <div className="rounded-xl border p-3">
                                <div className="mb-2 text-xs text-muted-foreground">Profil</div>
                                {detail ? (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <div className="text-xs text-gray-500">Nom</div>
                                            <div className="font-medium">{detail.name ?? '—'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Email</div>
                                            <div className="font-medium">{detail.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Thème</div>
                                            <div className="font-medium">{detail.theme ?? 'system'}</div>
                                        </div>
                                        <div className="space-x-2">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
                                                Marketing: {detail.marketing ? 'oui' : 'non'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
                                                MàJ produit: {detail.productUpdates ? 'oui' : 'non'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-xs text-gray-600">
                                            Limites: {detail.limits?.maxConcurrentPrograms ?? '—'} programmes • features: {(detail.limits?.features ?? []).join(', ') || '—'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-16 rounded bg-gray-100 animate-pulse" />
                                )}
                            </div>

                            {/* Inscriptions */}
                            <div className="rounded-xl border p-3">
                                <div className="mb-2 text-xs text-muted-foreground">Inscriptions & progression</div>
                                {detail && detail.enrollments.length === 0 && <div className="text-sm text-gray-600">Aucune inscription.</div>}
                                {detail && detail.enrollments.length > 0 && (
                                    <ul className="space-y-2">
                                        {detail.enrollments.map((e) => (
                                            <li key={`${e.programSlug}-${e.startedAtIso ?? 'na'}`} className="rounded-xl border p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{e.programTitle}</div>
                                                        <div className="text-xs text-gray-600 truncate">{e.programSlug}</div>
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Jour {typeof e.currentDay === 'number' ? e.currentDay : '—'} • {e.progressPct != null ? `${e.progressPct}%` : '—'}
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <Link
                                                        href={`/admin/programs/${e.programSlug}/units`}
                                                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                                                    >
                                                        Ouvrir le programme
                                                    </Link>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* ACTIONS — TOUT est ici */}
                        <div className="space-y-3">
                            <div className="text-xs text-muted-foreground">Actions</div>

                            {/* Rôle */}
                            {detail && <RoleSwitcher userId={detail._id} role={detail.role} isSelf={detail.email === selfEmail} setRoleAction={actions.setRoleAction} />}

                            {/* Suspendre / Réactiver */}
                            {detail &&
                                (detail.isSuspended ? (
                                    <button
                                        onClick={() =>
                                            openConfirm(
                                                {
                                                    title: 'Réactiver cet utilisateur',
                                                    description: 'L’utilisateur pourra à nouveau se connecter.',
                                                    confirmLabel: 'Réactiver',
                                                    tone: 'zinc',
                                                },
                                                () => doRun(actions.unsuspendUserAction, detail._id),
                                                detail
                                            )
                                        }
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-emerald-300 hover:bg-emerald-50"
                                    >
                                        <Undo2 className="h-4 w-4" /> Réactiver
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            openConfirm(
                                                {
                                                    title: 'Suspendre cet utilisateur',
                                                    description: 'Il ne pourra plus accéder au service tant qu’il est suspendu.',
                                                    confirmLabel: 'Suspendre',
                                                    tone: 'amber',
                                                },
                                                () => doRun(actions.suspendUserAction, detail._id),
                                                detail
                                            )
                                        }
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-amber-300 hover:bg-amber-50"
                                    >
                                        <Ban className="h-4 w-4" /> Suspendre
                                    </button>
                                ))}

                            {/* Archiver / Restaurer */}
                            {detail &&
                                (detail.isArchived ? (
                                    <button
                                        onClick={() =>
                                            openConfirm(
                                                {
                                                    title: 'Restaurer cet utilisateur',
                                                    description: 'L’utilisateur réapparaît dans la liste active.',
                                                    confirmLabel: 'Restaurer',
                                                    tone: 'zinc',
                                                },
                                                () => doRun(actions.restoreUserAction, detail._id),
                                                detail
                                            )
                                        }
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-emerald-300 hover:bg-emerald-50"
                                    >
                                        <Undo2 className="h-4 w-4" /> Restaurer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            openConfirm(
                                                {
                                                    title: 'Archiver cet utilisateur',
                                                    description: 'Soft delete via deletedAt — l’utilisateur sera masqué.',
                                                    confirmLabel: 'Archiver',
                                                    tone: 'zinc',
                                                },
                                                () => doRun(actions.archiveUserAction, detail._id),
                                                detail
                                            )
                                        }
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-zinc-300 hover:bg-zinc-50"
                                    >
                                        <Trash2 className="h-4 w-4" /> Archiver
                                    </button>
                                ))}

                            {/* Limites inline */}
                            {detail && (
                                <LimitsInline
                                    initialMax={detail.limits?.maxConcurrentPrograms ?? null}
                                    initialFeatures={detail.limits?.features ?? []}
                                    onSave={(payload) => {
                                        const fd = new FormData();
                                        fd.append('userId', detail._id);
                                        if (payload.maxConcurrentPrograms != null) fd.append('maxConcurrentPrograms', payload.maxConcurrentPrograms);
                                        if (payload.features != null) fd.append('features', payload.features);
                                        return actions.setUserLimitsAction(fd);
                                    }}
                                />
                            )}

                            {/* Suppression définitive */}
                            {detail && (
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            {
                                                title: 'Supprimer définitivement cet utilisateur',
                                                description: 'Action irréversible. Les données associées peuvent persister si non nettoyées.',
                                                confirmLabel: 'Supprimer définitivement',
                                                tone: 'red',
                                                requiresCheckbox: true,
                                            },
                                            () => doRun(actions.hardDeleteUserAction, detail._id),
                                            detail
                                        )
                                    }
                                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm bg-white ring-1 ring-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" /> Suppr. définitive
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm modale locale */}
            {confirmCfg && confirmFn && (
                <ConfirmActionModal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={async () => {
                        await confirmFn();
                        setConfirmOpen(false);
                    }}
                    config={confirmCfg}
                    preview={confirmPreview}
                />
            )}
        </div>,
        document.body
    );
}

/* ================== GRID (cards : bouton Voir seulement) ================== */
export default function AdminUsersClient({
    users,
    setRoleAction,
    getUserDetailAction,
    archiveUserAction,
    restoreUserAction,
    suspendUserAction,
    unsuspendUserAction,
    hardDeleteUserAction,
    setUserLimitsAction,
}: Props) {
    const [qRaw, setQRaw] = useState('');
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortKey>('recent');

    const [openUserId, setOpenUserId] = useState<string | null>(null);
    const [detail, setDetail] = useState<UiUserDetail | null>(null);

    useEffect(() => {
        const id = setTimeout(() => setQ(qRaw.trim().toLowerCase()), 220);
        return () => clearTimeout(id);
    }, [qRaw]);

    const searchRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        let canceled = false;
        (async () => {
            if (!openUserId) {
                setDetail(null);
                return;
            }
            const fd = new FormData();
            fd.append('userId', openUserId);
            const d = await getUserDetailAction(fd);
            if (!canceled) setDetail(d);
        })();
        return () => {
            canceled = true;
        };
    }, [openUserId, getUserDetailAction]);

    const filtered = useMemo(() => {
        let list = users.slice();
        if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
        if (statusFilter !== 'all') {
            list = list.filter((u) => {
                if (statusFilter === 'active') return !u.isArchived && !u.isSuspended;
                if (statusFilter === 'archived') return !!u.isArchived;
                if (statusFilter === 'suspended') return !!u.isSuspended;
                return true;
            });
        }
        if (q) {
            list = list.filter((u) => `${u.name || ''} ${u.email}`.toLowerCase().includes(q));
        }
        if (sort === 'alpha') {
            list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'fr', { sensitivity: 'base' }));
        } else {
            list.sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());
        }
        return list;
    }, [users, q, roleFilter, statusFilter, sort]);

    return (
        <>
            {/* Toolbar mobile-first */}
            <section className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-4 bg-gradient-to-b from-white/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:mx-0 sm:rounded-xl sm:border sm:border-brand-200 sm:bg-white/70">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchRef}
                            value={qRaw}
                            onChange={(e) => setQRaw(e.target.value)}
                            placeholder="Rechercher (/, nom ou email)…"
                            className="w-full rounded-full border border-brand-400 bg-white pl-10 pr-10 py-2 text-sm shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        />
                        {qRaw && (
                            <button
                                onClick={() => {
                                    setQRaw('');
                                    setQ('');
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                                aria-label="Effacer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex overflow-hidden rounded-full ring-1 ring-brand-300">
                            {(['all', 'admin', 'user'] as RoleFilter[]).map((k) => {
                                const active = roleFilter === k;
                                const label = k === 'all' ? 'Tous' : k === 'admin' ? 'Admins' : 'Users';
                                return (
                                    <button
                                        key={k}
                                        onClick={() => setRoleFilter(k)}
                                        className={['px-3 py-1.5 text-xs cursor-pointer', active ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 hover:bg-brand-50'].join(
                                            ' '
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="inline-flex overflow-hidden rounded-full ring-1 ring-brand-300">
                            {(['all', 'active', 'archived', 'suspended'] as StatusFilter[]).map((k) => {
                                const active = statusFilter === k;
                                const label = k === 'all' ? 'Tous états' : k === 'active' ? 'Actifs' : k === 'archived' ? 'Archivés' : 'Suspendus';
                                return (
                                    <button
                                        key={k}
                                        onClick={() => setStatusFilter(k)}
                                        className={['px-3 py-1.5 text-xs cursor-pointer', active ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 hover:bg-brand-50'].join(
                                            ' '
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative">
                            <label htmlFor="users-sort" className="sr-only">
                                Trier
                            </label>
                            <select
                                id="users-sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortKey)}
                                className="appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-1.5 text-xs text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                <option value="recent">Récents</option>
                                <option value="alpha">A → Z</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid — bouton Voir uniquement */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-brand-600 border-dashed p-8 text-center">
                    <p className="text-sm text-gray-500">Aucun utilisateur ne correspond.</p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((u) => (
                        <li key={u._id} className="group overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            {/* Cover image FULL */}
                            <div className="relative aspect-[16/9] w-full bg-gray-100">
                                {u.avatarUrl ? (
                                    <Image src={u.avatarUrl} alt={u.name || u.email} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">Aucune image</div>
                                )}
                                <div className="absolute right-3 top-3 flex items-center gap-1">
                                    <RoleBadge role={u.role} />
                                    <StateBadges archived={u.isArchived} suspended={u.isSuspended} />
                                    {u.role === 'admin' && (
                                        <span className="rounded-full bg-amber-500/90 p-1 text-white ring-1 ring-amber-200">
                                            <Crown className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>
                                <div className="absolute left-3 bottom-3 rounded-md bg-black/45 px-2 py-1 text-xs text-white">inscrit {formatRelative(u.createdAtIso)}</div>
                            </div>

                            <div className="p-4">
                                <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate">{u.email}</span>
                                </div>
                                <h3 className="mt-0.5 line-clamp-2 text-base font-semibold sm:text-lg">
                                    {u.name || u.email}
                                    {u.isSelf && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800 ring-1 ring-brand-300">toi</span>}
                                </h3>

                                <div className="mt-3 grid grid-cols-1">
                                    <button
                                        onClick={() => setOpenUserId(u._id)}
                                        className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-800 bg-brand-50 ring-1 ring-brand-200 hover:ring-brand-500 transition hover:bg-brand-100 cursor-pointer"
                                        title="Aperçu / actions"
                                    >
                                        <Eye className="h-4 w-4" /> Voir / actions
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modale de détail + actions */}
            <UserQuickViewModal
                open={!!openUserId}
                onClose={() => setOpenUserId(null)}
                detail={detail}
                selfEmail={users.find((u) => u.isSelf)?.email ?? ''}
                actions={{ setRoleAction, archiveUserAction, restoreUserAction, suspendUserAction, unsuspendUserAction, hardDeleteUserAction, setUserLimitsAction }}
            />
        </>
    );
}
