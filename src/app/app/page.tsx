'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
    const [email, setEmail] = useState<string | null>(null);
    useEffect(() => {
        // Simple: lit le cookie via /api/me si tu crées cette route plus tard
        fetch('/api/me')
            .then((r) => r.json())
            .then((d) => setEmail(d?.user?.email || null))
            .catch(() => {});
    }, []);
    return (
        <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Espace membre</h1>
            {email && (
                <p className="text-muted-foreground">
                    Connectée en tant que <strong>{email}</strong>
                </p>
            )}
            <Link className="underline" href="/">
                Retour accueil
            </Link>
        </div>
    );
}
