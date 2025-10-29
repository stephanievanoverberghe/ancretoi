// app/admin/programs/[slug]/page/page-editor.tsx

'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import Link from 'next/link';

/* ======================= Types ======================= */
type Level = 'Basique' | 'Cible' | 'Premium';
type Status = 'draft' | 'preflight' | 'published';

type Benefit = { icon?: string; title: string; text: string };
type QA = { q: string; a: string };
type Testimonial = { name: string; role?: string; text: string; avatar?: string };
type CurriculumItem = { label: string; summary?: string };

type PageForm = {
    programSlug: string;
    status: Status;

    hero: {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        ctaLabel?: string;
        ctaHref?: string;
        heroImage?: string;
    };

    card: {
        image?: string;
        tagline?: string;
        summary?: string;
        accentColor?: string;
    };

    meta: {
        durationDays?: number;
        estMinutesPerDay?: number;
        level?: Level;
        category?: string;
        tags?: string[];
        language?: string;
    };

    pageGarde?: {
        heading?: string;
        tagline?: string;
        format?: string;
        audience?: string;
        safetyNote?: string;
    } | null;

    intro: {
        finalite?: string;
        pourQui?: string;
        pasPourQui?: string;
        commentUtiliser?: string;
        cadreSecurite?: string;
    };

    conclusion: {
        texte?: string;
        kitEntretien?: string;
        cap7_14_30?: string;
        siCaDeraille?: string;
        allerPlusLoin?: string;
    };

    compare: {
        objectif?: string;
        charge?: string;
        idealSi?: string;
        cta?: string;
    };

    highlights: Benefit[];
    curriculum: CurriculumItem[];
    testimonials: Testimonial[];
    faq: QA[];

    seo: {
        title?: string;
        description?: string;
        image?: string;
    };
};

type ImageLike = { url?: string; alt?: string } | string | null | undefined;
type PgIncoming = Partial<{
    programSlug: string;
    status: Status;
    hero: {
        eyebrow?: string;
        title?: string;
        subtitle?: string;
        ctaLabel?: string;
        ctaHref?: string;
        heroImage?: ImageLike;
    } | null;
    card: {
        image?: ImageLike;
        tagline?: string;
        summary?: string;
        accentColor?: string;
    } | null;
    meta: {
        durationDays?: number | null;
        estMinutesPerDay?: number | null;
        level?: Level | null;
        category?: string | null;
        tags?: string[] | null;
        language?: string | null;
    } | null;

    pageGarde: {
        heading?: string;
        tagline?: string;
        format?: string;
        audience?: string;
        safetyNote?: string;
    } | null;

    intro?: PageForm['intro'] | null;
    conclusion?: PageForm['conclusion'] | null;

    compare?: {
        objectif?: string | null;
        charge?: string | null;
        idealSi?: string | null;
        ctaLabel?: string | null;
    } | null;

    highlights?: Benefit[] | null;
    curriculum?: (CurriculumItem | string)[] | null;
    testimonials?: Testimonial[] | null;
    faq?: QA[] | null;

    seo?: PageForm['seo'] | null;
}>;

