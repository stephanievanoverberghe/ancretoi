import { Suspense } from 'react';
import ResetPasswordClient from '@/components/ResetPasswordClient';

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
            <ResetPasswordClient />
        </Suspense>
    );
}
