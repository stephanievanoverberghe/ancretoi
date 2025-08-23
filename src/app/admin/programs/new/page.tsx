import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { ProgramModel } from '@/db/schemas';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
}

async function createProgram(formData: FormData) {
    'use server';
    await requireAdmin();
    await dbConnect();

    const title = String(formData.get('title') || '').trim();
    const slugRaw = String(formData.get('slug') || '')
        .trim()
        .toLowerCase();
    const slug = slugRaw ? slugify(slugRaw) : slugify(title);
    const summary = String(formData.get('summary') || '').trim();
    const status = String(formData.get('status') || 'draft');

    if (!title || !slug) throw new Error('Titre et slug requis.');
    await ProgramModel.create({ title, slug, summary, status });
    revalidatePath('/admin/programs');
}

export default async function NewProgramPage() {
    await requireAdmin();
    return (
        <form action={createProgram} className="mx-auto max-w-xl space-y-3">
            <h2 className="font-serif text-2xl">Nouveau parcours</h2>

            <input name="title" placeholder="Titre (ex. Reset 7)" className="input w-full" required />
            <input name="slug" placeholder="Slug (ex. reset-7)" className="input w-full" />
            <textarea name="summary" placeholder="Résumé" className="input w-full h-28" />
            <select name="status" className="input w-full">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
            </select>

            <div className="flex gap-2">
                <button className="button" type="submit">
                    Créer
                </button>
                <a className="button secondary" href="/admin/programs">
                    Annuler
                </a>
            </div>
        </form>
    );
}
