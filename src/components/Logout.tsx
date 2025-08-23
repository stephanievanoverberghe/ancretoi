'use client';
import { useTransition, KeyboardEvent } from 'react';

type Props = {
    variant?: 'menu' | 'primary';
};

export default function LogoutButton({ variant = 'menu' }: Props) {
    const [pending, start] = useTransition();

    const className =
        variant === 'menu'
            ? [
                  'navlink focusable block w-full text-left transition-all',
                  'bg-transparent text-foreground/80 hover:text-foreground',
                  pending ? 'opacity-60 pointer-events-none' : '',
              ].join(' ')
            : ['btn focusable', pending ? 'opacity-60 pointer-events-none' : ''].join(' ');

    function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }

    function handleClick() {
        start(async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            location.href = '/';
        });
    }

    return (
        <button type="button" disabled={pending} aria-busy={pending} className={className} onClick={handleClick} onKeyDown={onKeyDown}>
            <span className="inline-flex cursor-pointer">{pending ? 'Déconnexion…' : 'Se déconnecter'}</span>
        </button>
    );
}
