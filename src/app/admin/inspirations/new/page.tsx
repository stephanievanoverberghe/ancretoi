import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
}

async function createInspiration(formData: FormData) {
    'use server';
    const me = await requireAdmin();
    await dbConnect();

    const title = String(formData.get('title') || '').trim();
    const slugRaw = String(formData.get('slug') || '').trim();
    const slug = slugRaw ? slugify(slugRaw) : slugify(title);
    const videoUrl = String(formData.get('videoUrl') || '').trim();
    const summary = String(formData.get('summary') || '').trim();
    const tagsStr = String(formData.get('tags') || '');
    const status = String(formData.get('status') || 'draft');

    if (!title || !videoUrl) throw new Error('Titre et URL vidéo requis.');

    await InspirationModel.create({
        title,
        slug,
        videoUrl,
        summary,
        tags: tagsStr
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        status: status === 'published' ? 'published' : 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        curatorEmail: me.email,
    });

    revalidatePath('/admin/inspirations');
}

export default async function NewInspirationPage() {
    await requireAdmin();
    return (
        <form action={createInspiration} className="mx-auto max-w-xl space-y-3">
            <h2 className="font-serif text-2xl">Nouvelle inspiration</h2>

            <input name="title" placeholder="Titre" className="input w-full" required />
            <input name="slug" placeholder="Slug (auto si vide)" className="input w-full" />
            <input name="videoUrl" placeholder="URL vidéo (YouTube/Vimeo/mp4)" className="input w-full" required />
            <textarea name="summary" placeholder="Résumé (optionnel)" className="input w-full h-20" />
            <input name="tags" placeholder="Tags (séparés par des virgules)" className="input w-full" />
            <select name="status" className="input w-full">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
            </select>

            <div className="flex gap-2">
                <button className="button" type="submit">
                    Créer
                </button>
                <a className="button secondary" href="/admin/inspirations">
                    Annuler
                </a>
            </div>
        </form>
    );
}
