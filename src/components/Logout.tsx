'use client';
import { useTransition } from 'react';

export default function LogoutButton() {
    const [pending, start] = useTransition();
    return (
        <button
            type="button"
            onClick={() =>
                start(async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    location.href = '/';
                })
            }
            className="menu-item menu-button focusable cursor-pointer"
            disabled={pending}
        >
            {pending ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
    );
}
