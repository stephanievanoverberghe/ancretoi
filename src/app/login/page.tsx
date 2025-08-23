import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function Page({ searchParams }: { searchParams?: { next?: string } }) {
    const sess = await getSession();

    // URL de destination après connexion (défaut: /member)
    const nextUrl = (searchParams?.next && decodeURIComponent(searchParams.next)) || '/member';

    // Déjà connectée → redirige vers next
    if (sess?.email) redirect(nextUrl);

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-serif text-3xl">Connexion</h1>
            <LoginForm next={nextUrl} />
        </div>
    );
}
