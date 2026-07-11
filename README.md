# Carnet d'Expressions Anglaises — avec barrière email

Cette version ajoute un écran demandant l'email du visiteur avant de pouvoir utiliser le site. C'est une barrière simple, sans vérification d'authenticité (n'importe qui peut taper un email fictif) — utile pour freiner l'accès occasionnel ou constituer une liste de contacts, pas une vraie sécurité.

⚠️ Contrairement à la version 100% statique précédente, celle-ci utilise une fonction serveur (pour enregistrer les emails) — le glisser-déposer simple ne fonctionnera plus. Il faut passer par GitHub.

## Étape 1 — Déployer via GitHub

1. Crée un dépôt GitHub et envoie ce dossier dedans :
   ```bash
   git init
   git add .
   git commit -m "Ajout barrière email"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/carnet-expressions-anglaises.git
   git push -u origin main
   ```
2. Sur https://app.netlify.com : **Add new project → Import an existing project → GitHub** → choisis ce dépôt.
3. Netlify détecte `netlify.toml` automatiquement (dossier `public` + fonctions) → **Deploy**.

## Étape 2 — Si tu avais déjà un site en ligne (carnetanglais.netlify.app)

Si ton site actuel a été déployé par glisser-déposer, il n'est pas connecté à un dépôt Git — tu ne peux donc pas juste le "mettre à jour", il faut soit :
- **Remplacer le site existant** : sur le tableau de bord de ton site → **Site configuration → Build & deploy → Link repository**, puis connecte le nouveau dépôt GitHub.
- **Ou créer un nouveau site** et rediriger l'ancien lien vers le nouveau (via **Domain management**).

## Comment ça marche pour un visiteur

1. À l'arrivée sur le site, un écran demande son email.
2. Il tape un email valide (format vérifié, mais pas son existence réelle) et clique "Continuer".
3. L'email est enregistré dans Netlify Blobs (consultable uniquement par toi, dans le tableau de bord Netlify sous **Blobs**).
4. Le site se débloque, et reste débloqué pour ce visiteur sur cet appareil/navigateur (mémorisé localement) — il ne verra plus l'écran email lors de ses prochaines visites depuis le même appareil.

## Consulter les emails collectés

Sur le tableau de bord Netlify de ton site : menu de gauche → **Blobs** → store `carnet-emails`. Chaque entrée correspond à un email avec sa date de première visite.

## Nouveau : notifications quotidiennes (expression du jour à 18h)

Cette version envoie une vraie notification push chaque jour à 18h (heure d'Abidjan = UTC), même quand le site n'est pas ouvert.

### Configuration requise

En plus de `NETLIFY_SITE_ID` et `NETLIFY_AUTH_TOKEN` déjà configurées, ajoute ces deux nouvelles variables d'environnement dans **Project configuration → Environment variables** :

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | `BJNH5vJP0MjV49zfasQFmHZpBTxdqlJ-YYn-FXdvVlVcTNCza3vv3Y_PMPX7T3VDuVR6a5g1VlvVmida1ooC7_Q` |
| `VAPID_PRIVATE_KEY` | `fUMY4RF2Y7u_PDg1XbcIZpYnisEc14UwicYs_j6caVQ` |

⚠️ Ces clés sont déjà générées et intégrées dans le code (la clé publique est aussi dans `public/index.html`). Ne les partage pas publiquement au-delà de ce projet — si tu veux en générer de nouvelles toi-même, la commande est `npx web-push generate-vapid-keys`.

### Comment ça marche

1. Un visiteur clique sur **"🔔 Recevoir l'expression du jour à 18h"** et autorise les notifications dans son navigateur.
2. Son abonnement est enregistré dans Netlify Blobs (`carnet-push-subscriptions`).
3. Chaque jour à 18h (UTC), la fonction planifiée `send-daily-notification` se déclenche automatiquement (configuré dans `netlify.toml` avec `schedule = "0 18 * * *"`), calcule l'expression du jour, et envoie une notification à tous les abonnés.
4. Un clic sur la notification ouvre le site.

### Limites à connaître

- **iPhone/Safari** : les notifications push web ne fonctionnent que si le site a été "Ajouté à l'écran d'accueil" (installé comme app). Ça ne marche pas dans Safari classique.
- **Android/Chrome/Desktop** : fonctionne bien, avec ou sans installation.
- Si un abonnement expire (désinstallation, navigateur qui bloque), il est automatiquement supprimé au prochain envoi raté.
