// src/app/admin/programs/[slug]/edit/page.tsx

import 'server-only';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPageModel, { type ProgramPageDoc } from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import EditProgramForm, { type EditProgramFormShape } from './components/EditProgramForm';
import UpdateSuccessModal from '../../components/UpdateSuccessModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function slugify(s: string) {
    return (s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// type minimal pour Unit côté lean (uniquement ce qu’on lit)
type UnitLean = {
    unitIndex?: number | null;
    title?: string | null;
    videoUrl?: string | null;
    mantra?: string | null;
    contentParagraphs?: string[] | null;
};

export default async function EditProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    const { slug } = await params;
    const programSlug = slugify(slug);

    const page = await ProgramPageModel.findOne({ programSlug }).lean<ProgramPageDoc>();
    if (!page) return notFound();

    const units = await Unit.find({ programSlug }).sort({ unitIndex: 1 }).lean<UnitLean[]>();

    // Reconstituer "idealIf" et "benefits" (max 3) depuis highlights
    const highlights = Array.isArray(page.highlights) ? page.highlights : [];
    const idealIfFromHighlights = highlights.find((h) => (h?.title || '').toLowerCase().startsWith('idéal si'));
    const benefits = highlights
        .filter((h) => !(h?.title || '').toLowerCase().startsWith('idéal si'))
        .slice(0, 3)
        .map((b) => ({ icon: b?.icon || '', title: b?.title || '', text: b?.text || '' }));

    const initial: EditProgramFormShape = {
        slug: programSlug,
        title: page.hero?.title || '',
        status: (page.status as 'draft' | 'preflight' | 'published') || 'draft',
        level: (page.meta?.level as 'Basique' | 'Cible' | 'Premium') || 'Basique',
        durationDays: page.meta?.durationDays || 7,
        estMinutesPerDay: page.meta?.estMinutesPerDay || 20,
        priceCents: page.price?.amountCents ?? null,
        marketing: {
            hero: {
                title: page.hero?.title || '',
                subtitle: page.hero?.subtitle || '',
                ctaHref: page.hero?.ctaHref || '',
                heroImage: page.hero?.heroImage?.url || '',
            },
            objective: page.card?.summary || '',
            durationLabel: page.card?.tagline || '',
            idealIf: idealIfFromHighlights?.text || '',
            benefits,
            faq: (Array.isArray(page.faq) ? page.faq : []).map((f) => ({ q: f?.q || '', a: f?.a || '' })),
            seo: {
                title: page.seo?.title || '',
                description: page.seo?.description || '',
                image: page.seo?.image || '',
            },
        },
        days: units.map((u) => ({
            title: u?.title || `J${u?.unitIndex ?? 0}`,
            videoUrl: u?.videoUrl || '',
            mantra: u?.mantra || '',
            description: Array.isArray(u?.contentParagraphs) ? u.contentParagraphs.join('\n') : '',
        })),
    };

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
                            <span className="text-gray-700">{programSlug}</span>
                        </nav>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Éditer une formation</h1>
                        <p className="text-sm text-gray-600 mt-1">Identité • Marketing • Pédagogie • SEO</p>
                    </div>
                    <Link href="/admin/programs" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Retour liste
                    </Link>
                </div>
            </div>

            <UpdateSuccessModal />
            <EditProgramForm initialData={initial} />
        </div>
    );
}
