// src/app/admin/blog/posts/archives/components/AdminPostsArchivedGrid.tsx
'use client';

import Image from 'next/image';
import { CalendarClock, ImageIcon } from 'lucide-react';
import RestorePostButton from './RestorePostButton';
import DeleteArchivedPostButton from './DeleteArchivedPostButton';

type Row = {
    id: string;
    slug: string; // utilisé par les actions, pas affiché
    status: 'draft' | 'published';
    title: string;
    coverPath: string | null;
    summary: string | null; // non affiché ici
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
                <li key={r.id} className="group flex flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                    {/* Media */}
                    <div className="relative aspect-[16/10] w-full bg-amber-50">
                        {r.coverPath ? (
                            <Image src={r.coverPath} alt="Couverture" fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover" />
                        ) : (
                            <div className="grid h-full w-full place-items-center text-amber-400">
                                <ImageIcon className="h-10 w-10" />
                            </div>
                        )}
                        {/* Badge Archivé sur l'image */}
                        <div className="absolute left-2 top-2 rounded bg-amber-600 px-2 py-0.5 text-[11px] font-medium text-white">Archivé</div>
                    </div>

                    {/* Body (flex-1 pour pousser le footer en bas) */}
                    <div className="flex flex-1 flex-col p-4">
                        {/* Titre uniquement, avec hauteur min pour éviter les décalages */}
                        <h3 className="line-clamp-2 text-base font-semibold min-h-[2.75rem]">{r.title}</h3>

                        {/* Date d’archivage */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-4 w-4" />
                            <span>archivé {formatRelative(r.timestamps.deletedAt)}</span>
                        </div>

                        {/* Footer actions fixé en bas */}
                        <div className="mt-auto pt-3">
                            <div className="grid grid-cols-2 gap-2">
                                <RestorePostButton id={r.id} slug={r.slug} />
                                <DeleteArchivedPostButton id={r.id} slug={r.slug} className="w-full justify-center" />
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
