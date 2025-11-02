// src/app/notes/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';
import type { Types } from 'mongoose';
import { NotebookPen, FileJson, FileDown, Home, PlayCircle, CheckCircle2, Clock3, Sparkles, Search, Filter, Table as TableIcon, LineChart, ListChecks } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type SearchParams = Record<string, string | string[] | undefined>;

type DayStateLean = {
    programSlug: string;
    day: number;
    data?: Record<string, string>;
    practiced?: boolean;
    completed?: boolean;
    updatedAt: Date;
};

function includesI(hay?: string, needle?: string) {
    if (!hay || !needle) return true;
    return hay.toLowerCase().includes(needle.toLowerCase());
}

export default async function NotesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
    await dbConnect();
    const session = await requireUser('/login');

    const user = await UserModel.findOne({ email: session.email }).select<{ _id: Types.ObjectId }>({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

    if (!user?._id) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10">
                <h1 className="mb-2 text-2xl font-semibold text-foreground">Mon carnet</h1>
                <p className="text-muted-foreground">Utilisateur introuvable.</p>
            </main>
        );
    }

    const sp = (await searchParams) ?? {};
    const programFilter = typeof sp.program === 'string' ? sp.program : undefined;
    const q = typeof sp.q === 'string' ? sp.q.trim() : '';
    const tab = (typeof sp.tab === 'string' ? sp.tab : 'timeline') as 'timeline' | 'table' | 'stats';

    // Données
    const states = await DayState.find({
        userId: user._id,
        ...(programFilter ? { programSlug: programFilter } : {}),
    })
        .select<DayStateLean>({
            programSlug: 1,
            day: 1,
            data: 1,
            practiced: 1,
            completed: 1,
            updatedAt: 1,
        })
        .sort({ programSlug: 1, day: 1 })
        .lean<DayStateLean[]>();

    // Filtres texte
    const filtered = q ? states.filter((s) => Object.values(s.data ?? {}).some((v) => includesI(v, q))) : states;

    // Programmes présents dans le set filtré
    const programs = Array.from(new Set(filtered.map((s) => s.programSlug)));

    // Programmes disponibles (pour le select)
    const programOptions = (await DayState.distinct('programSlug', { userId: user._id })) as string[];
    programOptions.sort();

    // Regroupement par programme
    const byProgram = new Map<string, DayStateLean[]>();
    for (const s of filtered) {
        const arr = byProgram.get(s.programSlug) ?? [];
        arr.push(s);
        byProgram.set(s.programSlug, arr);
    }

    // Résumé résultats
    const totalDaysFiltered = filtered.length;
    const matchedPrograms = Array.from(new Set(filtered.map((s) => s.programSlug))).sort();

    // KPIs simples
    const total = filtered.length;
    const practicedCount = filtered.filter((s) => s.practiced).length;
    const completedCount = filtered.filter((s) => s.completed).length;
    const completionRate = total ? Math.round((completedCount / total) * 100) : 0;

    // Exports
    const exportQs = (fmt: 'json' | 'pdf') =>
        `/api/notes/export?format=${fmt}${programFilter ? `&program=${encodeURIComponent(programFilter)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

    const tabs = [
        { key: 'timeline', label: 'Timeline', icon: ListChecks },
        { key: 'table', label: 'Tableau', icon: TableIcon },
        { key: 'stats', label: 'Stats', icon: LineChart },
    ] as const;

    return (
        <main>
            <a id="top" className="sr-only" />

            {/* ===== HEADER harmonisé (gradient + rings) ===== */}
            <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 ring-1 ring-black/5 p-6 sm:p-8 md:p-10 backdrop-blur">
                {/* soft glows */}
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_80%_0%,#000_15%,transparent_75%)]">
                    <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-brand-200/30 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
                </div>

                <div className="relative">
                    <Breadcrumbs items={[{ label: 'Mon espace', href: '/member' }, { label: 'Carnet' }]} />

                    <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-white/60 shadow">
                                <NotebookPen className="h-6 w-6 text-brand-600" aria-hidden />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Mon carnet</h1>
                                <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                                    Toutes tes réponses, jour par jour. Filtre par programme, mot-clé, et exporte ton carnet.
                                </p>

                                {/* Actions primaires */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link href="/member" className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm hover:bg-white">
                                        <span className="inline-flex items-center gap-2">
                                            <Home className="h-4 w-4" /> Tableau de bord
                                        </span>
                                    </Link>
                                    <Link
                                        href="/continue"
                                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
                                    >
                                        <PlayCircle className="h-4 w-4" /> Continuer
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Exports (desktop) */}
                        <div className="ml-auto hidden shrink-0 gap-3 sm:flex">
                            <Link
                                href={exportQs('json')}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                            >
                                <FileJson className="h-4 w-4" aria-hidden /> Export JSON
                            </Link>
                            <Link
                                href={exportQs('pdf')}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                            >
                                <FileDown className="h-4 w-4" aria-hidden /> Export PDF
                            </Link>
                        </div>
                    </div>

                    {/* Toolbar : select programme + recherche + effacer (mobile exports à droite) */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <SearchBar defaultQ={q} programFilter={programFilter} tab={tab} programOptions={programOptions} />

                        <Link
                            href={exportQs('json')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50 sm:hidden"
                        >
                            <FileJson className="h-4 w-4" aria-hidden /> JSON
                        </Link>
                        <Link
                            href={exportQs('pdf')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:hidden"
                        >
                            <FileDown className="h-4 w-4" aria-hidden /> PDF
                        </Link>
                    </div>

                    {/* Résumé des résultats */}
                    <ResultsSummary q={q} programFilter={programFilter} totalDays={totalDaysFiltered} matchedPrograms={matchedPrograms} />

                    {/* KPIs */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <SoftKpi label="Entrées" value={total} />
                        <SoftKpi label="Pratiques cochées" value={practicedCount} />
                        <SoftKpi label="Taux de complétion" value={`${completionRate}%`} />
                    </div>

                    {/* Onglets de page */}
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        {tabs.map(({ key, label, icon: Icon }) => {
                            const href = `/notes?tab=${key}${programFilter ? `&program=${encodeURIComponent(programFilter)}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
                            const active = tab === key;
                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    className={[
                                        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 transition',
                                        active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-card text-foreground ring-border hover:bg-muted',
                                    ].join(' ')}
                                >
                                    <Icon className="h-4 w-4" /> {label}
                                </Link>
                            );
                        })}
                        <div className="ml-auto text-xs text-muted-foreground">Vue&nbsp;: {tab}</div>
                    </div>

                    {/* Onglets programmes (scrollable) */}
                    <ProgramTabs programs={programs} programFilter={programFilter} q={q} tab={tab} />
                </div>
            </section>

            {/* ===== CONTENU ===== */}
            <div className="mt-8 space-y-10">
                {programs.length === 0 ? (
                    <EmptyState />
                ) : tab === 'table' ? (
                    <TableView programs={programs} byProgram={byProgram} programFilter={programFilter} />
                ) : tab === 'stats' ? (
                    <StatsView total={total} practiced={practicedCount} completed={completedCount} />
                ) : (
                    <TimelineView programs={programs} byProgram={byProgram} programFilter={programFilter} />
                )}
            </div>
        </main>
    );
}

/* ================= SUB-COMPONENTS ================= */

function SearchBar({ defaultQ, programFilter, tab, programOptions }: { defaultQ?: string; programFilter?: string; tab: string; programOptions: string[] }) {
    return (
        <form action="/notes" className="grid w-full gap-2 sm:grid-cols-[220px_1fr_auto_auto]">
            {/* Select programme */}
            <div className="relative">
                <select
                    name="program"
                    defaultValue={programFilter ?? ''}
                    className="w-full appearance-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-0 transition focus:border-brand-600/40"
                >
                    <option value="">Tous les programmes</option>
                    {programOptions.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
            </div>

            {/* Input mot-clé */}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    name="q"
                    defaultValue={defaultQ}
                    placeholder="Rechercher dans tes notes… (ex : confiance, peur, gratitude)"
                    className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground outline-none ring-0 transition focus:border-brand-600/40"
                />
            </div>

            {/* Onglet courant */}
            <input type="hidden" name="tab" value={tab} />

            {/* Rechercher */}
            <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted" type="submit">
                <Filter className="h-4 w-4" /> Filtrer
            </button>

            {/* Effacer */}
            <Link
                href="/notes"
                className="rounded-xl px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50 text-center"
                aria-label="Effacer les filtres"
            >
                Effacer
            </Link>
        </form>
    );
}

function ResultsSummary({ q, programFilter, totalDays, matchedPrograms }: { q?: string; programFilter?: string; totalDays: number; matchedPrograms: string[] }) {
    const hasFilter = Boolean(q || programFilter);
    if (!hasFilter) return null;

    return (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg bg-card px-2 py-1 ring-1 ring-border">
                {totalDays} jour{totalDays > 1 ? 's' : ''} trouvé{totalDays > 1 ? 's' : ''}{' '}
                {programFilter ? `dans « ${programFilter} »` : matchedPrograms.length ? `dans ${matchedPrograms.length} programme(s)` : ''}
                {q ? ` pour « ${q} »` : ''}
            </span>

            {!programFilter && matchedPrograms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {matchedPrograms.slice(0, 6).map((p) => (
                        <span key={p} className="rounded-full bg-muted px-2 py-0.5 ring-1 ring-border">
                            {p}
                        </span>
                    ))}
                    {matchedPrograms.length > 6 && <span className="text-muted-foreground">+{matchedPrograms.length - 6}…</span>}
                </div>
            )}

            {/* Retirer uniquement le filtre programme */}
            {programFilter && (
                <Link href={`/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`} className="ml-auto rounded-md px-2 py-1 ring-1 ring-border hover:bg-muted">
                    Retirer « {programFilter} »
                </Link>
            )}
        </div>
    );
}

function ProgramTabs({ programs, programFilter, q, tab }: { programs: string[]; programFilter?: string; q?: string; tab: string }) {
    const qParam = q ? `&q=${encodeURIComponent(q)}` : '';
    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
                <ProgramPill href={`/notes?tab=${tab}${q ? `&q=${encodeURIComponent(q)}` : ''}`} active={!programFilter} label="Tous" count={programs.length} />
                {programs.map((p) => (
                    <ProgramPill key={p} href={`/notes?tab=${tab}&program=${encodeURIComponent(p)}${qParam}`} active={programFilter === p} label={p} />
                ))}
            </div>
        </div>
    );
}

function ProgramPill({ href, label, active, count }: { href: string; label: string; active: boolean; count?: number }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-card text-foreground ring-border hover:bg-muted'
            }`}
        >
            {label}
            {typeof count === 'number' && (
                <span
                    className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] ${
                        active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                >
                    {count}
                </span>
            )}
        </Link>
    );
}

/* ---- VUES ---- */

function TimelineView({ programs, byProgram, programFilter }: { programs: string[]; byProgram: Map<string, DayStateLean[]>; programFilter?: string }) {
    return (
        <>
            {(programFilter ? [programFilter] : programs).map((prog) => {
                const items = (byProgram.get(prog) ?? []).slice().sort((a, b) => a.day - b.day);
                return (
                    <section key={prog} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{prog}</h2>
                        <ol className="relative border-l border-border pl-4 sm:pl-6">
                            {items.map((s, idx) => (
                                <li key={`${prog}-${s.day}`} className="mb-8 ml-2 sm:ml-4">
                                    {/* Dot */}
                                    <span className="absolute -left-2 sm:-left-[9px] mt-1 flex h-3.5 w-3.5 items-center justify-center">
                                        <span className={`h-2.5 w-2.5 rounded-full ${s.completed ? 'bg-emerald-500' : 'bg-brand-600/80'}`} />
                                    </span>

                                    {/* Card */}
                                    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                                        <header className="mb-3 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1 text-xs font-medium ring-1 ring-border">
                                                Jour {s.day}{' '}
                                                {s.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Sparkles className="h-3.5 w-3.5 text-brand-600" />}
                                            </span>
                                            {s.practiced && (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                    Pratique faite
                                                </span>
                                            )}
                                            <div className="ml-auto flex items-center gap-2">
                                                <Link
                                                    href={`/learn/${encodeURIComponent(s.programSlug)}/day/${s.day}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                                                >
                                                    Ouvrir
                                                </Link>
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock3 className="h-3.5 w-3.5" /> MAJ {new Date(s.updatedAt).toLocaleString('fr-FR')}
                                                </span>
                                            </div>
                                        </header>

                                        {/* Réponses */}
                                        <div>
                                            <div className="mb-1 text-sm font-semibold text-foreground">Réponses</div>
                                            {s.data && Object.keys(s.data).length > 0 ? (
                                                <ul className="space-y-1.5 text-sm">
                                                    {Object.entries(s.data).map(([k, v]) => (
                                                        <li key={k} className="flex">
                                                            <span className="min-w-0 flex-1">
                                                                <span className="font-medium text-foreground">{k}:</span> <span className="text-muted-foreground">{v || '—'}</span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm italic text-muted-foreground">Aucune réponse.</p>
                                            )}
                                        </div>
                                    </div>

                                    {idx === items.length - 1 && <div className="h-1" />}
                                </li>
                            ))}
                        </ol>
                    </section>
                );
            })}
        </>
    );
}

