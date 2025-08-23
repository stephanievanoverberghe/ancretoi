// src/app/checkout/success/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type ConfirmOk = { ok: true; redirectTo: string; enrollmentId?: string };
type ConfirmErr = { ok?: false; error?: string; redirectTo?: string };

function hasError(x: ConfirmOk | ConfirmErr): x is ConfirmErr {
    return typeof (x as ConfirmErr)?.error === 'string';
}

export default function SuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const session_id = useMemo(() => sp.get('session_id') ?? '', [sp]);
    const program = useMemo(() => (sp.get('program') || '').trim().toLowerCase(), [sp]);

    const [status, setStatus] = useState<'idle' | 'confirming' | 'ok' | 'error'>('idle');
    const [message, setMessage] = useState<string>('Validation du paiement…');

    const confirm = useCallback(async () => {
        if (!session_id || !program) {
            setStatus('error');
            setMessage('Lien de confirmation invalide (paramètres manquants).');
            return;
        }

        setStatus('confirming');
        setMessage('Validation du paiement en cours…');

        try {
            const r = await fetch('/api/checkout/confirm', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ session_id, program }),
            });

            const data = (await r.json().catch(() => ({}))) as ConfirmOk | ConfirmErr;

            if (r.status === 401) {
                setStatus('error');
                setMessage('Tu dois être connectée pour finaliser la confirmation. Merci de te reconnecter.');
                return;
            }
            if (!r.ok) {
                setStatus('error');
                setMessage(hasError(data) ? data.error || 'Erreur de confirmation.' : 'Erreur de confirmation.');
                return;
            }

            if ('redirectTo' in data && typeof data.redirectTo === 'string' && data.redirectTo.length > 0) {
                setStatus('ok');
                setMessage('Paiement confirmé. Redirection en cours…');
                router.replace(data.redirectTo);
            } else {
                setStatus('error');
                setMessage('Paiement confirmé mais redirection absente. Ouvre ton espace membre depuis le menu.');
            }
        } catch {
            setStatus('error');
            setMessage('Réseau indisponible. Vérifie ta connexion puis réessaie.');
        }
    }, [session_id, program, router]);

    useEffect(() => {
        void confirm();
    }, [confirm]);

    return (
        <div className="mx-auto max-w-md py-16 sm:py-20 lg:py-24">
            <h1 className="mb-2 font-serif text-3xl">Merci 🙏</h1>
            <p className="text-sm text-muted-foreground">{message}</p>

            <div className="mt-4 flex items-center gap-2">
                {status === 'error' && (
                    <>
                        <button type="button" onClick={() => void confirm()} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                            Réessayer
                        </button>
                        <Link href="/member" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                            Aller à mon espace
                        </Link>
                        <Link href="/login" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                            Me reconnecter
                        </Link>
                    </>
                )}
                {status === 'confirming' && (
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <span className="h-2 w-2 animate-pulse rounded-full" />
                        Merci de patienter…
                    </span>
                )}
            </div>
        </div>
    );
}
