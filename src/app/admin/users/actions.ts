// src/app/admin/users/actions.ts
'use server';

import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { UserModel, ProgramModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import type { UiUserDetail, UiEnrollment } from './users-client';

type ObjId = Types.ObjectId;

// ----- Lean types stricts -----
type UserLean = {
    _id: ObjId;
    name?: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAt: Date;
    avatarUrl?: string | null;
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
    passwordChangedAt?: Date | null;
    deletedAt?: Date | null;
    suspendedAt?: Date | null;
    limits?: {
        maxConcurrentPrograms?: number | null;
        features?: string[]; // ex: ['forum','chat','downloads']
    };
};

type EnrollmentLean = {
    _id: ObjId;
    userId: ObjId;
    programSlug: string;
    status: 'active' | 'completed' | 'paused';
    startedAt?: Date | null;
    updatedAt?: Date | null;
    currentDay?: number | null;
};

type ProgramLean = {
    slug: string;
    title: string;
    coverUrl?: string | null;
    meta?: { level: 'Basique' | 'Cible' | 'Premium' | null };
    stats?: { unitsCount?: number };
};

// ----- Garde "dernier admin" -----
async function guardLastAdmin(downgradeEmail: string, nextRole: 'user' | 'admin') {
    if (nextRole === 'admin') return;
    const adminCount = await UserModel.countDocuments({ role: 'admin', deletedAt: null });
    if (adminCount <= 1) {
        const last = await UserModel.findOne({ role: 'admin', deletedAt: null }).select({ email: 1 }).lean<{ email: string } | null>();
        if (last?.email === downgradeEmail) {
            throw new Error('Tu es le dernier admin — impossible de te rétrograder.');
        }
    }
}

// ----- setRole -----
export async function setRole(formData: FormData) {
    const me = await requireAdmin();
    await dbConnect();

    const userId = String(formData.get('userId') || '');
    const role = String(formData.get('role') || 'user') as 'user' | 'admin';
    if (!userId) throw new Error('userId requis');

    const target = await UserModel.findById(userId).select({ email: 1 }).lean<{ email: string } | null>();
    if (!target) throw new Error('Utilisateur introuvable');
    if (target.email === me.email && role !== 'admin') {
        throw new Error("Tu ne peux pas te retirer l'admin toi-même.");
    }
    await guardLastAdmin(target.email, role);

    await UserModel.updateOne({ _id: userId }, { $set: { role } });
    revalidatePath('/admin/users');
}

// ----- getUserDetail -----
export async function getUserDetail(formData: FormData): Promise<UiUserDetail> {
    await requireAdmin();
    await dbConnect();

    const userIdRaw = String(formData.get('userId') || '');
    if (!userIdRaw) throw new Error('userId requis');

    const u = await UserModel.findById(userIdRaw)
        .select({
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
            avatarUrl: 1,
            theme: 1,
            marketing: 1,
            productUpdates: 1,
            passwordChangedAt: 1,
            deletedAt: 1,
            suspendedAt: 1,
            limits: 1,
        })
        .lean<UserLean | null>();
    if (!u) throw new Error('Utilisateur introuvable');

    const enr = await Enrollment.find({ userId: u._id }).select({ programSlug: 1, status: 1, startedAt: 1, updatedAt: 1, currentDay: 1 }).lean<EnrollmentLean[]>();

    const slugs = Array.from(new Set(enr.map((e) => e.programSlug))).filter(Boolean);
    const programs = slugs.length
        ? await ProgramModel.find({ slug: { $in: slugs } })
              .select({ slug: 1, title: 1, coverUrl: 1, 'meta.level': 1, 'stats.unitsCount': 1 })
              .lean<ProgramLean[]>()
        : [];

    const bySlug = new Map<string, ProgramLean>(programs.map((p) => [p.slug, p]));

    const enrollments: UiEnrollment[] = enr.map((e) => {
        const p = bySlug.get(e.programSlug);
        const units = typeof p?.stats?.unitsCount === 'number' ? p.stats!.unitsCount! : null;
        const cd = typeof e.currentDay === 'number' ? e.currentDay! : null;
        const progressPct = units && units > 0 && cd != null ? Math.max(0, Math.min(100, Math.round((cd / units) * 100))) : null;

        return {
            programSlug: e.programSlug,
            programTitle: p?.title ?? e.programSlug,
            coverUrl: p?.coverUrl ?? null,
            level: p?.meta?.level ?? null,
            status: e.status,
            startedAtIso: e.startedAt ? new Date(e.startedAt).toISOString() : null,
            updatedAtIso: e.updatedAt ? new Date(e.updatedAt).toISOString() : null,
            progressPct,
            currentDay: cd,
            unitsCount: units,
        };
    });

    return {
        _id: String(u._id),
        name: u.name?.trim() || null,
        email: u.email,
        role: u.role,
        createdAtIso: u.createdAt.toISOString(),
        avatarUrl: u.avatarUrl || null,
        theme: u.theme,
        marketing: !!u.marketing,
        productUpdates: !!u.productUpdates,
        passwordChangedAtIso: u.passwordChangedAt ? new Date(u.passwordChangedAt).toISOString() : null,
        enrollments,
        isArchived: !!u.deletedAt,
        isSuspended: !!u.suspendedAt,
        limits: {
            maxConcurrentPrograms: u.limits?.maxConcurrentPrograms ?? null,
            features: u.limits?.features ?? [],
        },
    };
}

// ----- archive / restore -----
export async function archiveUser(formData: FormData) {
    await requireAdmin();
    await dbConnect();
    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('userId requis');

    await UserModel.updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });
    revalidatePath('/admin/users');
}

export async function restoreUser(formData: FormData) {
    await requireAdmin();
    await dbConnect();
    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('userId requis');

    await UserModel.updateOne({ _id: userId }, { $set: { deletedAt: null } });
    revalidatePath('/admin/users');
}

// ----- suspend / unsuspend -----
export async function suspendUser(formData: FormData) {
    await requireAdmin();
    await dbConnect();
    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('userId requis');

    await UserModel.updateOne({ _id: userId }, { $set: { suspendedAt: new Date() } });
    revalidatePath('/admin/users');
}

export async function unsuspendUser(formData: FormData) {
    await requireAdmin();
    await dbConnect();
    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('userId requis');

    await UserModel.updateOne({ _id: userId }, { $set: { suspendedAt: null } });
    revalidatePath('/admin/users');
}

// ----- hard delete (irréversible) -----
export async function hardDeleteUser(formData: FormData) {
    await requireAdmin();
    await dbConnect();
    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('userId requis');

    await UserModel.deleteOne({ _id: userId });
    // (optionnel) supprimer ou anonymiser ses enrollments
    // await Enrollment.deleteMany({ userId: userId });

    revalidatePath('/admin/users');
}

// ----- setUserLimits -----
export async function setUserLimits(formData: FormData) {
    await requireAdmin();
    await dbConnect();

    const userId = String(formData.get('userId') || '');
    const maxConcurrentPrograms = formData.get('maxConcurrentPrograms');
    const featuresRaw = String(formData.get('features') || ''); // "forum,chat"

    if (!userId) throw new Error('userId requis');

    const mcp = typeof maxConcurrentPrograms === 'string' && maxConcurrentPrograms.trim() !== '' ? Number(maxConcurrentPrograms) : null;

    const features = featuresRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    await UserModel.updateOne({ _id: userId }, { $set: { limits: { maxConcurrentPrograms: mcp, features } } });

    revalidatePath('/admin/users');
}
