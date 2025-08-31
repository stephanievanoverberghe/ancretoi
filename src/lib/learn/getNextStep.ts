import 'server-only';
import { Types } from 'mongoose';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';

type NextStep =
    | { type: 'none'; href: '/programs' }
    | { type: 'intro'; href: `/learn/${string}/intro` }
    | { type: 'day'; href: `/learn/${string}/day/${string}` }
    | { type: 'summary'; href: '/member/bilan' };

export async function getNextStepForUser(userObjectId: Types.ObjectId): Promise<NextStep> {
    const enr = await Enrollment.findOne({ userId: userObjectId })
        .select({ programSlug: 1, status: 1, currentDay: 1, updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .lean<{ programSlug: string; status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>();

    if (!enr) return { type: 'none', href: '/programs' };

    const slug = enr.programSlug.toLowerCase();
    const totalDays = await Unit.countDocuments({ programSlug: slug, unitType: 'day' });
    if (!totalDays) return { type: 'none', href: '/programs' };

    if (enr.status === 'completed') return { type: 'summary', href: '/member/bilan' };

    const current = Math.max(1, Math.min(totalDays, enr.currentDay ?? 1));

    if (current === 1) {
        const hasAnyStateJ1 = await DayState.exists({ userId: userObjectId, programSlug: slug, day: 1 });
        if (!hasAnyStateJ1) return { type: 'intro', href: `/learn/${slug}/intro` };
    }

    const dayStr = String(current).padStart(2, '0');
    return { type: 'day', href: `/learn/${slug}/day/${dayStr}` };
}
