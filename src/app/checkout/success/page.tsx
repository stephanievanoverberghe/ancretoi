import { Suspense } from 'react';
import SuccessClient from '@/components/SuccessClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function SuccessPage() {
    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-2 font-serif text-3xl">Merci 🙏</h1>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Validation du paiement…</p>}>
                <SuccessClient />
            </Suspense>
        </div>
    );
}
