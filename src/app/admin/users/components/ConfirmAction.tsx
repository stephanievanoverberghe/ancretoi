'use client';

import { useState, type PropsWithChildren } from 'react';
import FullscreenModal from '@/components/ui/FullscreenModal';

type Variant = 'danger' | 'warn' | 'neutral' | 'success';

type Props = {
    action: (formData: FormData) => Promise<void>; // server action
    title: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    buttonLabel?: string; // libellé du bouton qui ouvre la modale (par défaut = title)
    buttonClassName?: string; // classes du bouton d’ouverture
    requireText?: string; // ex: "SUPPRIMER" pour forcer une saisie
    esc?: boolean; // override esc close (default true)
    backdrop?: boolean; // override backdrop close (default true)
    compact?: boolean; // bouton d’ouverture plus compact
};

const palette: Record<Variant, { open: string; confirm: string; accent: string }> = {
    danger: { open: 'border-red-300 bg-red-600 text-white hover:bg-red-700', confirm: 'bg-red-600 text-white hover:bg-red-700', accent: 'text-red-600' },
    warn: { open: 'bg-amber-600 text-white hover:bg-amber-700', confirm: 'bg-amber-600 text-white hover:bg-amber-700', accent: 'text-amber-600' },
    success: { open: 'bg-emerald-600 text-white hover:bg-emerald-700', confirm: 'bg-emerald-600 text-white hover:bg-emerald-700', accent: 'text-emerald-600' },
    neutral: { open: 'bg-zinc-600 text-white hover:bg-zinc-700', confirm: 'bg-brand-600 text-white hover:bg-brand-700', accent: 'text-brand-600' },
};

export default function ConfirmAction({
    action,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'neutral',
    buttonLabel,
    buttonClassName,
    requireText,
    esc = true,
    backdrop = true,
    compact,
    children, // hidden inputs (id, etc.)
}: PropsWithChildren<Props>) {
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const ui = palette[variant];

    return (
        <>
            {/* Bouton d’ouverture */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={[
                    'rounded-2xl font-semibold cursor-pointer transition',
                    compact ? 'px-3 py-2 text-sm' : 'w-full px-4 py-2.5 text-sm',
                    ui.open,
                    buttonClassName || '',
                ].join(' ')}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                {buttonLabel || title}
            </button>

            {/* Modale plein écran */}
            <FullscreenModal open={open} onClose={() => setOpen(false)} title={title} closeOnBackdrop={backdrop} closeOnEsc={esc}>
                {/* Contenu */}
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-7 w-7 rounded-full bg-zinc-50 grid place-items-center ${ui.accent}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-zinc-700">{message}</p>

                        {requireText && (
                            <div className="mt-4">
                                <label className="block text-xs text-zinc-500 mb-1">
                                    Pour confirmer, tapez&nbsp;
                                    <span className="font-semibold text-zinc-700">{requireText}</span>
                                </label>
                                <input
                                    value={typed}
                                    onChange={(e) => setTyped(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                                    placeholder={requireText}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer d’actions */}
                <div className="mt-6 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                        {cancelLabel}
                    </button>

                    <form
                        action={async (fd) => {
                            if (requireText && typed !== requireText) return;
                            await action(fd);
                            setOpen(false);
                        }}
                    >
                        {children}
                        <button
                            type="submit"
                            disabled={!!requireText && typed !== requireText}
                            className={['rounded-xl px-3 py-2 text-sm font-semibold', ui.confirm, requireText && typed !== requireText ? 'opacity-60 cursor-not-allowed' : ''].join(
                                ' '
                            )}
                        >
                            {confirmLabel}
                        </button>
                    </form>
                </div>
            </FullscreenModal>
        </>
    );
}
