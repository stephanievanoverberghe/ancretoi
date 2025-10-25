// src/app/library/page.tsx
import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import type { Types } from 'mongoose';
import Resource, { type ResourceDoc, type ResourceKind } from '@/models/Resource';
import { BookOpen, PlayCircle, Headphones, Dumbbell, Puzzle, Search, Timer, Filter, ExternalLink } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type SearchParams = Record<string, string | string[] | undefined>;

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const KIND_META: Record<ResourceKind, { label: string; Icon: IconType }> = {
    article: { label: 'Articles', Icon: BookOpen },
    video: { label: 'Vidéos', Icon: PlayCircle },
    audio: { label: 'Audios', Icon: Headphones },
    exercise: { label: 'Exercices', Icon: Dumbbell },
    tool: { label: 'Outils', Icon: Puzzle },
};

function toArray(x?: string | string[]) {
    if (!x) return [] as string[];
    return Array.isArray(x) ? x : [x];
}

export default async function LibraryPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
    await dbConnect();

    // Auth (retire ça si tu veux la page publique)
    const session = await requireUser('/login');
    const user = await UserModel.findOne({ email: session.email }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();
    if (!user?._id) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="mb-2 text-2xl font-semibold text-foreground">Bibliothèque</h1>
                <p className="text-muted-foreground">Utilisateur introuvable.</p>
            </main>
        );
    }

    const sp = (await searchParams) ?? {};
    const q = typeof sp.q === 'string' ? sp.q.trim() : '';
    const kind = typeof sp.kind === 'string' ? (sp.kind as ResourceKind) : undefined;
    const tags = toArray(sp.tag)
        .map((t) => t.trim())
        .filter(Boolean);
    const sort = typeof sp.sort === 'string' ? sp.sort : 'recent'; // recent | alpha | duration

    // Build query (évite any → unknown)
    const where: Record<string, unknown> = {};
    if (kind) where.kind = kind;
    if (q) where.$text = { $search: q };
    if (tags.length > 0) where.tags = { $all: tags };

    // Tri
    const sortMap: Record<string, Record<string, 1 | -1>> = {
        recent: { createdAt: -1 },
        alpha: { title: 1 },
        duration: { minutes: 1, title: 1 },
    };
    const sortBy = sortMap[sort] ?? sortMap.recent;

    // Query
    let items = await Resource.find(where)
        .select<ResourceDoc>({ slug: 1, title: 1, kind: 1, description: 1, minutes: 1, tags: 1, coverUrl: 1, url: 1, createdAt: 1 })
        .sort(sortBy)
        .lean<ResourceDoc[]>();

    // Si pas d'index texte, fallback “contains”
    const hasTextIndex = await Resource.collection.indexExists('text');
    if (q && !hasTextIndex) {
        const needle = q.toLowerCase();
        items = items.filter(
            (it) => it.title?.toLowerCase().includes(needle) || it.description?.toLowerCase().includes(needle) || (it.tags ?? []).some((t) => t.toLowerCase().includes(needle))
        );
    }

    // Tags disponibles (pour filtre)
    const allTags = Array.from(new Set(items.flatMap((i) => i.tags ?? []))).sort((a, b) => a.localeCompare(b, 'fr'));

    return (
        <main className="">
            {/* HERO / header */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm backdrop-blur">
                {/* Fil d’Ariane */}
                <Breadcrumbs items={[{ label: 'Mon espace', href: '/member' }, { label: 'Bibliothèque' }]} />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bibliothèque</h1>
                        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                            Articles, vidéos, audios, exercices et outils — soigneusement sélectionnés pour t’aider à progresser.
                        </p>
                    </div>

                    {/* Barre de recherche (GET) */}
                    <form action="/library" className="flex w-full gap-2 sm:w-[360px]">
                        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
                        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
                        {tags.map((t) => (
                            <input key={t} type="hidden" name="tag" value={t} />
                        ))}
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                name="q"
                                defaultValue={q}
                                placeholder="Rechercher un titre, un tag…"
                                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground outline-none ring-0 transition focus:border-brand-600/40"
                            />
                        </div>
                        <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700" type="submit">
                            Rechercher
                        </button>
                    </form>
                </div>

                {/* Filtres principaux (types) */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <KindPill href="/library" active={!kind} label="Tout" />
                    {(Object.keys(KIND_META) as ResourceKind[]).map((k) => (
                        <KindPill
                            key={k}
                            href={`/library?kind=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}${tags.map((t) => `&tag=${encodeURIComponent(t)}`).join('')}${
                                sort ? `&sort=${sort}` : ''
                            }`}
                            active={kind === k}
                            label={KIND_META[k].label}
                            Icon={KIND_META[k].Icon}
                        />
                    ))}

                    {/* tri */}
                    <div className="ml-auto inline-flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Trier :</span>
                        <SortLink label="Récents" value="recent" current={sort} q={q} kind={kind} tags={tags} />
                        <SortLink label="A → Z" value="alpha" current={sort} q={q} kind={kind} tags={tags} />
                        <SortLink label="Durée" value="duration" current={sort} q={q} kind={kind} tags={tags} />
                    </div>
                </div>

                {/* Filtres tags */}
                {allTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-xs font-medium ring-1 ring-border">
                            <Filter className="h-3.5 w-3.5" /> Tags :
                        </span>
                        {allTags.map((t) => {
                            const active = tags.includes(t);
                            const base = `/library?${[
                                q ? `q=${encodeURIComponent(q)}` : '',
                                kind ? `kind=${kind}` : '',
                                ...tags.filter((x) => x !== t).map((x) => `tag=${encodeURIComponent(x)}`), // retire si déjà actif
                                !active ? `tag=${encodeURIComponent(t)}` : '', // toggle
                                sort ? `sort=${sort}` : '',
                            ]
                                .filter(Boolean)
                                .join('&')}`;
                            return (
                                <Link
                                    key={t}
                                    href={base}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 transition ${
                                        active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-card text-foreground ring-border hover:bg-muted'
                                    }`}
                                >
                                    #{t}
                                </Link>
                            );
                        })}
                        {tags.length > 0 && (
                            <Link
                                href={`/library?${[q ? `q=${encodeURIComponent(q)}` : '', kind ? `kind=${kind}` : '', sort ? `sort=${sort}` : ''].filter(Boolean).join('&')}`}
                                className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                            >
                                Effacer les tags
                            </Link>
                        )}
                    </div>
                )}
            </section>

            {/* GRID */}
            {items.length === 0 ? (
                <EmptyState />
            ) : (
                <section className="mt-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((it) => (
                            <ResourceCard key={String((it as { _id?: unknown })._id ?? it.slug)} item={it} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

/* ------------------------ UI components (server-safe) ------------------------ */

function KindPill({ href, label, active, Icon }: { href: string; label: string; active?: boolean; Icon?: IconType }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-card text-foreground ring-border hover:bg-muted'
            }`}
        >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {label}
        </Link>
    );
}

function SortLink({ label, value, current, q, kind, tags }: { label: string; value: string; current: string; q?: string; kind?: string; tags: string[] }) {
    const href = `/library?${[
        q ? `q=${encodeURIComponent(q)}` : '',
        kind ? `kind=${encodeURIComponent(kind)}` : '',
        ...tags.map((t) => `tag=${encodeURIComponent(t)}`),
        `sort=${value}`,
    ]
        .filter(Boolean)
        .join('&')}`;

    return (
        <Link
            href={href}
            className={`rounded-full px-2.5 py-1 text-xs ring-1 ${
                current === value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-card text-foreground ring-border hover:bg-muted'
            }`}
        >
            {label}
        </Link>
    );
}

function ResourceCard({ item }: { item: ResourceDoc }) {
    const { Icon } = KIND_META[item.kind];
    const readableKind = KIND_META[item.kind].label.slice(0, -1); // singulier simple
    return (
        <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
            {/* cover */}
            <div className="relative h-40 w-full bg-muted">
                {item.coverUrl ? <Image src={item.coverUrl} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" /> : null}
            </div>

            <div className="p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 ring-1 ring-border">
                        <Icon className="h-3.5 w-3.5 text-brand-600" /> {readableKind}
                    </span>
                    {typeof item.minutes === 'number' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-card px-2 py-1 ring-1 ring-border">
                            <Timer className="h-3.5 w-3.5" /> {item.minutes} min
                        </span>
                    ) : null}
                </div>

                <h3 className="line-clamp-2 text-base font-semibold text-foreground">{item.title}</h3>
                {item.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}

                {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 6).map((t) => (
                            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                                #{t}
                            </span>
                        ))}
                        {item.tags.length > 6 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">+{item.tags.length - 6}</span>
                        )}
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    {/* Si ressource interne par slug → /library/[slug] (sinon url externe) */}
                    {item.url ? (
                        <Link
                            href={item.url}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            Ouvrir <ExternalLink className="h-4 w-4" />
                        </Link>
                    ) : (
                        <Link
                            href={`/library/${encodeURIComponent(item.slug)}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                        >
                            Ouvrir
                        </Link>
                    )}

                    <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        </article>
    );
}

function EmptyState() {
    return (
        <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                <BookOpen className="h-6 w-6 text-brand-600" aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Aucune ressource ne correspond</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Modifie les filtres, change le type ou essaie un autre mot-clé.</p>
            <div className="mt-6 flex justify-center gap-3">
                <Link href="/library" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                    Effacer les filtres
                </Link>
            </div>
        </div>
    );
}
