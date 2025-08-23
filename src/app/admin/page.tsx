import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { ProgramModel, PostModel, InspirationModel, UserModel } from '@/db/schemas';

export default async function AdminHome() {
    await requireAdmin();
    await dbConnect();

    const [programs, posts, videos, users] = await Promise.all([
        ProgramModel.countDocuments(),
        PostModel.countDocuments({ status: 'published' }),
        InspirationModel.countDocuments({ status: 'published' }),
        UserModel.countDocuments({ deletedAt: null }),
    ]);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-4">
                <div className="text-sm text-muted-foreground">Parcours</div>
                <div className="mt-1 text-2xl font-semibold">{programs}</div>
            </div>
            <div className="card p-4">
                <div className="text-sm text-muted-foreground">Articles publiés</div>
                <div className="mt-1 text-2xl font-semibold">{posts}</div>
            </div>
            <div className="card p-4">
                <div className="text-sm text-muted-foreground">Inspirations publiées</div>
                <div className="mt-1 text-2xl font-semibold">{videos}</div>
            </div>
            <div className="card p-4">
                <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
                <div className="mt-1 text-2xl font-semibold">{users}</div>
            </div>
        </div>
    );
}
