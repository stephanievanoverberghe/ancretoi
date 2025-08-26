// src/app/api/state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import State from '@/models/State';

/* ------------------ Résolution userId (ObjectId) via session ------------------ */
async function getCurrentUserObjectId(): Promise<Types.ObjectId | null> {
    const sess = await getSession();
    const email = sess?.email;
    if (!email) return null;

    await dbConnect();
    // On ne récupère que l'_id pour typer proprement
    const user = await UserModel.findOne({ email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId }>().exec();

    return user?._id ?? null;
}

/* ------------------ Types du journal ------------------ */
type FieldBase = { id: string; label: string; required?: boolean };
type FieldText = FieldBase & { type: 'text_short' | 'text_long'; minLen?: number; maxLen?: number };
type FieldSlider = FieldBase & { type: 'slider'; min?: number; max?: number; step?: number };
type FieldCheckbox = FieldBase & { type: 'checkbox' };
type FieldChips = FieldBase & { type: 'chips'; options?: string[] };
type FieldScoreGroup = FieldBase & { type: 'score_group' };
type Field = FieldText | FieldSlider | FieldCheckbox | FieldChips | FieldScoreGroup;

type UnitLean = {
    _id: Types.ObjectId;
    unitIndex: number;
    journalSchema?: { fields: Field[] };
};

type PutBody = {
    programSlug: string;
    unitId: string;
    data?: Record<string, unknown>;
    sliders?: Record<string, number>;
    practiced?: boolean;
    completed?: boolean;
};

/* ------------------ Validation champs requis ------------------ */
function isRequiredFieldFilled(field: Field, data: Record<string, unknown>): boolean {
    const v = data[field.id];

    if (field.type === 'text_short' || field.type === 'text_long') {
        if (typeof v !== 'string') return false;
        const min = field.minLen ?? 1;
        return v.trim().length >= min;
    }
    if (field.type === 'slider') {
        return typeof v === 'number';
    }
    if (field.type === 'checkbox') {
        return v === true;
    }
    if (field.type === 'chips') {
        return Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : false;
    }
    if (field.type === 'score_group') {
        // conteneur non bloquant
        return true;
    }
    return true;
}

/* ------------------ Type guard pour enr.currentDay sans any ------------------ */
type EnrWithProgress = {
    currentDay: number;
    status: 'active' | 'completed' | 'paused';
    completedAt?: Date | null;
    save: () => Promise<unknown>;
};
function hasProgressFields(e: unknown): e is EnrWithProgress {
    return (
        !!e &&
        typeof e === 'object' &&
        'currentDay' in e &&
        typeof (e as { currentDay: unknown }).currentDay === 'number' &&
        'status' in e &&
        typeof (e as { status: unknown }).status === 'string' &&
        'save' in e &&
        typeof (e as { save: unknown }).save === 'function'
    );
}

/* ------------------ Handler ------------------ */
export async function PUT(req: NextRequest) {
    await dbConnect();

    // 🔐 userId depuis la session (pas d’en-tête custom)
    const userObjectId = await getCurrentUserObjectId();
    if (!userObjectId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await req.json()) as PutBody;
    const { programSlug, unitId, data = {}, sliders = {}, practiced = false, completed } = body;

    // Vérifie l’inscription au programme
    const enr = await Enrollment.findOne({ userId: userObjectId, programSlug });
    if (!enr) return NextResponse.json({ error: 'no_enrollment' }, { status: 403 });

    // Charge l’unité
    const unit = await Unit.findById(unitId).lean<UnitLean | null>();
    if (!unit) return NextResponse.json({ error: 'unit_not_found' }, { status: 404 });

    // Validation auto des champs requis
    const fields = unit.journalSchema?.fields ?? [];
    const okFields = fields.filter((f) => f.required).every((f) => isRequiredFieldFilled(f, data));

    const autoCompleted = typeof completed === 'boolean' ? completed : practiced && okFields;

    // Upsert de l’état du jour
    await State.updateOne({ enrollmentId: enr._id, unitId: unit._id }, { $set: { data, sliders, practiced, completed: autoCompleted } }, { upsert: true });

    // Avancement (si ton modèle Enrollment gère currentDay)
    if (autoCompleted && hasProgressFields(enr) && enr.currentDay === unit.unitIndex) {
        enr.currentDay = Math.min(90, enr.currentDay + 1);
        if (programSlug === 'reset-7' && unit.unitIndex === 7) {
            enr.status = 'completed';
            enr.completedAt = new Date();
        }
        await enr.save();
    }

    return NextResponse.json({ ok: true, completed: autoCompleted });
}
