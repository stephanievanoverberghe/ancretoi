import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
}

async function createPost(formData: FormData) {
    'use server';
    const me = await requireAdmin();
    await dbConnect();

    const title = String(formData.get('title') || '').trim();
    const slugRaw = String(formData.get('slug') || '').trim();
    const slug = slugRaw ? slugify(slugRaw) : slugify(title);
    const coverUrl = String(formData.get('coverUrl') || '').trim();
    const summary = String(formData.get('summary') || '').trim();
    const content = String(formData.get('content') || '').trim();
    const status = String(formData.get('status') || 'draft');

    if (!title || !slug) throw new Error('Titre et slug requis.');

    await PostModel.create({
        title,
        slug,
        coverUrl,
        summary,
        content,
        status: status === 'published' ? 'published' : 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        authorEmail: me.email,
    });

    revalidatePath('/admin/blog');
}

export default async function NewPostPage() {
    await requireAdmin();
    return (
        <form action={createPost} className="mx-auto max-w-xl space-y-3">
            <h2 className="font-serif text-2xl">Nouvel article</h2>

            <input name="title" placeholder="Titre" className="input w-full" required />
            <input name="slug" placeholder="Slug (auto si vide)" className="input w-full" />
            <input name="coverUrl" placeholder="Image de couverture (URL)" className="input w-full" />
            <textarea name="summary" placeholder="Résumé" className="input w-full h-20" />
            <textarea name="content" placeholder="Contenu (markdown/texte)" className="input w-full h-60" />
            <select name="status" className="input w-full">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
            </select>

            <div className="flex gap-2">
                <button className="button" type="submit">
                    Créer
                </button>
                <a className="button secondary" href="/admin/blog">
                    Annuler
                </a>
            </div>
        </form>
    );
}
