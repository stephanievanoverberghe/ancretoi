'use client';

import { useEffect, useMemo, useState } from 'react';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
}

export default function SlugPreview() {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');

    useEffect(() => {
        const titleEl = document.querySelector<HTMLInputElement>('input[name="title"]');
        const slugEl = document.querySelector<HTMLInputElement>('input[name="slug"]');
        if (!titleEl || !slugEl) return;

        const onTitle = () => setTitle(titleEl.value);
        const onSlug = () => setSlug(slugEl.value);

        titleEl.addEventListener('input', onTitle);
        slugEl.addEventListener('input', onSlug);

        onTitle();
        onSlug();

        return () => {
            titleEl.removeEventListener('input', onTitle);
            slugEl.removeEventListener('input', onSlug);
        };
    }, []);

    const preview = useMemo(() => {
        const base = slug.trim() ? slug : slugify(title || '');
        return base ? `/${base}` : '/—';
    }, [title, slug]);

    return (
        <div className="inline-flex items-center gap-2 rounded-lg border bg-[--card] px-2.5 py-1 text-xs text-muted-foreground">
            <span className="opacity-80">Prévisualisation slug</span>
            <code className="rounded bg-white/70 px-1.5 py-0.5">{preview}</code>
        </div>
    );
}
