import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';
import type { Types } from 'mongoose';
import { NotebookPen, Download, FileJson, FileDown, CheckCircle2, Clock3, Sparkles, TrendingUp, Home, PlayCircle, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type SearchParams = Record<string, string | string[] | undefined>;

type SliderBlock = {
    energie?: number;
    focus?: number;
    paix?: number;
    estime?: number;
};

type DayStateLean = {
    programSlug: string;
    day: number;
    data?: Record<string, string>;
    sliders?: SliderBlock; // baseline
    checkout?: SliderBlock; // après séance
    practiced?: boolean;
    mantra3x?: boolean;
    completed?: boolean;
    updatedAt: Date;
};

function mean(nums: number[]): number | null {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number | null): string {
    return n == null ? '—' : n.toFixed(1);
}

function delta(a: number | null, b: number | null): string {
    if (a == null || b == null) return '—';
    const d = b - a;
    const sign = d > 0 ? '+' : d < 0 ? '' : '';
    return `${sign}${d.toFixed(1)}`;
}

export default async function NotesPage({ searchParams }: { searchParams?: SearchParams }) {
    await dbConnect();
    const session = await requireUser('/login');

    const user = await UserModel.findOne({ email: session.email }).select<{ _id: Types.ObjectId }>({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

    if (!user?._id) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10">
                <h1 className="text-2xl font-semibold mb-2">Mon carnet</h1>
                <p className="text-muted-foreground">Utilisateur introuvable.</p>
            </main>
        );
    }

    const programFilter = typeof searchParams?.program === 'string' ? searchParams.program : undefined;

    const states = await DayState.find({
        userId: user._id,
        ...(programFilter ? { programSlug: programFilter } : {}),
    })
        .select<DayStateLean>({
            programSlug: 1,
            day: 1,
            data: 1,
            sliders: 1,
            checkout: 1,
            practiced: 1,
            mantra3x: 1,
            completed: 1,
            updatedAt: 1,
        })
        .sort({ programSlug: 1, day: 1 })
        .lean<DayStateLean[]>();

    const programs = Array.from(new Set(states.map((s) => s.programSlug)));

    // ---- Stats globales (sur le filtre courant) ----
    const baseline = {
        energie: states.map((s) => s.sliders?.energie).filter((n): n is number => typeof n === 'number'),
        focus: states.map((s) => s.sliders?.focus).filter((n): n is number => typeof n === 'number'),
        paix: states.map((s) => s.sliders?.paix).filter((n): n is number => typeof n === 'number'),
        estime: states.map((s) => s.sliders?.estime).filter((n): n is number => typeof n === 'number'),
    };
    const checkout = {
        energie: states.map((s) => s.checkout?.energie).filter((n): n is number => typeof n === 'number'),
        focus: states.map((s) => s.checkout?.focus).filter((n): n is number => typeof n === 'number'),
        paix: states.map((s) => s.checkout?.paix).filter((n): n is number => typeof n === 'number'),
        estime: states.map((s) => s.checkout?.estime).filter((n): n is number => typeof n === 'number'),
    };

    const mBase = {
        energie: mean(baseline.energie),
        focus: mean(baseline.focus),
        paix: mean(baseline.paix),
        estime: mean(baseline.estime),
    };
    const mCheck = {
        energie: mean(checkout.energie),
        focus: mean(checkout.focus),
        paix: mean(checkout.paix),
        estime: mean(checkout.estime),
    };

    const completionRate = states.length === 0 ? 0 : Math.round((states.filter((s) => s.completed).length / states.length) * 100);

    // ---- Grouping par programme pour une timeline claire ----
    const byProgram = new Map<string, DayStateLean[]>();
    for (const s of states) {
        const arr = byProgram.get(s.programSlug) ?? [];
        arr.push(s);
        byProgram.set(s.programSlug, arr);
    }

    return (
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-16">
            <a id="top" className="sr-only" />

            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-white to-indigo-50">
                <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_20%,#000_30%,transparent_80%)]">
                    <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
                    <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
                </div>

                <div className="relative p-8 sm:p-10 md:p-12">
                    <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                            <NotebookPen className="h-6 w-6 text-amber-600" aria-hidden />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">Mon carnet</h1>
                            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                                Retrouve toutes tes réponses jour par jour, compare ton état <em>avant</em> et <em>après</em>, et exporte ton carnet en un clic.
                            </p>
                            <div className="mt-4 flex gap-2">
                                <Link
                                    href="/member"
                                    className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
                                >
                                    <Home className="h-4 w-4" aria-hidden /> Tableau de bord
                                </Link>
                                <Link
                                    href="/continue"
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                                >
                                    <PlayCircle className="h-4 w-4" aria-hidden /> Continuer
                                </Link>
                            </div>
                        </div>
                        <div className="ml-auto hidden sm:flex gap-3">
                            <Link
                                href={`/api/notes/export?format=json${programFilter ? `&program=${programFilter}` : ''}`}
                                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
                            >
                                <FileJson className="h-4 w-4" aria-hidden /> Export JSON
                            </Link>
                            <Link
                                href={`/api/notes/export?format=pdf${programFilter ? `&program=${programFilter}` : ''}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                            >
                                <FileDown className="h-4 w-4" aria-hidden /> Export PDF
                            </Link>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <KpiCard title="Énergie" before={round1(mBase.energie)} after={round1(mCheck.energie)} deltaLabel={delta(mBase.energie, mCheck.energie)} />
                        <KpiCard title="Focus" before={round1(mBase.focus)} after={round1(mCheck.focus)} deltaLabel={delta(mBase.focus, mCheck.focus)} />
                        <KpiCard title="Paix" before={round1(mBase.paix)} after={round1(mCheck.paix)} deltaLabel={delta(mBase.paix, mCheck.paix)} />
                        <KpiCard title="Estime" before={round1(mBase.estime)} after={round1(mCheck.estime)} deltaLabel={delta(mBase.estime, mCheck.estime)} />
                    </div>

                    {/* Toolbar (mobile) */}
                    <div className="mt-6 flex sm:hidden gap-3">
                        <Link
                            href={`/api/notes/export?format=json${programFilter ? `&program=${programFilter}` : ''}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
                        >
                            <FileJson className="h-4 w-4" aria-hidden /> JSON
                        </Link>
                        <Link
                            href={`/api/notes/export?format=pdf${programFilter ? `&program=${programFilter}` : ''}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                        >
                            <FileDown className="h-4 w-4" aria-hidden /> PDF
                        </Link>
                    </div>

                    {/* Filtre programmes */}
                    <ProgramFilter programs={programs} byProgram={byProgram} programFilter={programFilter} total={states.length} completionRate={completionRate} />
                </div>
            </section>

            {/* LISTE / TIMELINE */}
            <div className="mt-10 space-y-10">
                {programs.length === 0 ? (
                    <EmptyState />
                ) : (
                    (programFilter ? [programFilter] : programs).map((prog) => {
                        const items = (byProgram.get(prog) ?? []).slice().sort((a, b) => a.day - b.day);
                        return (
                            <section key={prog}>
                                <h2 className="mb-4 text-lg font-semibold tracking-tight">{prog}</h2>
                                <ol className="relative border-l border-gray-200 pl-4 sm:pl-6">
                                    {items.map((s, idx) => (
                                        <li key={`${prog}-${s.day}`} className="mb-8 ml-2 sm:ml-4">
                                            {/* Dot */}
                                            <span className="absolute -left-2 sm:-left-[9px] mt-1 flex h-3.5 w-3.5 items-center justify-center">
                                                <span className={`h-2.5 w-2.5 rounded-full ${s.completed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                            </span>

                                            {/* Card */}
                                            <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                                                <header className="mb-3 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium ring-1 ring-gray-200">
                                                        Jour {s.day}{' '}
                                                        {s.completed ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                                                        )}
                                                    </span>
                                                    {s.practiced && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                            Pratique faite
                                                        </span>
                                                    )}
                                                    {s.mantra3x && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                                                            Mantra ×3
                                                        </span>
                                                    )}
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <Link
                                                            href={`/learn/${encodeURIComponent(s.programSlug)}/day/${s.day}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
                                                        >
                                                            <BookOpen className="h-3.5 w-3.5" aria-hidden /> Ouvrir le jour
                                                        </Link>
                                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock3 className="h-3.5 w-3.5" /> MAJ {new Date(s.updatedAt).toLocaleString('fr-FR')}
                                                        </span>
                                                    </div>
                                                </header>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {/* Réponses */}
                                                    <div>
                                                        <div className="mb-1 text-sm font-semibold">Réponses</div>
                                                        {s.data && Object.keys(s.data).length > 0 ? (
                                                            <ul className="space-y-1.5 text-sm">
                                                                {Object.entries(s.data).map(([k, v]) => (
                                                                    <li key={k} className="flex">
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="font-medium">{k}:</span> <span className="text-muted-foreground">{v || '—'}</span>
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">Aucune réponse.</p>
                                                        )}
                                                    </div>

                                                    {/* Curseurs */}
                                                    <div className="grid gap-3">
                                                        <MetricRow label="Avant" values={s.sliders} />
                                                        <MetricRow label="Après" values={s.checkout} />
                                                        <DeltaRow before={s.sliders} after={s.checkout} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Connector spacing for last */}
                                            {idx === items.length - 1 && <div className="h-1" />}
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        );
                    })
                )}
            </div>
        </main>
    );
}

/* ---------- UI SUB-COMPONENTS (server-safe) ---------- */

function ProgramFilter({
    programs,
    byProgram,
    programFilter,
    total,
    completionRate,
}: {
    programs: string[];
    byProgram: Map<string, DayStateLean[]>;
    programFilter?: string;
    total: number;
    completionRate: number;
}) {
    return (
        <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtrer :</span>
            <Pill href="/notes" active={!programFilter} label="Tous" count={total} />
            {programs.map((p) => (
                <Pill key={p} href={`/notes?program=${encodeURIComponent(p)}`} active={programFilter === p} label={p} count={byProgram.get(p)?.length ?? 0} />
            ))}
            <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" aria-hidden /> Complétion :{' '}
                <span className="ml-1 rounded-md bg-white/60 px-1.5 py-0.5 text-foreground ring-1 ring-black/5">{completionRate}%</span>
            </div>
        </div>
    );
}

function KpiCard({ title, before, after, deltaLabel }: { title: string; before: string; after: string; deltaLabel: string }) {
    const improved = !isNaN(Number(deltaLabel)) && Number(deltaLabel) > 0;
    const neutral = deltaLabel === '—' || Number(deltaLabel) === 0;
    const chipClass = improved ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : neutral ? 'bg-gray-50 text-gray-700 ring-gray-200' : 'bg-rose-50 text-rose-700 ring-rose-200';
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-muted-foreground">{title}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <div className="text-2xl font-semibold">{after}</div>
                        <div className="text-sm text-muted-foreground">après</div>
                    </div>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ring-1 ${chipClass}`}>
                    <TrendingUp className="h-3.5 w-3.5" /> {deltaLabel}
                </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
                Avant&nbsp;: <span className="font-medium text-foreground">{before}</span>
            </div>
        </div>
    );
}

function Pill({ href, label, active, count }: { href: string; label: string; active: boolean; count: number }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                active ? 'bg-amber-600 text-white ring-amber-600' : 'bg-white text-foreground ring-gray-200 hover:bg-gray-50'
            }`}
        >
            {label}
            <span
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
            >
                {count}
            </span>
        </Link>
    );
}

function MetricRow({ label, values }: { label: string; values?: SliderBlock }) {
    return (
        <div className="rounded-xl border bg-gray-50/60 p-3 ring-1 ring-gray-200">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <MetricChip name="Énergie" value={values?.energie} />
                <MetricChip name="Focus" value={values?.focus} />
                <MetricChip name="Paix" value={values?.paix} />
                <MetricChip name="Estime" value={values?.estime} />
            </div>
        </div>
    );
}

function DeltaRow({ before, after }: { before?: SliderBlock; after?: SliderBlock }) {
    const make = (b?: number, a?: number) => (b == null || a == null ? '—' : a - b >= 0 ? `+${(a - b).toFixed(1)}` : (a - b).toFixed(1));
    return (
        <div className="rounded-xl border bg-white p-3 ring-1 ring-gray-200">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">Delta (après − avant)</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <MetricChip name="Énergie" valueLabel={make(before?.energie, after?.energie)} tone="delta" />
                <MetricChip name="Focus" valueLabel={make(before?.focus, after?.focus)} tone="delta" />
                <MetricChip name="Paix" valueLabel={make(before?.paix, after?.paix)} tone="delta" />
                <MetricChip name="Estime" valueLabel={make(before?.estime, after?.estime)} tone="delta" />
            </div>
        </div>
    );
}

function MetricChip({ name, value, valueLabel, tone }: { name: string; value?: number; valueLabel?: string; tone?: 'delta' }) {
    const label = valueLabel ?? (typeof value === 'number' ? value.toFixed(1) : '—');
    const vibe =
        tone === 'delta'
            ? Number(label) > 0
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : Number(label) < 0
                ? 'bg-rose-50 text-rose-700 ring-rose-200'
                : 'bg-gray-50 text-gray-700 ring-gray-200'
            : 'bg-white text-foreground ring-gray-200';

    return (
        <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ring-1 ${vibe}`}>
            <span className="truncate">{name}</span>
            <span className="font-semibold">{label}</span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                <Download className="h-6 w-6 text-amber-600" aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">Aucune note pour ce filtre</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Commence une session, enregistre tes réponses, puis reviens ici pour visualiser ton évolution.</p>
            <div className="mt-6 flex justify-center gap-3">
                <Link href="/continue" className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700">
                    Reprendre <Sparkles className="h-4 w-4" />
                </Link>
                <Link
                    href="/notes"
                    className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
                >
                    Actualiser
                </Link>
            </div>
        </div>
    );
}
