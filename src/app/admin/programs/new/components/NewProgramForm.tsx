'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { ChevronDown, GripVertical, Copy, Trash2, MoveUp, MoveDown, Film, Plus } from 'lucide-react';

/* ========= Types ========= */
type Level = 'Basique' | 'Cible' | 'Premium';

type DayBlock = {
    title: string;
    videoUrl: string; // requis
    mantra?: string;
    description?: string;
};

type Benefit = { icon?: string; title: string; text: string };
type QA = { q: string; a: string };

type Marketing = {
    hero: { title: string; subtitle?: string; ctaHref?: string; heroImage?: string };
    benefits: Benefit[]; // 0..3
    faq?: QA[]; // optionnel
    seo?: { title?: string; description?: string; image?: string };
    /* nouveaux champs */
    objective?: string; // Objectif du programme (résumé)
    durationLabel?: string; // "7 jours • 20–30 min/j"
    idealIf?: string; // “Idéal si…”
};

type NewProgramFormShape = {
    slug: string;
    title: string;
    status: 'draft' | 'preflight' | 'published';
    level: Level;
    durationDays: number;
    estMinutesPerDay: number;
    priceCents?: number | null;
    marketing: Marketing;
    days: DayBlock[];
};

/* ========= UI helpers ========= */
const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="text-sm font-medium text-slate-900">
        {children} {required && <span className="text-brand-700">*</span>}
    </label>
);
const Help = ({ children }: { children: React.ReactNode }) => <p className="mt-1 text-[11px] text-gray-500">{children}</p>;

function InputPill(p: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className, type, ...rest } = p;
    return (
        <input
            {...rest}
            type={type}
            className={cls(
                'w-full rounded-full border border-brand-300 bg-white px-3 py-2 text-sm shadow-inner',
                'placeholder:text-gray-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                type === 'number' && '[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                className
            )}
        />
    );
}

function TextareaSoft(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { className, ...rest } = p;
    return (
        <textarea
            {...rest}
            className={cls(
                'w-full min-h-[96px] rounded-2xl border border-brand-300 bg-white px-3 py-2 text-sm shadow-inner',
                'placeholder:text-gray-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                className
            )}
        />
    );
}

function SelectPill(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { className, ...rest } = p;
    return (
        <div className="relative">
            <select
                {...rest}
                className={cls(
                    'w-full appearance-none rounded-full border border-brand-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-800 shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    className
                )}
            />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
    );
}

function Button(p: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
    const { variant = 'primary', className, ...rest } = p;
    const map = {
        primary: 'bg-brand-600 text-white hover:brightness-110',
        secondary: 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100',
        ghost: 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
    } as const;
    return <button {...rest} className={cls('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm', map[variant], className)} />;
}

const Card = ({ children }: { children: React.ReactNode }) => <section className="rounded-2xl border border-brand-200 bg-white p-4 md:p-5 shadow-sm">{children}</section>;

/* ========= Slug & thumbs ========= */
function slugify(s: string) {
    return (s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function ytId(url: string) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
        if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    } catch {}
    return null;
}
function vimeoId(url: string) {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('vimeo.com')) return null;
        const p = u.pathname.split('/').filter(Boolean);
        return p.pop() ?? null;
    } catch {}
    return null;
}
function Thumb({ url }: { url: string }) {
    const y = ytId(url),
        v = vimeoId(url);
    if (!url) return <div className="text-xs text-gray-500">Aperçu vidéo</div>;
    if (y)
        return (
            <div className="relative h-24 w-full overflow-hidden rounded-lg border">
                <Image src={`https://i.ytimg.com/vi/${y}/hqdefault.jpg`} alt="YouTube" fill sizes="200px" className="object-cover" unoptimized />
            </div>
        );
    if (v)
        return (
            <div className="relative h-24 w-full overflow-hidden rounded-lg border">
                <Image src={`https://vumbnail.com/${v}.jpg`} alt="Vimeo" fill sizes="200px" className="object-cover" unoptimized />
            </div>
        );
    return <div className="text-xs text-gray-500">MP4 : pas de miniature</div>;
}
function providerFromUrl(url: string) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) return 'YouTube';
        if (u.hostname.includes('vimeo')) return 'Vimeo';
        if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return 'MP4';
    } catch {}
    return 'Lien';
}
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-100 to-amber-100 px-2.5 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-200/60">
            {children}
        </span>
    );
}
function IconButton({ onClick, title, children, className, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            type="button"
            disabled={disabled}
            className={cls(
                'inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40',
                className
            )}
        >
            {children}
        </button>
    );
}

