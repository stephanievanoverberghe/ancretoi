'use client';

import Link from 'next/link';

export default function CookieBannerTrigger() {
    return (
        <Link href="/cookies/preferences" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
            Préférences cookies
        </Link>
    );
}
