import 'server-only';
import { requireAdmin } from '@/lib/authz';

export default async function NewProgramPage() {
    await requireAdmin();
    return (
        <form action="/api/admin/programs" method="POST" className="max-w-xl space-y-3 p-6">
            <h1 className="text-2xl font-semibold">Nouveau programme</h1>
            <input name="slug" placeholder="slug (ex: r7)" className="border rounded p-2 w-full" />
            <input name="title" placeholder="Titre (ex: RESET-7)" className="border rounded p-2 w-full" />
            <select name="status" className="border rounded p-2 w-full">
                <option value="draft">draft</option>
                <option value="published">published</option>
            </select>
            <button className="px-4 py-2 rounded bg-purple-600 text-white">Créer</button>
        </form>
    );
}
