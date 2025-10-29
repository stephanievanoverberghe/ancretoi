// src/app/admin/inspirations/archives/components/AdminInspirationsArchivedGrid.tsx
'use client';

import Image from 'next/image';
import RestoreInspirationButton from './RestoreInspirationButton';
import { PlayCircle, CalendarClock } from 'lucide-react';
import DeleteInspirationButton from '@/components/admin/DeleteInspirationButton';

type Row = {
    id: string;
    slug: string;
    status: 'draft' | 'published';
    title: string;
    videoUrl: string | null;
    summary: string | null;
    tags: string[];
    timestamps: { createdAt: string | null; updatedAt: string | null; deletedAt?: string | null };
};

function videoThumb(videoUrl: string | null): { src: string | null; alt: string } {
    if (!videoUrl) return { src: null, alt: 'Aucun visuel' };
    try {
        const yt = new URL(videoUrl);
        if (['www.youtube.com', 'youtube.com'].includes(yt.hostname)) {
            const id = yt.searchParams.get('v');
            if (id) return { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: 'Miniature YouTube' };
        }
        if (yt.hostname === 'youtu.be') {
            const id = yt.pathname.replace('/', '');
            if (id) return { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: 'Miniature YouTube' };
        }
        return { src: null, alt: 'Aucun visuel' };
    } catch {
        return { src: null, alt: 'Aucun visuel' };
    }
}

function formatRelative(iso: string | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR');
}

export default function AdminInspirationsArchivedGrid({ rows }: { rows: Row[] }) {
    if (!rows.length) {
        return (
            <div className="rounded-2xl border border-amber-400/40 p-8 text-center">
                <p className="text-sm text-gray-600">Aucune archive.</p>
            </div>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
                const thumb = videoThumb(r.videoUrl);
                return (
                    <li key={r.id} className="group overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                        <div className="relative aspect-[16/10] w-full bg-amber-50">
                            {thumb.src ? (
                                <Image src={thumb.src} alt={thumb.alt} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px" className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-amber-400">
                                    <PlayCircle className="h-10 w-10" />
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
                                <RestoreInspirationButton slug={r.slug} />
                                {/* Supprimer à nouveau != hard delete ; garde ton bouton Soft */}
                                <DeleteInspirationButton slug={r.slug} className="w-full justify-center" afterDelete="refresh" />
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
