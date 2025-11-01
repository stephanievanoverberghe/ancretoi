import 'server-only';
import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import NewProgramForm from './components/NewProgramForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function NewProgramPage() {
    await requireAdmin();
    await dbConnect();

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-2xl border border-violet-200/40 bg-gradient-to-br from-violet-600/10 via-violet-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <nav className="text-xs text-gray-500">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/programs" className="hover:underline">
                                Programmes
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-gray-700">Nouveau</span>
                        </nav>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Créer une formation</h1>
                        <p className="text-sm text-gray-600 mt-1">Identité • Marketing • Pédagogie</p>
                    </div>
                    <Link href="/admin/programs" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Retour liste
                    </Link>
                </div>
            </div>

            <NewProgramForm />
        </div>
    );
}