function TableView({ programs, byProgram, programFilter }: { programs: string[]; byProgram: Map<string, DayStateLean[]>; programFilter?: string }) {
    const list = (programFilter ? [programFilter] : programs).flatMap((p) => byProgram.get(p) ?? []);
    if (list.length === 0) return <EmptyState />;

    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Programme</th>
                            <th className="px-3 py-2 font-medium">Jour</th>
                            <th className="px-3 py-2 font-medium">Réponses (aperçu)</th>
                            <th className="px-3 py-2 font-medium">Pratique</th>
                            <th className="px-3 py-2 font-medium">Statut</th>
                            <th className="px-3 py-2 font-medium">MAJ</th>
                            <th className="px-3 py-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((s, i) => {
                            const preview = Object.entries(s.data ?? {})
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ');
                            return (
                                <tr key={`${s.programSlug}-${s.day}-${i}`} className="border-t border-border">
                                    <td className="px-3 py-2">{s.programSlug}</td>
                                    <td className="px-3 py-2 tabular-nums">{s.day}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{preview || '—'}</td>
                                    <td className="px-3 py-2">{s.practiced ? 'Oui' : '—'}</td>
                                    <td className="px-3 py-2">{s.completed ? 'Terminé' : 'En cours'}</td>
                                    <td className="px-3 py-2">{new Date(s.updatedAt).toLocaleString('fr-FR')}</td>
                                    <td className="px-3 py-2">
                                        <Link
                                            href={`/learn/${encodeURIComponent(s.programSlug)}/day/${s.day}`}
                                            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                                        >
                                            Ouvrir
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function StatsView({ total, practiced, completed }: { total: number; practiced: number; completed: number }) {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Aperçu statistique</h2>
            <p className="mt-1 text-sm text-muted-foreground">Un résumé simple et lisible de ton parcours.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SoftKpi label="Entrées totales" value={total} />
                <SoftKpi label="Pratiques cochées" value={practiced} />
                <SoftKpi label="Jours terminés" value={completed} />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                Astuce&nbsp;: reviens régulièrement relire tes réponses, tu verras des motifs émerger (langage, thèmes récurrents, déclencheurs). Tu peux ensuite affiner ta
                pratique sur ces points.
            </div>
        </section>
    );
}

/* ---- UI atoms ---- */

function SoftKpi({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-2xl border border-border bg-white/70 p-4 ring-1 ring-black/5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                <NotebookPen className="h-6 w-6 text-brand-600" aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Aucune note pour ce filtre</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Lance une session, enregistre tes réponses, puis reviens ici pour visualiser ton parcours.</p>
            <div className="mt-6 flex justify-center gap-3">
                <Link href="/continue" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                    Reprendre <PlayCircle className="h-4 w-4" />
                </Link>
                <Link href="/notes" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                    Actualiser
                </Link>
            </div>
        </div>
    );
}
