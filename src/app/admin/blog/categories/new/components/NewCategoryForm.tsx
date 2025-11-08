'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Tag as TagIcon, Sparkles } from 'lucide-react';

type FormShape = {
    name: string;
    slug: string;
    description?: string;
    color?: string | null;
    icon?: string | null;
    imagePath?: string | null; // chemin local (ex: /images/blog/cat/cover.jpg)
    imageAlt?: string | null;
};

const DEFAULT: FormShape = {
    name: '',
    slug: '',
    description: '',
    color: '',
    icon: '',
    imagePath: '',
    imageAlt: '',
};

const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

function slugify(input: string): string {
    return (input || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function sanitizeLocalPath(p: string): string {
    const s = (p || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) throw new Error('Utilise un chemin local situé dans /public (ex: /images/blog/categories/cover.jpg).');
    return s.startsWith('/') ? s : `/${s}`;
}

function InputPill(p: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className, ...rest } = p;
    return (
        <input
            {...rest}
            className={cls(
                'w-full rounded-full border border-brand-300 bg-white px-3 py-2 text-sm shadow-inner',
                'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
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
                'w-full min-h-[110px] rounded-2xl border border-brand-300 bg-white px-3 py-2 text-sm shadow-inner',
                'placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                className
            )}
        />
    );
}

function Button(p: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
    const { variant = 'primary', className, ...rest } = p;
    const map = {
        primary: 'bg-brand-600 text-white hover:brightness-110',
        secondary: 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100',
        ghost: 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
    } as const;
    return <button {...rest} className={cls('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition', map[variant], className)} />;
}

/** Badge couleur compact */
function ColorBadge({ color }: { color?: string | null }) {
    if (!color) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]" title={color}>
            <span className="inline-block h-3 w-3 rounded-sm border" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{color}</span>
        </span>
    );
}

export default function NewCategoryForm() {
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [pathError, setPathError] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue } = useForm<FormShape>({
        defaultValues: DEFAULT,
        mode: 'onChange',
    });

    const name = watch('name');
    const slug = watch('slug');
    const color = watch('color');
    const icon = watch('icon');
    const imagePath = watch('imagePath');
    const imageAlt = watch('imageAlt');
    const description = watch('description');

    const onNameBlur = () => {
        const n = (name || '').trim();
        if (!n) return;
        const currentSlug = (slug || '').trim();
        if (!currentSlug) setValue('slug', slugify(n));
    };

    const safeImagePath = useMemo(() => {
        if (!imagePath) return '';
        try {
            setPathError(null);
            return sanitizeLocalPath(imagePath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Chemin image invalide.';
            setPathError(msg);
            return '';
        }
    }, [imagePath]);

    const onSubmit: SubmitHandler<FormShape> = async (values) => {
        try {
            setSaving(true);
            setErr(null);

            let normalizedImage = (values.imagePath || '').trim();
            if (normalizedImage) normalizedImage = sanitizeLocalPath(normalizedImage);

            const payload: FormShape = {
                name: (values.name || '').trim(),
                slug: slugify(values.slug || values.name || ''),
                description: (values.description || '').trim(),
                color: (values.color || '').trim() || null,
                icon: (values.icon || '').trim() || null,
                imagePath: normalizedImage || null,
                imageAlt: (values.imageAlt || '').trim() || null,
            };

            const r = await fetch('/api/admin/blog/categories/create', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const ct = r.headers.get('content-type') ?? '';
            const data = ct.includes('application/json') ? await r.json() : await r.text();

            if (!r.ok) {
                const message = typeof data === 'string' ? data : (data as { error?: string })?.error || `Erreur HTTP ${r.status}`;
                throw new Error(message);
            }

            setToast('Catégorie créée ✅');
            setTimeout(() => setToast(null), 900);
            window.location.assign('/admin/blog/categories?created=1');
        } catch (e) {
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
                        <div className="text-xs text-gray-500">Nouvelle catégorie</div>
                        <div className="truncate font-semibold">{name || 'Sans nom'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Création…' : 'Créer'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Form + Preview side-by-side */}
            <section className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                {/* Form */}
                <div className="rounded-2xl border border-brand-200 bg-white p-4 md:p-5 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-slate-900">Nom *</label>
                            <InputPill {...register('name', { required: true })} onBlur={onNameBlur} placeholder="Création" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-900">Slug *</label>
                            <InputPill {...register('slug', { required: true })} placeholder="creation" />
                            <p className="mt-1 text-[11px] text-gray-500">Si vide, généré depuis le nom.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-900">Couleur (hex/rgb — optionnel)</label>
                            <InputPill {...register('color')} placeholder="#8b5cf6" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-900">Icône (nom — optionnel)</label>
                            <InputPill {...register('icon')} placeholder="tag, feather, sparkles…" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-900">Image (chemin local /public)</label>
                            <InputPill {...register('imagePath')} placeholder="/images/blog/categories/creation.jpg" />
                            <p className="mt-1 text-[11px] text-gray-500">
                                Exemple: <code>/images/blog/categories/…</code> — pas d’URL externe.
                            </p>
                            {pathError && <p className="mt-1 text-[11px] text-red-600">{pathError}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-900">Texte alternatif</label>
                            <InputPill {...register('imageAlt')} placeholder="Illustration de la catégorie Création" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-900">Description</label>
                            <TextareaSoft {...register('description')} placeholder="Brève description de la catégorie…" />
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <aside className="rounded-2xl border border-brand-200 bg-white shadow-sm overflow-hidden">
                    {/* Bandeau image */}
                    <div className="relative aspect-[16/9] w-full bg-gray-100">
                        {safeImagePath ? (
                            <Image
                                src={safeImagePath}
                                alt={imageAlt || name || 'aperçu catégorie'}
                                fill
                                className="object-cover"
                                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                priority={false}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center text-white"
                                style={{
                                    background: color ? `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.35) 100%)` : 'linear-gradient(135deg, #c7d2fe 0%, #fbcfe8 100%)',
                                }}
                            >
                                <div className="flex items-center gap-2 text-2xl drop-shadow">
                                    <TagIcon className="h-7 w-7" />
                                    <span className="font-semibold">{name || 'Nom de la catégorie'}</span>
                                </div>
                            </div>
                        )}

                        {/* Badges bandeau */}
                        <div className="absolute left-3 bottom-3 flex items-center gap-2">
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">/{slug || 'slug'}</span>
                            <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white">articles 0</span>
                        </div>
                    </div>

                    {/* Corps */}
                    <div className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-gray-200 bg-white">
                                {icon ? <Sparkles className="h-4 w-4 text-gray-500" /> : <TagIcon className="h-4 w-4 text-gray-500" />}
                            </div>
                            <h3 className="line-clamp-1 text-base font-semibold sm:text-lg">{name || 'Nom de la catégorie'}</h3>
                            <div className="ml-auto">
                                <ColorBadge color={color} />
                            </div>
                        </div>

                        {description ? <p className="mt-1 line-clamp-2 text-sm text-gray-600">{description}</p> : null}

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Articles</div>
                                <div className="text-base font-semibold">0</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">Créée</div>
                                <div className="font-medium">—</div>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                                <div className="text-muted-foreground">MAJ</div>
                                <div className="font-medium">—</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

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
