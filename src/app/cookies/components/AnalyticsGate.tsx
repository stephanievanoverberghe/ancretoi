'use client';

import { useEffect } from 'react';
import { readConsentCookieClient } from '@/lib/consent';

export default function AnalyticsGate() {
    useEffect(() => {
        const consent = readConsentCookieClient();
        if (!consent?.analytics) return;

        const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
        if (!GA_ID) return;

        // gtag loader
        const s1 = document.createElement('script');
        s1.async = true;
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(s1);

        const s2 = document.createElement('script');
        s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { anonymize_ip: true });
    `;
        document.head.appendChild(s2);

        return () => {
            // Optionnel : cleanup si tu veux retirer les scripts (rarement nécessaire en SPA)
        };
    }, []);

    return null;
}
