// src/lib/analytics.server.ts
import 'server-only';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import Newsletter from '@/models/Newsletter';
import { PostModel, InspirationModel, UserModel } from '@/db/schemas';

export type SeriesPoint = { label: string; value: number };
export type TopItem = { label: string; value: number };

export type AdminAnalytics = {
    newsletterWeekly: SeriesPoint[]; // dernières 12 semaines
    usersMonthly: SeriesPoint[]; // derniers 6 mois
    postsMonthly: SeriesPoint[]; // derniers 6 mois (publiés)
    inspMonthly: SeriesPoint[]; // derniers 6 mois (publiés)
    topNewsletterSources: TopItem[]; // top 5
};

function labelWeek(d: Date) {
    // label court semaine = “dd/mm”
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
function labelMonth(d: Date) {
    return d.toLocaleDateString('fr-FR', { month: 'short' }); // “sept.”, “oct.”
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
    await requireAdmin();
    await dbConnect();

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5); // inclut le mois courant (6 points)
    sixMonthsAgo.setDate(1);

    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(now.getDate() - 7 * 11); // 12 points (courant inclus)

    // Helper: Group by $dateTrunc (MongoDB 5+). Si ta version est <5, on pourra fallback côté Node.
    const weekly = await Newsletter.aggregate<{ _id: Date; count: number }>([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        {
            $group: {
                _id: { $dateTrunc: { date: '$createdAt', unit: 'week' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]).exec();

    const users = await UserModel.aggregate<{ _id: Date; count: number }>([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateTrunc: { date: '$createdAt', unit: 'month' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]).exec();

    const posts = await PostModel.aggregate<{ _id: Date; count: number }>([
        { $match: { status: 'published', createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateTrunc: { date: '$createdAt', unit: 'month' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]).exec();

    const insp = await InspirationModel.aggregate<{ _id: Date; count: number }>([
        { $match: { status: 'published', createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateTrunc: { date: '$createdAt', unit: 'month' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]).exec();

    const sources = await Newsletter.aggregate<{ _id: string | null; count: number }>([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
    ]).exec();

    return {
        newsletterWeekly: weekly.map((w) => ({ label: labelWeek(w._id), value: w.count })),
        usersMonthly: users.map((m) => ({ label: labelMonth(m._id), value: m.count })),
        postsMonthly: posts.map((m) => ({ label: labelMonth(m._id), value: m.count })),
        inspMonthly: insp.map((m) => ({ label: labelMonth(m._id), value: m.count })),
        topNewsletterSources: sources.map((s) => ({ label: s._id ?? 'site', value: s.count })),
    };
}
