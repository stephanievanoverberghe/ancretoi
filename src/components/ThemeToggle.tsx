'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const saved = (localStorage.getItem('theme') as 'light' | 'dark') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', saved);
        setTheme(saved);
    }, []);

    function toggle() {
        const next = theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        setTheme(next);
    }

    return (
        <button onClick={toggle} aria-pressed={theme === 'dark'} className="rounded-lg border border-border px-3 py-1.5 text-sm">
            {theme === 'dark' ? '☾ Sombre' : '☀︎ Clair'}
        </button>
    );
}
