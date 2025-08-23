import { Suspense } from 'react';
import RegisterClient from '@/components/RegisterClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-md p-6">
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                </div>
            }
        >
            <RegisterClient />
        </Suspense>
    );
}