/* ======================= Helpers ======================= */
function imageToUrl(img: ImageLike): string {
    if (!img) return '';
    return typeof img === 'string' ? img : img.url ?? '';
}
function toCurriculum(list: (CurriculumItem | string)[] | null | undefined): CurriculumItem[] {
    if (!Array.isArray(list)) return [];
    return list.map((it) => (typeof it === 'string' ? { label: it } : { label: it.label, summary: it.summary }));
}
function toTagsCsv(arr: string[] | undefined): string {
    return (arr ?? []).join(', ');
}
function csvToTags(csv: string): string[] {
    return csv
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

/* ======================= API guards ======================= */
type ApiOk = {
    ok: true;
    page: {
        programSlug: string;
        status?: Status;
    };
};
function isApiOk(x: unknown): x is ApiOk {
    return !!x && typeof x === 'object' && 'ok' in x && (x as { ok: unknown }).ok === true && 'page' in x;
}

type ApiErrorShape = { error?: unknown };
function hasError(x: unknown): x is ApiErrorShape {
    return !!x && typeof x === 'object' && 'error' in x;
}

/* ======================= UI atoms ======================= */
const cls = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--ink,#0f172a)]">
            {children} {required ? <span className="text-[var(--brand-600,#6D28D9)]">*</span> : null}
        </label>
    );
}
function Hint({ children }: { children: React.ReactNode }) {
    return <p className="text-[11px] text-gray-500 mt-1">{children}</p>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={cls(
                'w-full rounded-xl border bg-[var(--paper,#fff)] px-3 py-2',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-[var(--brand-600,#6D28D9)]/40 focus:border-[var(--brand-600,#6D28D9)]',
                'border-gray-200',
                props.className
            )}
        />
    );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={cls(
                'w-full rounded-xl border bg-[var(--paper,#fff)] px-3 py-2',
                'placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-[var(--brand-600,#6D28D9)]/40 focus:border-[var(--brand-600,#6D28D9)]',
                'border-gray-200',
                props.className
            )}
        />
    );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={cls(
                'w-full rounded-xl border bg-[var(--paper,#fff)] px-3 py-2',
                'focus:outline-none focus:ring-2 focus:ring-[var(--brand-600,#6D28D9)]/40 focus:border-[var(--brand-600,#6D28D9)]',
                'border-gray-200',
                props.className
            )}
        />
    );
}

function Badge({ state }: { state: 'done' | 'active' | 'idle' }) {
    const styleMap = {
        done: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        active: 'bg-[var(--brand-600,#6D28D9)]/10 text-[var(--brand-600,#6D28D9)] ring-[var(--brand-600,#6D28D9)]/20',
        idle: 'bg-gray-50 text-gray-600 ring-gray-200',
    } as const;
    const labelMap: Record<typeof state, string> = {
        done: 'fait',
        active: 'actif',
        idle: 'en attente',
    };
    return <span className={cls('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1', styleMap[state])}>{labelMap[state]}</span>;
}

function Accordion({ id, title, subtitle, defaultOpen = true, children }: { id: string; title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <section id={id} className="scroll-mt-24">
            <div className="rounded-2xl border border-gray-100 bg-[var(--paper,#fff)] ring-1 ring-black/5 shadow-sm">
                <button type="button" onClick={() => setOpen((o) => !o)} className="w-full rounded-2xl px-5 py-4 text-left hover:bg-gray-50/60" aria-expanded={open}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--ink,#0f172a)]">{title}</h2>
                            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
                        </div>
                        <span
                            className={cls(
                                'mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                                open ? 'rotate-180 border-gray-300' : 'border-gray-200'
                            )}
                        >
                            ▾
                        </span>
                    </div>
                </button>
                <div className={cls('grid overflow-hidden px-5 transition-all', open ? 'grid-rows-[1fr] py-4' : 'grid-rows-[0fr]')}>
                    <div className="min-h-0 space-y-3">{children}</div>
                </div>
            </div>
        </section>
    );
}

