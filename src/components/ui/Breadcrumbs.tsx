'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type Crumb = {
    label: string;
    href?: string; // si pas de lien, c’est la page courante
};

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    return (
                        <li key={i} className="flex items-center gap-1">
                            {item.href && !isLast ? (
                                <Link href={item.href} className="transition-colors hover:text-foreground">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={`font-medium ${isLast ? 'text-brand-600' : 'text-foreground/80'}`}>{item.label}</span>
                            )}
                            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