/* ========= Defaults ========= */
const DEFAULT: NewProgramFormShape = {
    slug: '',
    title: '',
    status: 'draft',
    level: 'Basique',
    durationDays: 7,
    estMinutesPerDay: 20,
    priceCents: 4700,
    marketing: {
        hero: { title: '' },
        benefits: [],
        faq: [],
        seo: {},
        objective: '',
        durationLabel: '',
        idealIf: '',
    },
    days: [],
};

/* ========= Component ========= */
type TabKey = 'identite' | 'marketing' | 'pedago' | 'seo';

export default function NewProgramForm() {
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>('identite');

    const { register, control, handleSubmit, watch, setValue, formState } = useForm<NewProgramFormShape>({
        defaultValues: DEFAULT,
        mode: 'onChange',
    });
    const benefits = useFieldArray({ control, name: 'marketing.benefits' });
    const faq = useFieldArray({ control, name: 'marketing.faq' });
    const days = useFieldArray({ control, name: 'days' });

    const all = watch();
    const completion = useMemo(() => {
        const checks = [!!all.slug?.trim(), !!all.title?.trim(), !!all.marketing.hero.title?.trim(), all.days.length > 0];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }, [all]);

    const onTitleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
        if (!watch('slug')) setValue('slug', slugify(e.currentTarget.value));
        if (!watch('marketing.hero.title')) setValue('marketing.hero.title', e.currentTarget.value);
    };

    const [activeDay, setActiveDay] = useState<number>(0);

    const addDay = () => {
        const nextIndex = days.fields.length + 1;
        days.append({ title: `J${nextIndex}`, videoUrl: '' });
        setActiveDay(days.fields.length);
    };
    const duplicateDay = (i: number) => {
        const dayNum = i + 1;
        days.insert(i + 1, {
            title: `J${dayNum + 1}`,
            videoUrl: watch(`days.${i}.videoUrl`) || '',
            mantra: watch(`days.${i}.mantra`) || '',
            description: watch(`days.${i}.description`) || '',
        });
        setActiveDay(i + 1);
    };
    const moveUp = (i: number) => {
        if (i === 0) return;
        days.move(i, i - 1);
        setActiveDay(i - 1);
    };
    const moveDown = (i: number) => {
        if (i >= days.fields.length - 1) return;
        days.move(i, i + 1);
        setActiveDay(i + 1);
    };
    const removeDay = (i: number) => {
        days.remove(i);
        setActiveDay((prev) => Math.max(0, Math.min(prev, days.fields.length - 2)));
    };

    const onSubmit: SubmitHandler<NewProgramFormShape> = async (values) => {
        try {
            setSaving(true);
            setErr(null);

            const payload = { ...values, slug: slugify(values.slug) };
            const r = await fetch('/api/admin/programs/create', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const ct = r.headers.get('content-type') ?? '';
            const data: unknown = ct.includes('application/json') ? await r.json() : await r.text();

            if (!r.ok) {
                const message =
                    typeof data === 'string'
                        ? data
                        : typeof data === 'object' && data && 'error' in (data as Record<string, unknown>) && typeof (data as Record<string, unknown>).error === 'string'
                        ? (data as { error: string }).error
                        : `Erreur HTTP ${r.status}`;
                throw new Error(message);
            }

            setToast('Formation créée ✅');
            setTimeout(() => setToast(null), 1000);
            window.location.assign(`/admin/programs?created=1&slug=${encodeURIComponent(payload.slug)}`);
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'save_failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Command bar */}
            <div className="sticky top-0 z-30 -mx-1 bg-white/95 px-1 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs text-gray-500">Nouveau programme</div>
                        <div className="truncate font-semibold">{watch('title') || 'Sans titre'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SelectPill {...register('status')}>
                            <option value="draft">Brouillon</option>
                            <option value="preflight">Pré-vol</option>
                            <option value="published">Publié</option>
                        </SelectPill>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Création…' : 'Créer'}
                        </Button>
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-amber-500 transition-[width]" style={{ width: `${completion}%` }} />
                    </div>
                    <div className="text-xs tabular-nums text-gray-600">{completion}%</div>
                    <div className="text-xs">{formState.isDirty ? <span className="text-amber-700">Modifs en cours</span> : <span className="text-emerald-700">À jour</span>}</div>
                </div>

                {/* Tabs */}
                <div className="mt-3 rounded-xl border border-brand-200 bg-gray-50 p-1 text-sm">
                    <div className="grid grid-cols-4 gap-1">
                        {(
                            [
                                { k: 'identite', label: 'Identité' },
                                { k: 'marketing', label: 'Marketing' },
                                { k: 'pedago', label: 'Pédagogie' },
                                { k: 'seo', label: 'SEO' },
                            ] as const
                        ).map((t) => (
                            <button
                                key={t.k}
                                type="button"
                                onClick={() => setTab(t.k)}
                                className={cls(
                                    'rounded-lg px-3 py-2 transition',
                                    tab === t.k ? 'bg-white text-brand-700 shadow ring-1 ring-brand-200' : 'text-gray-700 hover:bg-white cursor-pointer'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== PANELS ===== */}
            {tab === 'identite' && (
                <Card>
                    <h2 className="font-semibold mb-3">Identité & Prix</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div>
                            <Label required>Slug</Label>
                            <InputPill {...register('slug', { required: true })} placeholder="reset-7" />
                        </div>
                        <div>
                            <Label required>Titre</Label>
                            <InputPill {...register('title', { required: true })} onBlur={onTitleBlur} placeholder="RESET-7" />
                        </div>
                        <div>
                            <Label>Niveau</Label>
                            <SelectPill {...register('level')}>
                                <option>Basique</option>
                                <option>Cible</option>
                                <option>Premium</option>
                            </SelectPill>
                        </div>
                        <div>
                            <Label>Jours</Label>
                            <InputPill type="number" min={1} max={365} {...register('durationDays', { valueAsNumber: true })} />
                        </div>
                        <div>
                            <Label>Minutes / jour</Label>
                            <InputPill type="number" min={1} max={180} {...register('estMinutesPerDay', { valueAsNumber: true })} />
                        </div>
                        <div>
                            <Label>Prix TTC (cents)</Label>
                            <InputPill type="number" {...register('priceCents', { valueAsNumber: true })} placeholder="4700" />
                        </div>
                    </div>
                </Card>
            )}

            {tab === 'marketing' && (
                <Card>
                    <h2 className="font-semibold mb-3">Marketing</h2>

                    {/* Hero */}
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <Label required>Hero • Titre</Label>
                            <InputPill {...register('marketing.hero.title', { required: true })} placeholder="7 jours pour..." />
                        </div>
                        <div>
                            <Label>Hero • CTA href</Label>
                            <InputPill {...register('marketing.hero.ctaHref')} placeholder="/checkout/reset-7" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Hero • Sous-titre</Label>
                            <TextareaSoft {...register('marketing.hero.subtitle')} placeholder="L’accroche qui donne envie." />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Hero • Image URL</Label>
                            <InputPill {...register('marketing.hero.heroImage')} placeholder="/images/hero.jpg" />
                        </div>
                    </div>

                    {/* Infos clés */}
                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <Label>Objectif du programme</Label>
                            <TextareaSoft {...register('marketing.objective')} placeholder="Ex. Retrouver clarté, énergie et limites saines en 7 jours…" />
                        </div>
                        <div>
                            <Label>Durée (libellé affiché)</Label>
                            <InputPill {...register('marketing.durationLabel')} placeholder="7 jours • 20–30 min/j" />
                            <Help>Laisse vide pour déduire depuis “Jours” + “Minutes/jour”.</Help>
                        </div>
                        <div>
                            <Label>Idéal si…</Label>
                            <TextareaSoft {...register('marketing.idealIf')} placeholder="Tu te sens épuisée, tu n’arrives plus à dire non, tu veux reprendre souffle…" />
                        </div>
                    </div>

                    {/* Bénéfices (max 3) */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <Label>Bénéfices (max 3)</Label>
                            {benefits.fields.length < 3 && (
                                <Button type="button" variant="secondary" onClick={() => benefits.append({ title: '', text: '' })}>
                                    + Ajouter
                                </Button>
                            )}
                        </div>
                        {benefits.fields.length === 0 && <div className="mt-2 rounded-xl border border-dashed p-4 text-sm text-gray-500">Ajoute 1 à 3 bénéfices clés.</div>}
                        <ul className="mt-2 space-y-2">
                            {benefits.fields.map((f, i) => (
                                <li key={f.id} className="grid md:grid-cols-3 gap-2 border rounded-xl p-3">
                                    <InputPill placeholder="✨" {...register(`marketing.benefits.${i}.icon`)} />
                                    <InputPill placeholder="Titre" {...register(`marketing.benefits.${i}.title`, { required: true })} />
                                    <InputPill placeholder="Texte" {...register(`marketing.benefits.${i}.text`, { required: true })} />
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button type="button" variant="ghost" onClick={() => benefits.remove(i)}>
                                            Supprimer
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* FAQ */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <Label>FAQ (optionnelle)</Label>
                            <Button type="button" variant="secondary" onClick={() => faq.append({ q: '', a: '' })}>
                                + Ajouter
                            </Button>
                        </div>
                        {faq.fields.length === 0 && (
                            <div className="mt-2 rounded-xl border border-dashed p-4 text-sm text-gray-500">Ajoute des réponses aux objections si besoin.</div>
                        )}
                        <ul className="mt-2 space-y-2">
                            {faq.fields.map((f, i) => (
                                <li key={f.id} className="grid md:grid-cols-2 gap-2 border rounded-xl p-3">
                                    <InputPill placeholder="Question" {...register(`marketing.faq.${i}.q`, { required: true })} />
                                    <InputPill placeholder="Réponse" {...register(`marketing.faq.${i}.a`, { required: true })} />
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button type="button" variant="ghost" onClick={() => faq.remove(i)}>
                                            Supprimer
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            )}

            {tab === 'pedago' && (
                <Card>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Pédagogie</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Onglets par jour. Actions rapides et preview intégrée.</p>
                        </div>
                    </div>

                    {days.fields.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500 text-center">
                            Aucun jour pour l’instant.
                            <div className="mt-3">
                                <Button variant="secondary" onClick={addDay}>
                                    <Plus className="h-4 w-4" /> Ajouter le J1
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-[260px,1fr] gap-4">
                            {/* Onglets jours */}
                            <aside className="rounded-2xl border border-border bg-card p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Jours</div>
                                    <button
                                        type="button"
                                        onClick={addDay}
                                        className="inline-flex items-center gap-1 text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                                        title="Ajouter un jour"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Ajouter
                                    </button>
                                </div>
                                <ul className="mt-2 space-y-1">
                                    {days.fields.map((f, i) => {
                                        const active = i === activeDay;
                                        return (
                                            <li key={f.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveDay(i)}
                                                    className={cls(
                                                        'w-full rounded-lg px-3 py-2 text-left text-sm transition border',
                                                        active
                                                            ? 'bg-gradient-to-r from-violet-600/10 to-amber-400/10 border-brand-200'
                                                            : 'bg-white hover:bg-gray-50 border-gray-200'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
                                                            <span className="truncate">
                                                                J{i + 1} — {(watch(`days.${i}.title`) as string) || 'titre'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {active && (
                                                        <div className="mt-2 flex items-center gap-1.5">
                                                            <IconButton onClick={() => duplicateDay(i)} title="Dupliquer">
                                                                <Copy className="h-4 w-4" />
                                                            </IconButton>
                                                            <IconButton onClick={() => moveUp(i)} title="Monter" disabled={i === 0}>
                                                                <MoveUp className="h-4 w-4" />
                                                            </IconButton>
                                                            <IconButton onClick={() => moveDown(i)} title="Descendre" disabled={i === days.fields.length - 1}>
                                                                <MoveDown className="h-4 w-4" />
                                                            </IconButton>
                                                            <IconButton onClick={() => removeDay(i)} title="Supprimer">
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </IconButton>
                                                        </div>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </aside>

                            {/* Contenu de l’onglet actif */}
                            <section className="rounded-2xl border border-border bg-card p-4">
                                {activeDay >= 0 && activeDay < days.fields.length && (
                                    <div className="grid md:grid-cols-[1fr,300px] gap-4">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">Jour {activeDay + 1}</div>
                                                <div className="flex items-center gap-2">
                                                    <Badge>Édition</Badge>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <Label required>Titre du jour</Label>
                                                <InputPill {...register(`days.${activeDay}.title`, { required: true })} placeholder={`J${activeDay + 1} — titre`} />
                                            </div>

                                            <div className="mt-4">
                                                <Label required>URL vidéo (YouTube / Vimeo / MP4)</Label>
                                                <InputPill
                                                    {...register(`days.${activeDay}.videoUrl`, { required: true })}
                                                    placeholder="https://youtu.be/... | https://vimeo.com/... | https://cdn/.../video.mp4"
                                                    inputMode="url"
                                                />
                                                <Help>Colle une URL http(s) valide. Un badge de source s’affiche automatiquement.</Help>
                                                <div className="mt-2">
                                                    <Badge>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Film className="h-3.5 w-3.5" />
                                                            {providerFromUrl((watch(`days.${activeDay}.videoUrl`) as string) || '') || 'Lien'}
                                                        </span>
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid md:grid-cols-3 gap-3">
                                                <div>
                                                    <Label>Mantra</Label>
                                                    <InputPill {...register(`days.${activeDay}.mantra`)} placeholder="Une phrase ancrante" maxLength={80} />
                                                    <p className="mt-1 text-[10px] text-gray-400">{(watch(`days.${activeDay}.mantra`) as string)?.length || 0}/80</p>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label>Description (courte)</Label>
                                                    <TextareaSoft {...register(`days.${activeDay}.description`)} placeholder="2–3 phrases sous la vidéo" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div className="rounded-2xl border border-border bg-card p-4">
                                            <div className="rounded-2xl">
                                                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                                                    <Thumb url={(watch(`days.${activeDay}.videoUrl`) as string) || ''} />
                                                </div>
                                                <div className="mt-2 space-y-1 p-2">
                                                    <div className="truncate text-sm font-medium text-slate-900">
                                                        {(watch(`days.${activeDay}.title`) as string) || `J${activeDay + 1} — titre`}
                                                    </div>
                                                    <div className="line-clamp-2 text-xs text-gray-600">
                                                        {(watch(`days.${activeDay}.description`) as string) || 'Aperçu de la description…'}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-gray-500">
                                                        Source: {providerFromUrl((watch(`days.${activeDay}.videoUrl`) as string) || '') || 'Lien'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'seo' && (
                <Card>
                    <h2 className="font-semibold mb-3">SEO (facultatif)</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div>
                            <Label>SEO • Title</Label>
                            <InputPill {...register('marketing.seo.title')} />
                        </div>
                        <div>
                            <Label>SEO • Description</Label>
                            <InputPill {...register('marketing.seo.description')} />
                        </div>
                        <div>
                            <Label>SEO • Image</Label>
                            <InputPill {...register('marketing.seo.image')} />
                        </div>
                    </div>
                </Card>
            )}

            {/* erreurs & toasts */}
            {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}
            {toast && (
                <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4">
                    <div className="pointer-events-auto rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow">{toast}</div>
                </div>
            )}
        </form>
    );
}
