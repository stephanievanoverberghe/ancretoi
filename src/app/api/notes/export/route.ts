// src/app/api/notes/export/route.ts
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

type DayStateLean = {
    programSlug: string;
    day: number;
    data?: Record<string, string>;
    practiced?: boolean;
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
    const q = searchParams.get('q')?.trim() || '';

    const states = await DayState.find({
        userId: me._id,
        ...(program ? { programSlug: program } : {}),
    })
        .select<DayStateLean>({
            programSlug: 1,
            day: 1,
            data: 1,
            practiced: 1,
            completed: 1,
            updatedAt: 1,
        })
        .sort({ programSlug: 1, day: 1 })
        .lean<DayStateLean[]>();

    const filtered = q ? states.filter((s) => Object.values(s.data ?? {}).some((v) => v?.toLowerCase().includes(q.toLowerCase()))) : states;

    if (format === 'json') {
        const payload = {
            programSlug: program ?? 'all',
            userId: String(me._id),
            q: q || undefined,
            days: filtered.map((s) => ({
                programSlug: s.programSlug,
                day: s.day,
                data: s.data ?? {},
                practiced: Boolean(s.practiced),
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

    // -------- PDF --------
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

    const title = `Carnet — ${program ?? 'tous les programmes'} — ${me.email}${q ? ` — filtre: ${q}` : ''}`;
    draw(title, { bold: true, size: 14 });
    y -= 6;

    for (const s of filtered) {
        ensureSpace(120);
        draw(`${s.programSlug} — Jour ${s.day}${s.completed ? ' ✅' : ''}`, { bold: true });

        const flags: string[] = [];
        if (s.practiced) flags.push('pratique');
        if (s.completed) flags.push('terminé');
        draw(flags.length ? `Statut: ${flags.join(', ')}` : 'Statut: —');

        const entries = Object.entries(s.data ?? {});
        if (entries.length === 0) {
            draw('• (aucune réponse texte)');
        } else {
            for (const [k, v] of entries) {
                const lines = wrap(`${k}: ${v}`, 90);
                for (const line of lines) {
                    ensureSpace(60);
                    draw(`• ${line}`);
                }
            }
        }

        draw(`Dernière mise à jour: ${new Date(s.updatedAt).toLocaleString('fr-FR')}`);
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
