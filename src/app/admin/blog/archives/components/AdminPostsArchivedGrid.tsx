// src/app/admin/blog/archives/components/AdminPostsArchivedGrid.tsx
'use client';

import Image from 'next/image';
import { CalendarClock, ImageIcon } from 'lucide-react';
import RestorePostButton from './RestorePostButton';
import DeletePostButton from '@/components/admin/DeletePostButton';

type Row = {
    id: string;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    coverUrl: string | null;
    summary: string | null;
    timestamps: { createdAt: string | null; updatedAt: string | null; deletedAt?: string | null };
};

function formatRelative(iso?: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR');
}

export default function AdminPostsArchivedGrid({ rows }: { rows: Row[] }) {
    if (!rows.length) {
        return (
            <div className="rounded-2xl border border-amber-400/40 p-8 text-center">
                <p className="text-sm text-gray-600">Aucune archive.</p>
            </div>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
                <li key={r.id} className="group overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                    <div className="relative aspect-[16/10] w-full bg-amber-50">
                        {r.coverUrl ? (
                            <Image src={r.coverUrl} alt="Couverture" fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px" className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-amber-400">
                                <ImageIcon className="h-10 w-10" />
                            </div>
                        )}
                        <div className="absolute left-2 top-2 rounded bg-amber-600 px-2 py-0.5 text-[11px] font-medium text-white">Archivé</div>
                    </div>

                    <div className="p-4">
                        <div className="text-xs text-gray-500">/{r.slug}</div>
                        <h3 className="line-clamp-2 text-base font-semibold">{r.title}</h3>

                        {r.summary && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{r.summary}</p>}

                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4" />
                            archivé {formatRelative(r.timestamps.deletedAt)}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <RestorePostButton slug={r.slug} />
                            <DeletePostButton slug={r.slug} className="w-full justify-center" afterDelete="refresh" />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
