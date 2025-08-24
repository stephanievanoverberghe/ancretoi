'use client';

import { useState } from 'react';

type Result = { ok: true; mode: 'test' } | { ok: true; mode: 'bulk'; total: number; sent: number; failed: number; tag: string | null } | { ok: false; error: string };

export default function ComposeSendForm() {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [result, setResult] = useState<Result | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setState('sending');
        setOpen(true);
        setResult(null);

        const fd = new FormData(e.currentTarget);
        try {
            const res = await fetch('/api/admin/newsletter/send', {
                method: 'POST',
                body: fd,
                headers: { accept: 'application/json', 'x-requested-with': 'fetch' },
            });
            const data = (await res.json()) as Result;
            if (!res.ok || !('ok' in data) || data.ok === false) {
                setResult(data);
                setState('error');
                return;
            }
            setResult(data);
            setState('done');
            // Option: reset form uniquement si bulk ok
            // e.currentTarget.reset();
        } catch {
            setResult({ ok: false, error: 'network_error' });
            setState('error');
        }
    }

    return (
        <>
            <form onSubmit={onSubmit} className="grid gap-3">
                <label className="block">
                    <span className="mb-1 block text-sm text-muted-foreground">Sujet</span>
                    <input
                        name="subject"
                        required
                        placeholder="Inspiration de la semaine ✨"
                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm text-muted-foreground">HTML</span>
                    <textarea
                        name="html"
                        required
                        rows={10}
                        placeholder="<h2>Bonjour</h2><p>Contenu...</p>"
                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-sm text-muted-foreground">Email test (optionnel)</span>
                        <input
                            name="testEmail"
                            type="email"
                            placeholder="moi@example.com"
                            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-sm text-muted-foreground">Tag (optionnel)</span>
                        <input
                            name="tag"
                            placeholder="ex: vip"
                            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600/20"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button className="btn disabled:opacity-60" disabled={state === 'sending'}>
                        {state === 'sending' ? 'Envoi en cours…' : 'Envoyer'}
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Sans <em>Email test</em>, l’envoi part à tous les <strong>confirmed</strong> (filtrable par tag).
                    </span>
                </div>
            </form>

            {/* MODALE */}
            {open && (
                <div
                    className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirmation d'envoi"
                    onClick={() => setOpen(false)}
                >
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-3">
                            <div
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                                    state === 'error' ? 'bg-rose-50 ring-1 ring-rose-200 text-rose-700' : 'bg-brand-50 ring-1 ring-brand-200 text-brand-800'
                                }`}
                            >
                                {state === 'sending' ? (
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="56" strokeDashoffset="28" />
                                    </svg>
                                ) : state === 'error' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                        <path
                                            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M20 7 9 18l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                )}
                            </div>

                            <div className="min-w-0">
                                {state === 'sending' && (
                                    <>
                                        <h3 className="font-semibold">Envoi en cours…</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Merci de patienter pendant la préparation de la campagne.</p>
                                    </>
                                )}
                                {state === 'done' && result?.ok && (
                                    <>
                                        <h3 className="font-semibold">C’est envoyé ✅</h3>
                                        {result.mode === 'test' ? (
                                            <p className="mt-1 text-sm text-muted-foreground">Un email test vient d’être envoyé.</p>
                                        ) : (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Campagne lancée&nbsp;: <strong>{result.sent}</strong> envoyés
                                                {result.failed ? (
                                                    <>
                                                        , <strong className="text-rose-600">{result.failed}</strong> échecs
                                                    </>
                                                ) : null}
                                                {typeof result.total === 'number' ? <> / {result.total} destinataires</> : null}
                                                {result.tag ? (
                                                    <>
                                                        {' '}
                                                        — tag&nbsp;<code>{result.tag}</code>
                                                    </>
                                                ) : null}
                                            </p>
                                        )}
                                    </>
                                )}
                                {state === 'error' && (
                                    <>
                                        <h3 className="font-semibold">Envoi impossible</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{result && 'error' in result ? result.error : 'Erreur réseau. Réessaie plus tard.'}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                className="rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-brand-50"
                                onClick={() => setOpen(false)}
                                disabled={state === 'sending'}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
