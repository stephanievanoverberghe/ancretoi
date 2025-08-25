// types/ambient.d.ts
declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> } | undefined) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown> | undefined) => void };
    }
}
export {};
