'use client';
import { useTransition } from 'react';

export function LogoutButton() {
    const [pending, start] = useTransition();
    return (
        <button
            onClick={() =>
                start(async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    location.href = '/';
                })
            }
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            disabled={pending}
        >
            {pending ? '…' : 'Se déconnecter'}
        </button>
    );
}
