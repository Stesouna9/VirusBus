# Politique de sécurité — Virus Bus

## Signaler une vulnérabilité

Si tu trouves une faille de sécurité sur **virusbus.fr** ou dans ce repo,
merci de la signaler en privé via :

→ **[GitHub Security Advisory](https://github.com/Stesouna9/VirusBus/security/advisories/new)**

Évite les issues publiques pour éviter d'exposer la faille avant qu'elle
soit corrigée.

## Périmètre

Le site est un site statique hébergé sur **GitHub Pages**. Pas d'API,
pas de backend, pas de base de données, pas de compte utilisateur, pas
de paiement, pas de collecte de données personnelles autre que des
métriques anonymes (GoatCounter, sans cookie).

### Dans le périmètre
- Failles XSS via contenu statique
- Compromission de dépendances CDN (problème SRI)
- Bypass de la CSP
- Fuite d'information via headers manquants
- Sécurité du `sw.js` (service worker PWA)
- Phishing via l'OG card

### Hors périmètre
- DDoS sur GitHub Pages (pas de notre ressort)
- Failles sur les dépendances tierces signalées chez le mainteneur
- Compromission de comptes utilisateurs (il n'y en a pas)
- Bruteforce (rien à brutaliser)

## Headers de sécurité actifs

- **Content-Security-Policy** strict avec liste blanche par directive
- **X-Content-Type-Options: nosniff**
- **X-Frame-Options: DENY** + `frame-ancestors 'none'`
- **Cross-Origin-Opener-Policy: same-origin**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** restrictif (toutes APIs sensibles désactivées)
- **Subresource Integrity (SRI)** sur tous les CDN

## Temps de réponse cible

- **Confirmation reçue** : 48 h
- **Évaluation initiale** : 7 j
- **Correctif** : selon gravité (critique 7 j / haute 30 j / basse 90 j)

## Reconnaissance

Les chercheurs qui signalent une faille en respectant cette politique
seront crédités dans le CHANGELOG (sauf demande contraire).

— Doc Laundal, OKALAM Studio
