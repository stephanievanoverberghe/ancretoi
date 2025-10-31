'use client';
import { useEffect, useState } from 'react';

type Prefs = { textScale: 1 | 1.1 | 1.25; reduceMotion: boolean };

export default function AccessibilityPrefsClient() {
    const [p, setP] = useState<Prefs>({ textScale: 1, reduceMotion: false });

    useEffect(() => {
        try {
            const raw = localStorage.getItem('a11y-prefs');
            if (raw) setP(JSON.parse(raw));
        } catch {}
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--text-scale', String(p.textScale));
        if (p.reduceMotion) document.documentElement.classList.add('reduce-motion');
        else document.documentElement.classList.remove('reduce-motion');
        try {
            localStorage.setItem('a11y-prefs', JSON.stringify(p));
        } catch {}
    }, [p]);

    return (
        <div className="space-y-3">
            <div>
                <div className="text-sm font-medium mb-1">Taille du texte</div>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 1.1, 1.25].map((v) => (
                        <button
                            key={v}
                            onClick={() => setP((s) => ({ ...s, textScale: v as Prefs['textScale'] }))}
                            className={[
                                'rounded-lg px-3 py-2 text-sm ring-1 transition',
                                p.textScale === v ? 'bg-brand-600 text-white ring-brand-600' : 'ring-border hover:bg-muted',
                            ].join(' ')}
                            aria-pressed={p.textScale === v}
                        >
                            {v === 1 ? 'Par défaut' : v === 1.1 ? 'Moyen' : 'Grand'}
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <span>Réduire les animations</span>
                <input type="checkbox" checked={p.reduceMotion} onChange={(e) => setP((s) => ({ ...s, reduceMotion: e.target.checked }))} />
            </label>

            <p className="text-[11px] text-muted-foreground">Tes choix sont mémorisés sur cet appareil.</p>
        </div>
    );
}
