// src/app/settings/components/PasswordChangeClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };
function estimateStrength(pwd: string): Strength {
    // petit estimateur maison (pas de lib) : longueur, classes, répétitions/suites simples
    let score = 0;
    const len = pwd.length;
    const classes = [/[a-z]/.test(pwd), /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length;

    if (len >= 12) score++;
    if (len >= 16) score++;
    if (classes >= 3) score++;
    if (classes === 4) score++;

    // punir suites basiques
    if (/([a-z])\1{2,}|([A-Z])\2{2,}|([0-9])\3{2,}/.test(pwd)) score = Math.max(0, score - 1);
    if (/0123|1234|abcd|qwerty|azerty|password|motdepasse/i.test(pwd)) score = Math.max(0, score - 2);

    const label = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'][Math.min(score, 4)];
    return { score: Math.min(score, 4) as Strength['score'], label };
}

export default function PasswordChangeClient() {
    const [csrf, setCsrf] = useState('');
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/csrf', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setCsrf(String(d?.token || '')))
            .catch(() => setCsrf(''));
    }, []);

    const s = useMemo(() => estimateStrength(next), [next]);
    const ok = !!csrf && !!current && next.length >= 12 && next === confirm && s.score >= 3;

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        if (!ok) {
            setErr('Mot de passe insuffisant ou confirmation invalide.');
            return;
        }
        setBusy(true);
        try {
            const r = await fetch('/api/settings/password', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ current, password: next }),
                credentials: 'same-origin',
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Impossible de changer le mot de passe');
            setMsg('Mot de passe mis à jour ✅');
            setCurrent('');
            setNext('');
            setConfirm('');
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={save} className="space-y-3">
            <input
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                type="password"
                placeholder="Mot de passe actuel"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
            />
            <input
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                type="password"
                placeholder="Nouveau mot de passe (12+ avec Aa0!)"
                value={next}
                onChange={(e) => setNext(e.target.value)}
            />
            {/* strength bar */}
            {next && (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                        <div
                            style={{ width: `${(s.score + 1) * 20}%` }}
                            className={['h-full', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'][s.score]}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
            )}
            <input
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <button type="submit" disabled={!ok || busy} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-brand-700">
                    {busy ? 'Enregistrement…' : 'Changer le mot de passe'}
                </button>
                {msg && <span className="text-xs text-emerald-700">{msg}</span>}
                {err && <span className="text-xs text-brand-700">{err}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground">Évite les suites (1234) et les mots communs. Longueur ≥ 12 + minuscules/MAJ + chiffres + symbole.</p>
        </form>
    );
}
