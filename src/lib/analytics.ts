// lib/analytics.ts
export type AnalyticsProps = Record<string, unknown>;

export function track(name: string, props?: AnalyticsProps): void {
    if (typeof window === 'undefined') return;
    window.plausible?.(name, { props });
    window.posthog?.capture(name, props);
}
