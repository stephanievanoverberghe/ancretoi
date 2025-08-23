import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type SearchParams = { next?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const sess = await getSession();

    const { next } = (await searchParams) ?? {};
    const nextUrl = next ? decodeURIComponent(next) : '/member';

    if (sess?.email) redirect(nextUrl);

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-serif text-3xl">Connexion</h1>
            <LoginForm next={nextUrl} />
        </div>
    );
}
