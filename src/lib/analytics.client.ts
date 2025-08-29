export type AnalyticsProps = Record<string, unknown>;

// petit d.ts implicite pour TS (optionnel)
declare global {
    interface Window {
        plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (name: string, props?: Record<string, unknown>) => void };
    }
}

export function track(name: string, props?: AnalyticsProps): void {
    if (typeof window === 'undefined') return;
    window.plausible?.(name, { props });
    window.posthog?.capture?.(name, props);
}
