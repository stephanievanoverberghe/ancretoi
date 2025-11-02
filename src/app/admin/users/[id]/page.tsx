// src/app/admin/users/[id]/page.tsx
import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { UserModel, ProgramModel } from '@/db/schemas';
import EnrollmentModel from '@/models/Enrollment';
import UnitModel from '@/models/Unit';
import DayState from '@/models/DayState';
import ProgramPageModel from '@/models/ProgramPage';

import ConfirmAction from '../components/ConfirmAction';
import AdminRoleSwitch from '../components/AdminRoleSwitch';
import UserTabs from '../components/UserTabs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ---------- Types ---------- */
type UserDoc = {
    _id: Types.ObjectId;
    name?: string | null;
    email: string;
    role: 'user' | 'admin';
    avatarUrl?: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
    createdAt?: Date | string | null;
    passwordChangedAt?: Date | string | null;
    deletedAt?: Date | string | null;
    suspendedAt?: Date | string | null;
    limits?: { maxConcurrentPrograms?: number | null; features?: string[] };
};

type EnrollmentCore = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    programSlug: string;
    status: 'active' | 'completed' | 'paused';
    currentDay?: number | null;
    updatedAt?: Date | string | null;
    startedAt?: Date | string | null;
};

type ProgramHydrate = {
    slug: string;
    title: string;
    coverUrl?: string | null;
    meta?: { level?: 'Basique' | 'Cible' | 'Premium' | null };
    stats?: { unitsCount?: number | null };
};

type EnrollmentRow = EnrollmentCore & {
    programTitle: string;
    coverUrl?: string | null;
    level?: 'Basique' | 'Cible' | 'Premium' | null;
    unitsCount: number;
    unitsDone: number;
    progressPct: number;
};

// ---- Type côté client pour les inscriptions (id en string)
type EnrollmentRowClient = {
    _id: string;
    programTitle: string;
    programSlug: string;
    coverUrl?: string | null;
    level?: 'Basique' | 'Cible' | 'Premium' | null;
    status: 'active' | 'completed' | 'paused';
    unitsCount: number;
    unitsDone: number;
    progressPct: number;
    currentDay?: number | null;
    updatedAt?: Date | string | null;
};

