import { randomBytes } from 'crypto';
import { Resend } from 'resend';
import { MagicTokenModel } from '@/db/schemas';

export async function issueMagicLink(email: string, next?: string) {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await MagicTokenModel.create({ email: email.toLowerCase(), token, expiresAt, next });

    const url = `${process.env.APP_URL}/api/auth/callback?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.RESEND_FROM || 'orangestreet@live.fr',
            to: email,
            subject: 'Votre lien de connexion — Ancre-toi',
            html: `<p>Se connecter :</p><p><a href="${url}">${url}</a></p><p>Ce lien expire dans 15 minutes.</p>`,
        });
    } else {
        console.log('[DEV] Magic link:', url); // fallback dev
    }
}
