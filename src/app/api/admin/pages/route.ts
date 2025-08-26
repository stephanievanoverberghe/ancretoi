import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { requireAdmin } from '@/lib/authz';
import { z } from 'zod';

const zBenefit = z.object({ icon: z.string().optional(), title: z.string(), text: z.string() });
const zQA = z.object({ q: z.string(), a: z.string() });
const zTestimonial = z.object({ name: z.string(), role: z.string().optional(), text: z.string(), avatar: z.string().optional() });
const zSeo = z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional() });

const zPageForm = z.object({
    programSlug: z.string().min(1),
    hero: z
        .object({
            eyebrow: z.string().optional(),
            title: z.string().optional(),
            subtitle: z.string().optional(),
            ctaLabel: z.string().optional(),
            ctaHref: z.string().optional(),
            heroImage: z.string().optional(),
        })
        .optional(),
    highlights: z.array(zBenefit),
    curriculum: z.array(z.string()),
    testimonials: z.array(zTestimonial),
    faq: z.array(zQA),
    seo: zSeo.optional(),
    status: z.enum(['draft', 'published']),
});

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();
    const body = await req.json();
    const data = zPageForm.parse(body);

    const doc = await ProgramPage.findOneAndUpdate({ programSlug: data.programSlug.toLowerCase() }, { $set: data }, { new: true, upsert: true }).lean();

    return NextResponse.json({ ok: true, page: doc });
}
