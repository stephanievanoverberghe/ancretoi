// src/app/api/me/streak/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';

/** Formate une date en YYYY-MM-DD (UTC simple pour cohérence serveur) */
function ymdUTC(d: Date) {
    return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
    const sess = await getSession();
    if (!sess?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Récupère l'utilisateur pour obtenir son _id
    const user = await UserModel.findOne({ email: sess.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown }>();

    if (!user?._id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Param days optionnel: /api/me/streak?days=90 (défaut 180, borne 14..365)
    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get('days') || '180');
    const days = Math.max(14, Math.min(365, Number.isFinite(daysParam) ? daysParam : 180));

    // Fenêtre temporelle
    const today = new Date(); // maintenant (UTC)
    const from = new Date(today);
    from.setUTCDate(today.getUTCDate() - (days - 1)); // inclut aujourd'hui

    // On s'appuie sur Enrollment.updatedAt comme proxy d'activité,
    // et on inclut startedAt / completedAt si présents.
    const enrollments = await Enrollment.find({
        userId: user._id,
        // On récupère tous les enrollments (même anciens) car updatedAt peut se trouver dans la fenêtre.
    })
        .select({ updatedAt: 1, startedAt: 1, completedAt: 1 })
        .lean<{ updatedAt?: Date; startedAt?: Date | null; completedAt?: Date | null }[]>();

    // Construit un Set des YYYY-MM-DD actifs
    const activeDays = new Set<string>();

    for (const e of enrollments) {
        if (e.updatedAt) {
            const d = e.updatedAt;
            if (d >= from && d <= today) activeDays.add(ymdUTC(d));
        }
        if (e.startedAt) {
            const d = e.startedAt;
            if (d >= from && d <= today) activeDays.add(ymdUTC(d));
        }
        if (e.completedAt) {
            const d = e.completedAt;
            if (d >= from && d <= today) activeDays.add(ymdUTC(d));
        }
    }

    // Génère la série du plus ancien au plus récent
    const rows: { dateISO: string; active: boolean }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setUTCDate(today.getUTCDate() - i);
        const key = ymdUTC(d);
        rows.push({ dateISO: key, active: activeDays.has(key) });
    }

    // Calcule le streak (depuis la fin)
    let streak = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].active) streak++;
        else break;
    }

    const totalActive = rows.reduce((s, r) => s + (r.active ? 1 : 0), 0);

    return NextResponse.json({ ok: true, days, rows, streak, totalActive }, { headers: { 'cache-control': 'no-store' } });
}