/* ---------- Utils ---------- */
const toIso = (d?: Date | string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
const clampPct = (n?: number | null) => (typeof n === 'number' ? Math.max(0, Math.min(100, n)) : 0);

/* ---------- Actions serveur ---------- */
async function setRole(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    const role = String(formData.get('role') ?? 'user') as 'user' | 'admin';
    if (!id) throw new Error('ID manquant.');
    await UserModel.findByIdAndUpdate(id, { $set: { role } });
    revalidatePath('/admin/users', 'page');
    revalidatePath(`/admin/users/${id}`, 'page');
}

async function setLimits(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    const max = formData.get('maxConcurrentPrograms');
    const featuresCsv = String(formData.get('features') ?? '');
    const features = featuresCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    await UserModel.findByIdAndUpdate(id, {
        $set: { limits: { maxConcurrentPrograms: max ? Number(max) : null, features } },
    });
    revalidatePath(`/admin/users/${id}`, 'page');
}

async function suspend(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    await UserModel.findByIdAndUpdate(id, { $set: { suspendedAt: new Date() } });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
}

async function unsuspend(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    await UserModel.findByIdAndUpdate(id, { $set: { suspendedAt: null } });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
}

async function archive(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    await UserModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
}

async function restore(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    await UserModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
}

async function hardDelete(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();
    const id = String(formData.get('id') ?? '');
    await UserModel.findByIdAndDelete(id);
    revalidatePath('/admin/users');
    redirect('/admin/users?deleted=1');
}

/* ---------- Page ---------- */
export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;

    // ===== User
    const user = await UserModel.findById(id)
        .select({
            _id: 1,
            name: 1,
            email: 1,
            role: 1,
            avatarUrl: 1,
            theme: 1,
            marketing: 1,
            productUpdates: 1,
            createdAt: 1,
            passwordChangedAt: 1,
            deletedAt: 1,
            suspendedAt: 1,
            limits: 1,
        })
        .lean<UserDoc | null>();
    if (!user) notFound();

    // ===== Enrollments (core)
    const enrollCore = await EnrollmentModel.find({ userId: user._id })
        .select({
            _id: 1,
            userId: 1,
            programSlug: 1,
            status: 1,
            currentDay: 1,
            updatedAt: 1,
            startedAt: 1,
        })
        .sort({ updatedAt: -1 })
        .lean<EnrollmentCore[]>();

    // ===== Slugs suivis
    const slugs = Array.from(new Set(enrollCore.map((e) => e.programSlug)));

    // ===== Programs (titre, cover, level, unitsCount éventuel)
    const programs = slugs.length
        ? await ProgramModel.find({ slug: { $in: slugs } })
              .select({
                  slug: 1,
                  title: 1,
                  coverUrl: 1,
                  'meta.level': 1,
                  'stats.unitsCount': 1,
              })
              .lean<ProgramHydrate[]>()
        : [];

    // ===== Covers depuis ProgramPage (card.image.url > hero.heroImage.url)
    const pages =
        slugs.length > 0
            ? await ProgramPageModel.find({ programSlug: { $in: slugs } })
                  .select({
                      programSlug: 1,
                      'card.image.url': 1,
                      'hero.heroImage.url': 1,
                  })
                  .lean<
                      {
                          programSlug: string;
                          card?: { image?: { url?: string } };
                          hero?: { heroImage?: { url?: string } };
                      }[]
                  >()
            : [];

    const coverFromPage = new Map<string, string | null>(
        pages.map((pg) => {
            const url = pg?.card?.image?.url?.trim() || pg?.hero?.heroImage?.url?.trim() || null;
            return [pg.programSlug, url];
        })
    );

    // ===== Units count (fallback via UnitModel)
    const unitsCountBySlug = new Map<string, number>(
        await Promise.all(
            slugs.map(async (slug) => {
                const fromProgram = programs.find((p) => p.slug === slug)?.stats?.unitsCount ?? null;
                if (typeof fromProgram === 'number' && fromProgram > 0) return [slug, fromProgram] as const;
                const count = await UnitModel.countDocuments({
                    programSlug: slug,
                    unitType: 'day',
                });
                return [slug, count] as const;
            })
        )
    );

    // ===== Units done + last update (DayState)
    const dayStates = await DayState.aggregate<{
        _id: { programSlug: string };
        done: number;
        last: Date[];
    }>([
        { $match: { userId: user._id } },
        {
            $group: {
                _id: { programSlug: '$programSlug' },
                done: { $sum: { $cond: ['$completed', 1, 0] } },
                last: { $addToSet: '$updatedAt' },
            },
        },
    ]);

    const unitsDoneBySlug = new Map<string, number>(dayStates.map((g) => [g._id.programSlug, g.done]));

    const lastDayStateUpdateBySlug = new Map<string, Date>(
        dayStates.map((g) => {
            const latest = g.last?.length ? new Date(Math.max(...g.last.map((d) => new Date(d).getTime()))) : null;
            return [g._id.programSlug, latest ?? new Date(0)];
        })
    );

    // ===== Métas unifiées (titre + cover fallback ProgramPage si ProgramModel vide)
    const progMetaBySlug = new Map(
        programs.map((p) => {
            const fallback = coverFromPage.get(p.slug) ?? null;
            return [
                p.slug,
                {
                    title: p.title,
                    coverUrl: p.coverUrl ?? fallback,
                    level: p.meta?.level ?? null,
                },
            ] as const;
        })
    );

    // ===== Rows calculées avec % réel
    const enrolls: EnrollmentRow[] = enrollCore.map((e) => {
        const meta = progMetaBySlug.get(e.programSlug);
        const unitsTotal = unitsCountBySlug.get(e.programSlug) ?? 0;
        const unitsDone = unitsDoneBySlug.get(e.programSlug) ?? 0;
        const pct = unitsTotal > 0 ? Math.round((Math.min(unitsDone, unitsTotal) / unitsTotal) * 100) : 0;

        return {
            ...e,
            programTitle: meta?.title ?? e.programSlug,
            coverUrl: meta?.coverUrl ?? null,
            level: meta?.level ?? null,
            unitsCount: unitsTotal,
            unitsDone: Math.min(unitsDone, unitsTotal),
            progressPct: clampPct(pct),
        };
    });

    // ===== KPIs
    const avgPercent = enrolls.length ? Math.round(enrolls.reduce((s, r) => s + r.progressPct, 0) / enrolls.length) : 0;
    const totalUnitsDone = enrolls.reduce((s, r) => s + r.unitsDone, 0);

    // "Dernière connexion" estimée
    const lastEnroll = enrolls[0]?.updatedAt ? new Date(enrolls[0].updatedAt!) : null;
    const lastFromDays = slugs.reduce<Date | null>((acc, slug) => {
        const d = lastDayStateUpdateBySlug.get(slug) ?? null;
        if (!d) return acc;
        if (!acc) return d;
        return d > acc ? d : acc;
    }, null);
    const lastSeenDate =
        lastFromDays && lastEnroll
            ? new Date(Math.max(lastFromDays.getTime(), lastEnroll.getTime()))
            : lastFromDays ?? lastEnroll ?? (user.createdAt ? new Date(user.createdAt) : null);

    // ==== Stats globales utilisateur ====
    const statusCounts = enrollCore.reduce(
        (acc, e) => {
            acc[e.status]++;
            return acc;
        },
        { active: 0, completed: 0, paused: 0 } as {
            active: number;
            completed: number;
            paused: number;
        }
    );

    // Jours “pratiqués”
    const practicedDays = await DayState.countDocuments({
        userId: user._id,
        practiced: true,
    });

    // Premier startedAt (global)
    const firstStartAt =
        enrollCore
            .map((e) => (e.startedAt ? new Date(e.startedAt) : null))
            .filter(Boolean)
            .sort((a, b) => a!.getTime() - b!.getTime())[0] ?? null;

    // Rythme moyen (unités/jour)
    const daysSinceFirst = firstStartAt ? Math.max(1, Math.ceil((Date.now() - firstStartAt.getTime()) / 86400000)) : 0;
    const dailyPace = daysSinceFirst > 0 ? totalUnitsDone / daysSinceFirst : 0;

    // Estimation date de fin
    const totalUnitsAll = enrolls.reduce((s, r) => s + r.unitsCount, 0);
    const remainingAll = Math.max(0, totalUnitsAll - totalUnitsDone);
    const projectedFinish = dailyPace > 0 && remainingAll > 0 ? new Date(Date.now() + (remainingAll / dailyPace) * 86400000).toISOString() : null;

    const stats = {
        enrollCount: enrolls.length,
        avgPercent,
        totalUnitsDone,
        practicedDays,
        firstStartAt,
        dailyPace: Number(dailyPace.toFixed(3)),
        projectedFinish,
        status: statusCounts,
    };

    const enrollsClient: EnrollmentRowClient[] = enrolls.map((e) => ({
        _id: String(e._id),
        programTitle: e.programTitle,
        programSlug: e.programSlug,
        coverUrl: e.coverUrl ?? null,
        level: e.level ?? null,
        status: e.status,
        unitsCount: e.unitsCount,
        unitsDone: e.unitsDone,
        progressPct: e.progressPct,
        currentDay: typeof e.currentDay === 'number' ? e.currentDay : null,
        updatedAt: e.updatedAt ?? null,
    }));

    /* ---------- UI ---------- */
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* ===== Header ===== */}
            <section className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                {/* Ligne top: retour + fil d’ariane */}
                <div className="flex items-center justify-between">
                    <div className="hidden md:block text-xs text-muted-foreground">
                        <Link href="/admin" className="hover:underline cursor-pointer">
                            Admin
                        </Link>
                        <span className="px-1.5">›</span>
                        <Link href="/admin/users" className="hover:underline cursor-pointer">
                            Utilisateurs
                        </Link>
                        <span className="px-1.5">›</span>
                        <span className="text-foreground">Profil</span>
                    </div>
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 cursor-pointer"
                        title="Revenir à la liste"
                    >
                        Retour liste
                    </Link>
                </div>

                <div className="mt-4 grid gap-5 md:grid-cols-[92px_1fr]">
                    {/* Avatar */}
                    <div className="row-span-2">
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-black/5 bg-gray-100">
                            {user.avatarUrl ? (
                                <Image src={user.avatarUrl} alt={user.name || user.email} fill className="object-cover" sizes="92px" />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-gray-400">—</div>
                            )}
                        </div>
                    </div>

                    {/* Identité */}
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl md:text-3xl font-semibold tracking-tight">{user.name || user.email}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 ring-1 ring-zinc-200">{user.email}</span>
                            <span
                                className={[
                                    'rounded-full px-2 py-0.5 ring-1',
                                    user.role === 'admin' ? 'bg-amber-100 text-amber-900 ring-amber-200' : 'bg-brand-50 text-brand-900 ring-brand-200',
                                ].join(' ')}
                            >
                                {user.role}
                            </span>
                            {!!user.suspendedAt && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 ring-1 ring-amber-200">suspendu</span>}
                            {!!user.deletedAt && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-900 ring-1 ring-zinc-200">archivé</span>}
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Kpi label="Dernière connexion" value={lastSeenDate ? lastSeenDate.toLocaleString('fr-FR') : '—'} />
                    <Kpi label="Cours" value={enrolls.length} />
                    <Kpi label="Progression moyenne" value={`${avgPercent}%`} />
                    <Kpi label="Unités faites" value={totalUnitsDone} />
                </div>

                <form id="roleForm" action={setRole}>
                    <input type="hidden" name="id" value={String(user._id)} />
                    <input type="hidden" name="role" value={user.role} />
                </form>

                {/* Toolbar */}
                <div className="mt-4 grid gap-2 md:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
                    {/* Switch rôle */}
                    <div className="mt-1">
                        <AdminRoleSwitch currentRole={user.role} formId="roleForm" />
                    </div>

                    {/* Actions compte */}
                    <ConfirmAction
                        action={user.suspendedAt ? unsuspend : suspend}
                        title={user.suspendedAt ? 'Réactiver' : 'Suspendre'}
                        message={
                            user.suspendedAt
                                ? 'Cette action réactive immédiatement le compte. L’utilisateur pourra se reconnecter.'
                                : 'Cette action suspend immédiatement le compte. L’utilisateur ne pourra plus se connecter tant qu’il est suspendu.'
                        }
                        confirmLabel={user.suspendedAt ? 'Réactiver' : 'Suspendre'}
                        variant={user.suspendedAt ? 'success' : 'warn'}
                    >
                        <input type="hidden" name="id" value={String(user._id)} />
                    </ConfirmAction>

                    <ConfirmAction
                        action={user.deletedAt ? restore : archive}
                        title={user.deletedAt ? 'Restaurer' : 'Archiver'}
                        message={
                            user.deletedAt
                                ? 'Le compte sera de nouveau visible dans les listes et réactivé.'
                                : 'Le compte sera masqué (soft delete). Vous pourrez le restaurer plus tard.'
                        }
                        confirmLabel={user.deletedAt ? 'Restaurer' : 'Archiver'}
                        variant="neutral"
                    >
                        <input type="hidden" name="id" value={String(user._id)} />
                    </ConfirmAction>

                    <ConfirmAction
                        action={hardDelete}
                        title="Supprimer définitivement"
                        message="Action irréversible. Toutes les données de cet utilisateur seront supprimées. Confirmez-vous la suppression ?"
                        confirmLabel="Supprimer"
                        variant="danger"
                    >
                        <input type="hidden" name="id" value={String(user._id)} />
                    </ConfirmAction>
                </div>
            </section>

            {/* ===== Onglets Admin User ===== */}
            <UserTabs
                user={{
                    _id: String(user._id),
                    name: user.name ?? null,
                    email: user.email,
                    avatarUrl: user.avatarUrl ?? null,
                    theme: user.theme ?? 'system',
                    marketing: !!user.marketing,
                    productUpdates: !!user.productUpdates,
                    createdAt: user.createdAt ?? null,
                    passwordChangedAt: user.passwordChangedAt ?? null,
                    limits: user.limits ?? {},
                }}
                enrolls={enrollsClient}
                stats={stats}
                LimitsFormSlot={
                    <div className="rounded-2xl border border-gray-100 bg-white ring-1 ring-black/5 shadow-sm p-4">
                        <form action={setLimits} className="space-y-2">
                            <input type="hidden" name="id" value={String(user._id)} />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    name="maxConcurrentPrograms"
                                    defaultValue={user.limits?.maxConcurrentPrograms ?? ''}
                                    placeholder="Max"
                                    inputMode="numeric"
                                    className="col-span-1 rounded-md border px-2 py-1 text-xs"
                                />
                                <input
                                    name="features"
                                    defaultValue={(user.limits?.features ?? []).join(',')}
                                    placeholder="features: forum,chat"
                                    className="col-span-2 rounded-md border px-2 py-1 text-xs"
                                />
                            </div>
                            <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700 cursor-pointer">Enregistrer limites</button>
                        </form>
                        <div className="mt-3 text-sm">
                            MDP changé : <strong>{toIso(user.passwordChangedAt)}</strong>
                        </div>
                    </div>
                }
            />
        </div>
    );
}

/* ===== UI atoms ===== */
function Kpi({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-xl bg-white/80 ring-1 ring-black/5 p-3 border border-white/60">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="mt-1 lg font-semibold tabular-nums">{value}</div>
        </div>
    );
}
