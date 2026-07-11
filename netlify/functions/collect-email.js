// Enregistre l'email d'un visiteur avant de lui donner accès au site.
// Barrière simple : aucune vérification d'authenticité de l'email.

const { getStore } = require('@netlify/blobs');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  const email = (payload.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Format d'email invalide" }) };
  }

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "NETLIFY_SITE_ID ou NETLIFY_AUTH_TOKEN manquant dans les variables d'environnement du site." })
    };
  }

  try {
    const store = getStore({ name: 'carnet-emails', siteID, token });
    await store.set(email, JSON.stringify({ email, firstSeen: new Date().toISOString() }));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
