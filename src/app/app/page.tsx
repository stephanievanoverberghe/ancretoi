'use client';
import { useEffect, useState } from 'react';

type PublicUser = { email: string; name?: string | null; role?: string | null } | null;

export default function Dashboard() {
    const [user, setUser] = useState<PublicUser>(null);
    useEffect(() => {
        fetch('/api/me')
            .then((r) => r.json())
            .then((d) => setUser(d.user));
    }, []);
    return (
        <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Espace membre</h1>
            {user && (
                <p className="text-muted-foreground">
                    Connectée en tant que <strong>{user.name || user.email}</strong>
                </p>
            )}
            <ul className="list-disc pl-6">
                <li>
                    <a className="underline" href="/app/r7/d01/morning">
                        RESET-7 · Day 1 · Morning
                    </a>
                </li>
            </ul>
        </div>
    );
}
