import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import type { Types } from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type SliderBlock = {
    energie?: number;
    focus?: number;
    paix?: number;
    estime?: number;
};

type DayStateLean = {
    programSlug: string;
    day: number;
    data?: Record<string, string>;
    sliders?: SliderBlock;
    checkout?: SliderBlock;
    practiced?: boolean;
    mantra3x?: boolean;
    completed?: boolean;
    updatedAt: Date;
};

type MeLean = {
    _id: Types.ObjectId;
    email: string;
};

export async function GET(req: NextRequest) {
    await dbConnect();

    const session = await requireUser('/login');
    const me = await UserModel.findOne({ email: session.email }).select<MeLean>({ _id: 1, email: 1 }).lean<MeLean | null>();

    if (!me?._id) {
        return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') ?? 'json').toLowerCase(); // json | pdf
    const program = searchParams.get('program') ?? undefined;

    const states = await DayState.find({
        userId: me._id,
        ...(program ? { programSlug: program } : {}),
    })
        .select<DayStateLean>({
            programSlug: 1,
            day: 1,
            data: 1,
            sliders: 1,
            checkout: 1,
            practiced: 1,
            mantra3x: 1,
            completed: 1,
            updatedAt: 1,
        })
        .sort({ programSlug: 1, day: 1 })
        .lean<DayStateLean[]>();

    if (format === 'json') {
        const payload = {
            programSlug: program ?? 'all',
            userId: String(me._id),
            days: states.map((s) => ({
                programSlug: s.programSlug,
                day: s.day,
                data: s.data ?? {},
                sliders: s.sliders ?? {},
                checkout: s.checkout ?? {},
                practiced: Boolean(s.practiced),
                mantra3x: Boolean(s.mantra3x),
                completed: Boolean(s.completed),
                updatedAt: s.updatedAt,
            })),
        };

        return new NextResponse(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="notes-${program ?? 'all'}.json"`,
                'Cache-Control': 'no-store',
            },
        });
    }

    // -------- PDF (pdf-lib) --------
    const pdf = await PDFDocument.create();
    const pageSize: [number, number] = [595.28, 841.89]; // A4 portrait
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const addPage = () => pdf.addPage(pageSize);
    let page: PDFPage = addPage();
    let x = 50;
    let y = 800;

    const draw = (text: string, opts?: { bold?: boolean; size?: number }) => {
        const size = opts?.size ?? 10;
        const bold = opts?.bold ?? false;
        page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
        y -= size + 4;
    };

    const ensureSpace = (minY: number) => {
        if (y < minY) {
            page = addPage();
            x = 50;
            y = 800;
        }
    };

    const title = `Carnet — ${program ?? 'tous les programmes'} — ${me.email}`;
    draw(title, { bold: true, size: 14 });
    y -= 4;

    const avg = (key: keyof SliderBlock, field: 'sliders' | 'checkout') => {
        const vals: number[] = [];
        for (const s of states) {
            const v = s[field]?.[key];
            if (typeof v === 'number') vals.push(v);
        }
        if (vals.length === 0) return '—';
        const m = vals.reduce((a, b) => a + b, 0) / vals.length;
        return m.toFixed(1);
    };

    draw(`Moyennes (avant → après)`, { bold: true });
    draw(`Énergie : ${avg('energie', 'sliders')} → ${avg('energie', 'checkout')}`);
    draw(`Focus   : ${avg('focus', 'sliders')} → ${avg('focus', 'checkout')}`);
    draw(`Paix    : ${avg('paix', 'sliders')} → ${avg('paix', 'checkout')}`);
    draw(`Estime  : ${avg('estime', 'sliders')} → ${avg('estime', 'checkout')}`);
    y -= 6;

    for (const s of states) {
        ensureSpace(120);
        draw(`${s.programSlug} — Jour ${s.day}${s.completed ? ' ✅' : ''}`, { bold: true });

        const dataEntries = Object.entries(s.data ?? {}) as Array<[string, string]>;
        if (dataEntries.length === 0) {
            draw('• (aucune réponse texte)');
        } else {
            for (const [k, v] of dataEntries) {
                const lines = wrap(`${k}: ${v}`, 90);
                for (const line of lines) {
                    ensureSpace(60);
                    draw(`• ${line}`);
                }
            }
        }

        const before = `Avant — É:${s.sliders?.energie ?? '—'} F:${s.sliders?.focus ?? '—'} P:${s.sliders?.paix ?? '—'} E:${s.sliders?.estime ?? '—'}`;
        const after = `Après — É:${s.checkout?.energie ?? '—'} F:${s.checkout?.focus ?? '—'} P:${s.checkout?.paix ?? '—'} E:${s.checkout?.estime ?? '—'}`;
        draw(before);
        draw(after);
        y -= 6;
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="carnet-${program ?? 'all'}.pdf"`,
            'Cache-Control': 'no-store',
        },
    });
}

function wrap(text: string, width = 90): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
        const next = (line ? line + ' ' : '') + w;
        if (next.length > width) {
            if (line) lines.push(line);
            line = w;
        } else {
            line = next;
        }
    }
    if (line) lines.push(line);
    return lines;
}
