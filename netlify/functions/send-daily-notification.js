// Fonction planifiée : envoyée automatiquement chaque jour à 18h (heure d'Abidjan = UTC),
// selon la configuration "schedule" dans netlify.toml.
// Envoie une notification push à tous les abonnés avec l'expression du jour.

const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');
const ENTRIES = require('./entries-data.json');

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

function wordOfDayEntry() {
  const idx = dayOfYear(new Date()) % ENTRIES.length;
  return ENTRIES[idx];
}

exports.handler = async () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!siteID || !token || !vapidPublicKey || !vapidPrivateKey) {
    console.error('Variables manquantes pour l\'envoi des notifications.');
    return { statusCode: 500, body: 'Configuration manquante' };
  }

  webpush.setVapidDetails('mailto:notifications@carnet-expressions.app', vapidPublicKey, vapidPrivateKey);

  const entry = wordOfDayEntry();
  const notifPayload = JSON.stringify({
    title: "Expression du jour 🔊",
    body: `${entry.expression} — ${entry.traduction}`,
    url: '/'
  });

  const store = getStore({ name: 'carnet-push-subscriptions', siteID, token });
  const { blobs } = await store.list();

  let sent = 0;
  let removed = 0;

  for (const blob of blobs) {
    try {
      const raw = await store.get(blob.key);
      if (!raw) continue;
      const subscription = JSON.parse(raw);
      await webpush.sendNotification(subscription, notifPayload);
      sent++;
    } catch (e) {
      // Abonnement expiré ou invalide : on le supprime pour ne plus réessayer.
      if (e.statusCode === 404 || e.statusCode === 410) {
        await store.delete(blob.key);
        removed++;
      } else {
        console.error('Erreur envoi notification', e.message);
      }
    }
  }

  console.log(`Notifications envoyées: ${sent}, abonnements supprimés: ${removed}`);
  return { statusCode: 200, body: JSON.stringify({ sent, removed }) };
};
