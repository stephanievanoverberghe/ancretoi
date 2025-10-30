import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import AdminUsersClient, { type UiUser } from './users-client';

// ⬇️ importe TOUTES les actions directement (le fichier actions.ts commence par "use server")
import {
    setRole,
    getUserDetail, // ⬅️ PAS de rename/wrapper
    archiveUser,
    restoreUser,
    suspendUser,
    unsuspendUser,
    hardDeleteUser,
    setUserLimits,
} from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type UserRawLean = {
    _id: import('mongoose').Types.ObjectId;
    name?: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAt: Date;
    avatarUrl?: string | null;
    deletedAt?: Date | null;
    suspendedAt?: Date | null;
};

export default async function AdminUsersPage() {
    const me = await requireAdmin();
    await dbConnect();

    const raw = await UserModel.find({})
        .select({
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
            avatarUrl: 1,
            deletedAt: 1,
            suspendedAt: 1,
        })
        .sort({ createdAt: -1 })
        .lean<UserRawLean[]>();

    const users: UiUser[] = raw.map((u) => ({
        _id: String(u._id),
        name: u.name?.trim() || null,
        email: u.email,
        role: u.role,
        createdAtIso: u.createdAt.toISOString(),
        avatarUrl: u.avatarUrl || null,
        isSelf: u.email === me.email,
        isArchived: !!u.deletedAt,
        isSuspended: !!u.suspendedAt,
    }));

    const stats = {
        total: users.length,
        admins: users.filter((u) => u.role === 'admin').length,
        active: users.filter((u) => !u.isArchived).length,
        archived: users.filter((u) => u.isArchived).length,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/admin" className="hover:underline">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Utilisateurs</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Utilisateurs</h1>
                <p className="text-sm text-muted-foreground mt-1">Recherche, filtres, modale détaillée, actions admin.</p>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-2xl font-semibold">{stats.total}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Admins</div>
                        <div className="text-2xl font-semibold">{stats.admins}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Actifs</div>
                        <div className="text-2xl font-semibold">{stats.active}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Archivés</div>
                        <div className="text-2xl font-semibold">{stats.archived}</div>
                    </div>
                </div>
            </div>

            {/* Grid/list (Client) */}
            <AdminUsersClient
                users={users}
                setRoleAction={setRole}
                getUserDetailAction={getUserDetail}
                archiveUserAction={archiveUser}
                restoreUserAction={restoreUser}
                suspendUserAction={suspendUser}
                unsuspendUserAction={unsuspendUser}
                hardDeleteUserAction={hardDeleteUser}
                setUserLimitsAction={setUserLimits}
            />
        </div>
    );
}
