import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

type PublicUser = { email: string; name?: string | null };

export default async function ProfilePage() {
    const sess = await getSession();
    if (!sess?.email) {
        // protégé par le middleware, mais on évite l'accès direct
        return null;
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email })
        .select({ email: 1, name: 1, _id: 0 })
        .lean<PublicUser>() // ✅ on "type" le résultat lean
        .exec();

    return (
        <div className="space-y-4 py-16 sm:py-20 lg:py-24">
            <h1 className="text-3xl font-semibold">Mon profil</h1>
            <div className="rounded-xl border border-border bg-card p-4">
                <p>
                    <strong>E-mail :</strong> {user?.email}
                </p>
                <p>
                    <strong>Prénom :</strong> {user?.name ?? '—'}
                </p>
            </div>
        </div>
    );
}
