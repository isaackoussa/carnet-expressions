// Enregistre l'abonnement aux notifications push d'un visiteur.

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) {
    return { statusCode: 500, body: JSON.stringify({ error: "NETLIFY_SITE_ID ou NETLIFY_AUTH_TOKEN manquant." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  const subscription = payload.subscription;
  if (!subscription || !subscription.endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Abonnement invalide' }) };
  }

  try {
    const store = getStore({ name: 'carnet-push-subscriptions', siteID, token });
    // Utilise l'endpoint (unique par abonnement) comme clé, encodé pour être un nom de clé valide.
    const key = Buffer.from(subscription.endpoint).toString('base64').slice(0, 190);
    await store.set(key, JSON.stringify(subscription));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
