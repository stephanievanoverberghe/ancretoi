import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

type UserListItem = {
    _id: string;
    name?: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAt: Date;
};
type UserRaw = {
    _id: unknown;
    name?: string | null;
    email: string;
    role: 'user' | 'admin';
    createdAt: string | Date;
};

async function setRole(formData: FormData) {
    'use server';
    const me = await requireAdmin();
    await dbConnect();

    const userId = String(formData.get('userId') || '');
    const role = String(formData.get('role') || 'user') as 'user' | 'admin';
    if (!userId) throw new Error('userId requis');

    const self = await UserModel.findById(userId).select({ email: 1 }).lean<{ email: string } | null>();
    if (self?.email === me.email && role !== 'admin') {
        throw new Error("Tu ne peux pas te retirer l'admin toi-même.");
    }

    await UserModel.updateOne({ _id: userId }, { $set: { role } });
    revalidatePath('/admin/users');
}

export default async function AdminUsersPage() {
    await requireAdmin();
    await dbConnect();

    const raw = await UserModel.find({ deletedAt: null }).select({ name: 1, email: 1, role: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean<UserRaw[]>();

    const users: UserListItem[] = raw.map((u) => ({
        _id: String(u._id),
        name: u.name ?? null,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt),
    }));

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Utilisateurs</h2>

            <div className="card p-4">
                {!users.length ? (
                    <p className="text-muted-foreground">Aucun utilisateur.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {users.map((u) => (
                            <li key={u._id} className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{u.name || u.email}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {u.email} • {u.role}
                                        </div>
                                    </div>
                                    <form action={setRole} className="flex items-center gap-2">
                                        <input type="hidden" name="userId" value={u._id} />
                                        <select name="role" defaultValue={u.role} className="input">
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                        <button className="button" type="submit">
                                            Mettre à jour
                                        </button>
                                    </form>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
