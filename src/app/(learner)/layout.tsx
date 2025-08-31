// src/app/(learner)/layout.tsx
import type { ReactNode } from 'react';
import BottomNav from './components/BottomNav'; // ← import direct du client component

export default function LearnerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh bg-[radial-gradient(80%_120%_at_100%_0%,#EEF2FF_0%,#FFFFFF_50%),radial-gradient(80%_120%_at_0%_100%,#F5F3FF_0%,#FFFFFF_50%)]">
            <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
            {/* nav mobile sticky */}
            <BottomNav />
        </div>
    );
}
