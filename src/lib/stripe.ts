import Stripe from 'stripe';

export function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    // Laisse Stripe utiliser sa "LatestApiVersion" par défaut pour éviter les erreurs de typage.
    return new Stripe(key);
}