/* ======================= Component ======================= */
export default function ProgramPageEditor({ slug, initialPage }: { slug: string; initialPage: PgIncoming | null }) {
    const defaults: PageForm = {
        programSlug: slug,
        status: initialPage?.status ?? 'draft',
        hero: {
            eyebrow: initialPage?.hero?.eyebrow ?? '',
            title: initialPage?.hero?.title ?? '',
            subtitle: initialPage?.hero?.subtitle ?? '',
            ctaLabel: initialPage?.hero?.ctaLabel ?? '',
            ctaHref: initialPage?.hero?.ctaHref ?? '',
            heroImage: imageToUrl(initialPage?.hero?.heroImage),
        },
        card: {
            image: imageToUrl(initialPage?.card?.image),
            tagline: initialPage?.card?.tagline ?? '',
            summary: initialPage?.card?.summary ?? '',
            accentColor: initialPage?.card?.accentColor ?? '',
        },
        meta: {
            durationDays: initialPage?.meta?.durationDays ?? 7,
            estMinutesPerDay: initialPage?.meta?.estMinutesPerDay ?? 20,
            level: (initialPage?.meta?.level as Level) ?? 'Basique',
            category: initialPage?.meta?.category ?? 'wellbeing',
            tags: Array.isArray(initialPage?.meta?.tags) ? initialPage?.meta?.tags : [],
            language: initialPage?.meta?.language ?? 'fr',
        },
        pageGarde: {
            heading: initialPage?.pageGarde?.heading ?? initialPage?.hero?.title ?? '',
            tagline: initialPage?.pageGarde?.tagline ?? '',
            format: initialPage?.pageGarde?.format ?? '',
            audience: initialPage?.pageGarde?.audience ?? '',
            safetyNote: initialPage?.pageGarde?.safetyNote ?? '',
        },
        intro: {
            finalite: initialPage?.intro?.finalite ?? '',
            pourQui: initialPage?.intro?.pourQui ?? '',
            pasPourQui: initialPage?.intro?.pasPourQui ?? '',
            commentUtiliser: initialPage?.intro?.commentUtiliser ?? '',
            cadreSecurite: initialPage?.intro?.cadreSecurite ?? '',
        },
        conclusion: {
            texte: initialPage?.conclusion?.texte ?? '',
            kitEntretien: initialPage?.conclusion?.kitEntretien ?? '',
            cap7_14_30: initialPage?.conclusion?.cap7_14_30 ?? '',
            siCaDeraille: initialPage?.conclusion?.siCaDeraille ?? '',
            allerPlusLoin: initialPage?.conclusion?.allerPlusLoin ?? '',
        },
        compare: {
            objectif: initialPage?.compare?.objectif ?? initialPage?.card?.tagline ?? '',
            charge: initialPage?.compare?.charge ?? '',
            idealSi: initialPage?.compare?.idealSi ?? initialPage?.card?.summary ?? '',
            cta: initialPage?.compare?.ctaLabel ?? '',
        },
        highlights: initialPage?.highlights ?? [],
        curriculum: toCurriculum(initialPage?.curriculum),
        testimonials: initialPage?.testimonials ?? [],
        faq: initialPage?.faq ?? [],
        seo: {
            title: initialPage?.seo?.title ?? '',
            description: initialPage?.seo?.description ?? '',
            image: initialPage?.seo?.image ?? '',
        },
    };

    const form = useForm<PageForm>({ defaultValues: defaults, mode: 'onChange' });

    const highlights = useFieldArray<PageForm, 'highlights'>({ control: form.control, name: 'highlights' });
    const curriculum = useFieldArray<PageForm, 'curriculum'>({ control: form.control, name: 'curriculum' });
    const faq = useFieldArray<PageForm, 'faq'>({ control: form.control, name: 'faq' });
    const testimonials = useFieldArray<PageForm, 'testimonials'>({ control: form.control, name: 'testimonials' });

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [autosave, setAutosave] = useState(true);

    // tags CSV bind
    const tagsCsv = toTagsCsv(form.watch('meta.tags'));
    const onTagsChange = (v: string) => form.setValue('meta.tags', csvToTags(v), { shouldDirty: true });

    // progress (required core fields)
    const watchAll = form.watch();
    const completion = useMemo(() => {
        const checks = [
            !!watchAll?.hero?.title?.trim(),
            !!watchAll?.meta?.durationDays,
            !!watchAll?.meta?.estMinutesPerDay,
            !!watchAll?.meta?.level,
            !!watchAll?.seo?.title?.trim(),
        ];
        const done = checks.filter(Boolean).length;
        return Math.round((done / checks.length) * 100);
    }, [watchAll]);

    /* ===== Submit (useCallback pour deps propres) ===== */
    const onSubmit = useCallback(
        async (values: PageForm) => {
            try {
                setSaving(true);
                setErrorMsg(null);

                if (!values.hero.title || values.hero.title.trim().length === 0) {
                    throw new Error('Le titre (Hero) est requis.');
                }

                const payload = {
                    slug: values.programSlug.toLowerCase(),
                    title: values.hero.title.trim(),
                    status: values.status,
                    durationDays: Number(values.meta.durationDays ?? 7),
                    estMinutesPerDay: Number(values.meta.estMinutesPerDay ?? 20),
                    level: (values.meta.level ?? 'Basique') as Level,
                    category: values.meta.category?.trim() || 'wellbeing',
                    tags: values.meta.tags ?? [],
                    heroImageUrl: values.hero.heroImage?.trim() || undefined,
                    cardImageUrl: values.card.image?.trim() || undefined,
                    cardTagline: values.card.tagline?.trim() || undefined,
                    cardSummary: values.card.summary?.trim() || undefined,
                    accentColor: values.card.accentColor?.trim() || undefined,
                    objectif: values.compare.objectif?.trim() || undefined,
                    charge: values.compare.charge?.trim() || undefined,
                    ideal_si: values.compare.idealSi?.trim() || undefined,
                    cta: values.compare.cta?.trim() || undefined,
                };

                const r = await fetch('/api/admin/pages', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', accept: 'application/json' },
                    body: JSON.stringify(payload),
                });

                const ct = r.headers.get('content-type') || '';
                const data: unknown = ct.includes('application/json') ? await r.json() : await r.text();

                if (!r.ok) {
                    const msg = hasError(data) ? String(data.error ?? `Erreur HTTP ${r.status}`) : typeof data === 'string' ? data : `Erreur HTTP ${r.status}`;
                    throw new Error(msg);
                }

                if (!isApiOk(data)) throw new Error('Réponse inattendue du serveur.');

                setToast(autosave ? 'Sauvegardé automatiquement' : 'Page sauvegardée');
                setTimeout(() => setToast(null), 1400);
                form.reset(values); // clear dirty
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : String(e));
            } finally {
                setSaving(false);
            }
        },
        [autosave, form]
    );

    // autosave (debounced 900ms)
    const debRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!autosave) return;
        if (!form.formState.isDirty) return;

        if (debRef.current) clearTimeout(debRef.current);
        debRef.current = setTimeout(() => {
            void form.handleSubmit(onSubmit)();
        }, 900);

        return () => {
            if (debRef.current) clearTimeout(debRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchAll, autosave, onSubmit, form.formState.isDirty]); // inclure onSubmit pour react-hooks/exhaustive-deps

    // Cmd/Ctrl+S manual save
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                void form.handleSubmit(onSubmit)();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [form, onSubmit]);

    const sections = useMemo(
        () => [
            { id: 'meta', label: 'Meta', required: true, done: !!watchAll?.meta?.durationDays && !!watchAll?.meta?.estMinutesPerDay },
            { id: 'garde', label: 'Page de garde', done: !!watchAll?.pageGarde?.heading },
            { id: 'hero', label: 'Hero', required: true, done: !!watchAll?.hero?.title },
            { id: 'card', label: 'Card', done: !!watchAll?.card?.image || !!watchAll?.card?.summary },
            { id: 'compare', label: 'Comparateur', done: !!watchAll?.compare?.objectif || !!watchAll?.compare?.idealSi },
            { id: 'highlights', label: 'Bénéfices', done: (watchAll?.highlights?.length || 0) > 0 },
            { id: 'curriculum', label: 'Curriculum', done: (watchAll?.curriculum?.length || 0) > 0 },
            { id: 'intro', label: 'Introduction', done: !!watchAll?.intro?.finalite || !!watchAll?.intro?.pourQui },
            { id: 'conclusion', label: 'Conclusion', done: !!watchAll?.conclusion?.texte },
            { id: 'faq', label: 'FAQ', done: (watchAll?.faq?.length || 0) > 0 },
            { id: 'testimonials', label: 'Témoignages', done: (watchAll?.testimonials?.length || 0) > 0 },
            { id: 'seo', label: 'SEO', required: true, done: !!watchAll?.seo?.title },
        ],
        [watchAll]
    );

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-[230px,1fr,340px]">
            {/* ======= Sidebar (sommaire) ======= */}
            <aside className="top-24 hidden lg:sticky lg:block lg:self-start">
                <nav className="rounded-2xl border border-gray-100 bg-[var(--paper,#fff)] p-3 shadow-sm ring-1 ring-black/5">
                    <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</div>
                    <ul className="space-y-1">
                        {sections.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className={cls(
                                        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                                        'hover:bg-[var(--brand-600,#6D28D9)]/10 hover:text-[var(--brand-600,#6D28D9)]',
                                        s.required && !s.done ? 'text-gray-800' : 'text-gray-700'
                                    )}
                                >
                                    <span className="truncate">{s.label}</span>
                                    <span>{s.done ? <Badge state="done" /> : s.required ? <Badge state="active" /> : <Badge state="idle" />}</span>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900">
                        <div className="mb-1 font-semibold">Astuces</div>
                        <div>• ⌘/Ctrl + S pour enregistrer</div>
                        <div>• L’autosave est {autosave ? 'activé' : 'désactivé'}</div>
                    </div>
                </nav>
            </aside>

            {/* ======= Main form ======= */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Command Bar sticky */}
                <div className="sticky top-0 z-30 -mx-1 bg-gradient-to-b from-[var(--paper,#fff)] to-[var(--paper,#fff)]/95 px-1 py-3 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs text-gray-500">Programme</div>
                            <div className="truncate font-semibold text-[var(--ink,#0f172a)]">{slug}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1">
                                <span className="text-xs text-gray-500">Autosave</span>
                                <button
                                    type="button"
                                    onClick={() => setAutosave((v) => !v)}
                                    className={cls('relative h-6 w-10 rounded-full transition', autosave ? 'bg-[var(--brand-600,#6D28D9)]' : 'bg-gray-300')}
                                    aria-pressed={autosave}
                                >
                                    <span className={cls('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', autosave ? 'left-5' : 'left-0.5')} />
                                </button>
                            </div>

                            <Select {...form.register('status')}>
                                <option value="draft">draft</option>
                                <option value="preflight">preflight</option>
                                <option value="published">published</option>
                            </Select>

                            <button
                                type="submit"
                                disabled={saving}
                                className={cls(
                                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white shadow-sm transition',
                                    'bg-[var(--brand-600,#6D28D9)] hover:brightness-110 disabled:opacity-60'
                                )}
                            >
                                {saving ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
                                        Enregistrement…
                                    </>
                                ) : (
                                    <>Enregistrer</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-600,#6D28D9)] to-amber-500 transition-[width]"
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                        <div className="text-xs tabular-nums text-gray-600">{completion}%</div>
                        <div className="text-xs">
                            {saving ? (
                                <span className="text-gray-500">Sauvegarde…</span>
                            ) : form.formState.isDirty ? (
                                <span className="text-amber-700">Modifs non enregistrées</span>
                            ) : (
                                <span className="text-emerald-700">À jour</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* META */}
                <Accordion id="meta" title="Meta" subtitle="Durées, charge et classification." defaultOpen>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <Label required>Jours</Label>
                            <Input type="number" min={1} max={365} {...form.register('meta.durationDays', { valueAsNumber: true })} placeholder="7" />
                        </div>
                        <div>
                            <Label required>Minutes / jour</Label>
                            <Input type="number" min={1} max={180} {...form.register('meta.estMinutesPerDay', { valueAsNumber: true })} placeholder="20" />
                        </div>
                        <div>
                            <Label>Niveau</Label>
                            <Select {...form.register('meta.level')} defaultValue="Basique">
                                <option value="Basique">Basique</option>
                                <option value="Cible">Cible</option>
                                <option value="Premium">Premium</option>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <Label>Catégorie</Label>
                            <Input {...form.register('meta.category')} placeholder="wellbeing" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Tags</Label>
                            <Input value={tagsCsv} onChange={(e) => onTagsChange(e.target.value)} placeholder="respiration, routine, 7j" />
                            <Hint>Sépare par des virgules.</Hint>
                        </div>
                    </div>
                </Accordion>

                {/* PAGE DE GARDE */}
                <Accordion id="garde" title="Page de garde" subtitle="Accroches et contexte d’usage.">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>Titre principal</Label>
                            <Input {...form.register('pageGarde.heading')} placeholder="RESET-7" />
                        </div>
                        <div>
                            <Label>Tagline</Label>
                            <Input {...form.register('pageGarde.tagline')} placeholder="7 jours pour…" />
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>Format</Label>
                            <Input {...form.register('pageGarde.format')} placeholder="1 rdv/jour …" />
                        </div>
                        <div>
                            <Label>Audience</Label>
                            <Input {...form.register('pageGarde.audience')} placeholder="Freelances, soignants…" />
                        </div>
                    </div>
                    <div>
                        <Label>Note sécurité</Label>
                        <Textarea {...form.register('pageGarde.safetyNote')} placeholder="Conseils & précautions…" />
                    </div>
                </Accordion>

                {/* HERO */}
                <Accordion id="hero" title="Hero" subtitle="Titre, sous-titre, CTA et image.">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>Eyebrow</Label>
                            <Input {...form.register('hero.eyebrow')} placeholder="Mini-label" />
                        </div>
                        <div>
                            <Label required>Titre</Label>
                            <Input {...form.register('hero.title', { required: true })} placeholder="Titre affiché dans le hero" />
                        </div>
                    </div>
                    <div>
                        <Label>Sous-titre</Label>
                        <Textarea {...form.register('hero.subtitle')} placeholder="Sous-titre" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>CTA Label</Label>
                            <Input {...form.register('hero.ctaLabel')} placeholder="Commencer maintenant" />
                        </div>
                        <div>
                            <Label>CTA Href</Label>
                            <Input {...form.register('hero.ctaHref')} placeholder="/checkout/reset-7" />
                        </div>
                    </div>
                    <div>
                        <Label>Hero image</Label>
                        <Input {...form.register('hero.heroImage')} placeholder="/images/..." />
                    </div>
                </Accordion>

                {/* CARD */}
                <Accordion id="card" title="Card (catalogue)" subtitle="Visuel catalogue et résumé court.">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>Image</Label>
                            <Input {...form.register('card.image')} placeholder="/images/..." />
                        </div>
                        <div>
                            <Label>Couleur d’accent</Label>
                            <Input {...form.register('card.accentColor')} placeholder="#6D28D9" />
                        </div>
                    </div>
                    <div>
                        <Label>Tagline courte</Label>
                        <Input {...form.register('card.tagline')} placeholder="7 jours pour…" />
                    </div>
                    <div>
                        <Label>Résumé court</Label>
                        <Input {...form.register('card.summary')} placeholder="Un mini-parcours pour…" />
                    </div>
                </Accordion>

                {/* COMPARATEUR */}
                <Accordion id="compare" title="Comparateur" subtitle="Positionnement et appel.">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <Label>Objectif</Label>
                            <Input {...form.register('compare.objectif')} placeholder="Réinitialiser ton rythme" />
                        </div>
                        <div>
                            <Label>Charge/jour</Label>
                            <Input {...form.register('compare.charge')} placeholder="10–15 min/j" />
                        </div>
                    </div>
                    <div>
                        <Label>Idéal si…</Label>
                        <Input {...form.register('compare.idealSi')} placeholder="Tu veux poser 3 micro-rituels tenables" />
                    </div>
                    <div>
                        <Label>CTA (facultatif)</Label>
                        <Input {...form.register('compare.cta')} placeholder="Voir RESET-7" />
                    </div>
                </Accordion>

                {/* BÉNÉFICES */}
                <Accordion id="highlights" title="Bénéfices">
                    {highlights.fields.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Aucun bénéfice. Ajoute-en un.</div>}
                    {highlights.fields.map((f, i) => (
                        <div key={f.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-3">
                            <div>
                                <Label>Icon/emoji</Label>
                                <Input {...form.register(`highlights.${i}.icon`)} placeholder="✨" />
                            </div>
                            <div>
                                <Label required>Titre</Label>
                                <Input {...form.register(`highlights.${i}.title`, { required: true })} placeholder="Ce que tu gagnes" />
                            </div>
                            <div>
                                <Label required>Texte</Label>
                                <Input {...form.register(`highlights.${i}.text`, { required: true })} placeholder="En une phrase claire" />
                            </div>

                            <div className="md:col-span-3 flex justify-end gap-2">
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => i > 0 && highlights.swap(i, i - 1)}>
                                    ↑ Monter
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                                    onClick={() => i < highlights.fields.length - 1 && highlights.swap(i, i + 1)}
                                >
                                    ↓ Descendre
                                </button>
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => highlights.remove(i)}>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="button" className="rounded-xl bg-gray-100 px-3 py-1 hover:bg-gray-200" onClick={() => highlights.append({ title: '', text: '' })}>
                            + Ajouter
                        </button>
                    </div>
                </Accordion>

                {/* CURRICULUM */}
                <Accordion id="curriculum" title="Curriculum (J1 → Jn)">
                    {curriculum.fields.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Aucun jour. Ajoute-en un.</div>}
                    {curriculum.fields.map((f, i) => (
                        <div key={f.id} className="grid gap-3 md:grid-cols-2">
                            <div>
                                <Label required>Libellé</Label>
                                <Input {...form.register(`curriculum.${i}.label`, { required: true })} placeholder={`Jour ${i + 1} — libellé`} />
                            </div>
                            <div>
                                <Label>Résumé</Label>
                                <Input {...form.register(`curriculum.${i}.summary`)} placeholder="Facultatif" />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-2">
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => i > 0 && curriculum.swap(i, i - 1)}>
                                    ↑ Monter
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                                    onClick={() => i < curriculum.fields.length - 1 && curriculum.swap(i, i + 1)}
                                >
                                    ↓ Descendre
                                </button>
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => curriculum.remove(i)}>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="button" className="rounded-xl bg-gray-100 px-3 py-1 hover:bg-gray-200" onClick={() => curriculum.append({ label: '' })}>
                            + Ajouter jour
                        </button>
                    </div>
                </Accordion>

                {/* INTRO */}
                <Accordion id="intro" title="Introduction">
                    <Textarea {...form.register('intro.finalite')} placeholder="Finalité (md)" />
                    <Textarea {...form.register('intro.pourQui')} placeholder="Pour qui (md)" />
                    <Textarea {...form.register('intro.pasPourQui')} placeholder="Pas pour qui (md)" />
                    <Textarea {...form.register('intro.commentUtiliser')} placeholder="Comment l’utiliser (md)" />
                    <Textarea {...form.register('intro.cadreSecurite')} placeholder="Cadre & sécurité (md)" />
                </Accordion>

                {/* CONCLUSION */}
                <Accordion id="conclusion" title="Conclusion">
                    <Textarea {...form.register('conclusion.texte')} placeholder="Texte (md)" />
                    <Textarea {...form.register('conclusion.kitEntretien')} placeholder="Kit d’entretien (md)" />
                    <Textarea {...form.register('conclusion.cap7_14_30')} placeholder="Cap 7–14–30 (md)" />
                    <Textarea {...form.register('conclusion.siCaDeraille')} placeholder="Si ça déraille (md)" />
                    <Textarea {...form.register('conclusion.allerPlusLoin')} placeholder="Aller plus loin (md)" />
                </Accordion>

                {/* FAQ */}
                <Accordion id="faq" title="FAQ">
                    {faq.fields.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Aucune question. Ajoute-en une.</div>}
                    {faq.fields.map((f, i) => (
                        <div key={f.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-2">
                            <div>
                                <Label required>Question</Label>
                                <Input {...form.register(`faq.${i}.q`, { required: true })} placeholder="Question" />
                            </div>
                            <div>
                                <Label required>Réponse</Label>
                                <Input {...form.register(`faq.${i}.a`, { required: true })} placeholder="Réponse" />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => faq.remove(i)}>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="button" className="rounded-xl bg-gray-100 px-3 py-1 hover:bg-gray-200" onClick={() => faq.append({ q: '', a: '' })}>
                            + Ajouter
                        </button>
                    </div>
                </Accordion>

                {/* TÉMOIGNAGES */}
                <Accordion id="testimonials" title="Témoignages">
                    {testimonials.fields.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">Aucun témoignage.</div>}
                    {testimonials.fields.map((f, i) => (
                        <div key={f.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-4">
                            <div>
                                <Label required>Nom</Label>
                                <Input {...form.register(`testimonials.${i}.name`, { required: true })} placeholder="Nom" />
                            </div>
                            <div>
                                <Label>Rôle</Label>
                                <Input {...form.register(`testimonials.${i}.role`)} placeholder="Rôle" />
                            </div>
                            <div className="md:col-span-2">
                                <Label required>Texte</Label>
                                <Input {...form.register(`testimonials.${i}.text`, { required: true })} placeholder="Texte" />
                            </div>
                            <div className="md:col-span-4">
                                <Label>Avatar URL</Label>
                                <Input {...form.register(`testimonials.${i}.avatar`)} placeholder="/images/..." />
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                                <button type="button" className="rounded-lg border px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => testimonials.remove(i)}>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="button" className="rounded-xl bg-gray-100 px-3 py-1 hover:bg-gray-200" onClick={() => testimonials.append({ name: '', text: '' })}>
                            + Ajouter
                        </button>
                    </div>
                </Accordion>

                {/* SEO */}
                <Accordion id="seo" title="SEO" subtitle="Titre, description et image de partage.">
                    <div className="grid gap-3">
                        <div>
                            <Label>SEO Title</Label>
                            <Input {...form.register('seo.title')} placeholder="Titre SEO" />
                        </div>
                        <div>
                            <Label>SEO Description</Label>
                            <Input {...form.register('seo.description')} placeholder="Entre 50 et 160 caractères" />
                        </div>
                        <div>
                            <Label>SEO Image URL</Label>
                            <Input {...form.register('seo.image')} placeholder="/images/seo.jpg" />
                        </div>
                    </div>
                </Accordion>

                <input type="hidden" name="programSlug" value={slug} />

                {/* Erreur inline */}
                {errorMsg ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMsg}</div> : null}
            </form>

            {/* ======= Right Preview ======= */}
            <aside className="top-24 hidden lg:sticky lg:block lg:self-start">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Aperçu — Hero</div>
                        <div
                            className="rounded-xl p-6 text-white"
                            style={{
                                background: 'linear-gradient(135deg,var(--brand-600,#6D28D9), rgba(255, 191, 0, .8))',
                            }}
                        >
                            <div className="text-xs opacity-80">{watchAll?.hero?.eyebrow || 'Eyebrow'}</div>
                            <div className="mt-1 text-lg font-bold">{watchAll?.hero?.title || 'Titre du programme'}</div>
                            <div className="mt-1 text-sm opacity-90">{watchAll?.hero?.subtitle || 'Sous-titre inspirant…'}</div>
                            <div className="mt-3">
                                <span className="inline-block rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-[var(--brand-600,#6D28D9)]">
                                    {watchAll?.hero?.ctaLabel || 'Appel à l’action'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Aperçu — Card</div>
                        <div className="flex gap-3">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
                                {watchAll?.card?.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={watchAll.card.image!} alt="" className="h-full w-full object-cover" />
                                ) : null}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{watchAll?.pageGarde?.heading || watchAll?.hero?.title || 'Titre'}</div>
                                <div className="truncate text-xs text-gray-600">{watchAll?.card?.tagline || 'Tagline courte'}</div>
                                <div className="mt-1 line-clamp-2 text-xs text-gray-500">{watchAll?.card?.summary || 'Résumé court…'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Liens utiles</div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/programs/${slug}`} className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50">
                                Voir la landing
                            </Link>
                            <Link href={`/admin/programs/${slug}/units`} className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50">
                                Gérer les unités
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Toast */}
            {toast ? (
                <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4">
                    <div className="pointer-events-auto rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow">{toast}</div>
                </div>
            ) : null}
        </div>
    );
}
