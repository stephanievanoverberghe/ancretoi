// src/app/(learner)/layout.tsx
import type { ReactNode } from 'react';
import BottomNav from './components/BottomNav'; // ← import direct du client component

export default function LearnerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh">
            <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
            {/* nav mobile sticky */}
            <BottomNav />
        </div>
    );
}
