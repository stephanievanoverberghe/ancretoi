'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ResumeLink({ programSlug }: { programSlug: string }) {
    const [href, setHref] = useState(`/member/${programSlug}/day/1`);
    useEffect(() => {
        const last = Number(localStorage.getItem(`${programSlug}:lastDay`) || '1');
        if (Number.isInteger(last) && last >= 1 && last <= 365) {
            setHref(`/member/${programSlug}/day/${last}`);
        }
    }, [programSlug]);

    return (
        <div className="mt-3">
            <Link href={href} className="inline-block rounded-md border px-3 py-2 hover:bg-gray-50">
                Resume
            </Link>
        </div>
    );
}
