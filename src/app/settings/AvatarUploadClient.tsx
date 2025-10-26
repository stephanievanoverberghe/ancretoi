'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AvatarUploadClient({ initialAvatarUrl, initialName }: { initialAvatarUrl: string | null; initialName: string }) {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
    const [name, setName] = useState(initialName);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Pour révoquer les ObjectURLs et éviter les leaks
    const lastObjectUrlRef = useRef<string | null>(null);
    useEffect(() => {
        return () => {
            if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
        };
    }, []);

    function onPick() {
        inputRef.current?.click();
    }

    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;

        // Limite douce (1 Mo)
        const MAX = 1 * 1024 * 1024;
        if (f.size > MAX) {
            setMsg('Fichier trop lourd (max 1 Mo).');
            // reset input si besoin
            e.target.value = '';
            return;
        }

        const url = URL.createObjectURL(f);
        // révoque l’ancienne preview si c’était un ObjectURL
        if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = url;
        setPreview(url);
        setMsg(null);
    }

    async function onSave(e: React.FormEvent) {
        e.preventDefault();

        const form = new FormData();
        const file = inputRef.current?.files?.[0] ?? null;
        if (file) form.append('avatar', file);
        form.append('name', name);

        setBusy(true);
        setMsg(null);
        try {
            const r = await fetch('/api/settings/avatar', { method: 'POST', body: form });
            type AvatarResp = { ok?: boolean; error?: string; avatarUrl?: string | null };

            let j: AvatarResp | null = null;
            try {
                j = (await r.json()) as AvatarResp;
            } catch {
                j = null;
            }

            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Upload impossible');

            // si l’API renvoie une nouvelle URL (ex. data:URL / S3…), on la prend
            if (typeof j.avatarUrl !== 'undefined') {
                // si la preview actuelle est un ObjectURL, on le révoque
                if (lastObjectUrlRef.current) {
                    URL.revokeObjectURL(lastObjectUrlRef.current);
                    lastObjectUrlRef.current = null;
                }
                setPreview(j.avatarUrl ?? null);
            }

            setMsg('Profil mis à jour ✅');
            // propage la maj à tous les Server Components (layouts, headers…)
            router.refresh();
        } catch (e) {
            setMsg(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={onSave} className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-border bg-white">
                    {preview ? (
                        <Image src={preview} alt="" fill className="object-cover" unoptimized />
                    ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">🙂</div>
                    )}
                </div>
                <div className="flex flex-col">
                    <button type="button" onClick={onPick} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                        {preview ? 'Changer…' : 'Ajouter un avatar…'}
                    </button>
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                    <span className="mt-1 text-[11px] text-muted-foreground">PNG/JPG, 1 Mo max.</span>
                </div>
            </div>

            <div>
                <label className="mb-1 block text-xs text-muted-foreground">Nom affiché</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-600/40"
                    placeholder="Ton prénom"
                />
            </div>

            <div className="flex items-center gap-2">
                <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-brand-700">
                    {busy ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
            </div>
        </form>
    );
}
