# Installation et exploitation

## Contenu
- `index.html` : application complète (HTML, CSS, JavaScript, Chart.js chargé depuis cdnjs.cloudflare.com).
- `netlify/functions/synthese.js` : fonction serveur qui appelle l'API d'IA. La clé reste côté serveur.

## Lancer en local (sans l'IA)
Ouvrir `index.html` dans un navigateur, avec accès à Internet pour charger Chart.js.
Le bouton « Générer la synthèse par IA » propose alors le texte automatique, car la fonction serveur est absente.

## Déployer sur Render (sans l'IA)
1. Créer un dépôt GitHub privé contenant le contenu de ce dossier.
2. Dans Render, choisir **New > Blueprint**, connecter le dépôt et appliquer `render.yaml`.
3. Render publie `index.html` comme site statique et fournit une URL `onrender.com`.
4. Tester les filtres et les graphiques. La synthèse IA utilisera le texte automatique, car la fonction Netlify n'est pas exécutée par Render.

## Déployer sur Netlify (avec l'IA)
1. Mettre `index.html` à la racine du dépôt et garder `netlify/functions/synthese.js` au même emplacement relatif.
2. Dans Netlify : Site settings > Environment variables, créer `ANTHROPIC_API_KEY`.
3. Déployer depuis GitHub ou avec la CLI Netlify. Le glisser-déposer publie uniquement les fichiers statiques et ne déploie pas la fonction.
4. Tester : choisir des filtres, cliquer sur « Générer la synthèse par IA », vérifier chaque chiffre, valider.

## Variable facultative
- `ANTHROPIC_MODEL` : nom du modèle appelé. Par défaut `claude-sonnet-5-5`.

## Sécurité
- Ne jamais écrire la clé d'API dans `index.html`.
- La fonction n'accepte que des nombres et des libellés courts filtrés, jamais de texte libre.
- Aucune authentification n'est en place : tout visiteur peut appeler la fonction et consommer le quota.

## Données
Les données sont générées dans `index.html` (graine fixe 2026, 90 dossiers fictifs). Pour utiliser des données réelles, remplacer le tableau `DATA` en respectant les champs du dictionnaire (dossier 05).
