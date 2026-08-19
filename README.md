# Factures Coaching

Une première application de facturation pour préparer votre activité de coaching avant l'obtention du SIRET. Elle fonctionne sans compte, sans abonnement et sans installation : vos données restent dans le navigateur de votre ordinateur.

## Ce qui est déjà prêt

- création et conservation de clients ;
- création de factures avec prestations, quantités et prix HT ;
- numérotation automatique annuelle (`2026-001`, `2026-002`…) ;
- choix entre franchise en base de TVA et TVA facturée ;
- calculs HT, TVA et total à régler ;
- statut brouillon ou payée ;
- aperçu imprimable et téléchargement PDF via la boîte de dialogue du navigateur ;
- historique conservé localement ;
- écran « Mon activité » pour renseigner le SIRET, l'adresse, les coordonnées et les conditions de règlement.
- logo Alex Coaching présent dans l'application et sur les factures PDF.

## Pour commencer

Ouvrez simplement `index.html` dans un navigateur. Commencez par renseigner « Mon activité », puis ajoutez quelques clients et créez un brouillon de facture.

Pour récupérer un PDF : ouvrez l'aperçu, cliquez sur **Télécharger en PDF**, puis choisissez **Enregistrer au format PDF** dans la fenêtre du navigateur.

## À compléter lorsque votre SIRET arrive

Dans **Mon activité**, renseignez au minimum votre nom ou raison sociale, adresse, SIRET, statut TVA et conditions de règlement. Si vous êtes en franchise en base, l'application affiche la mention « TVA non applicable, art. 293 B du CGI ».

Ne transmettez pas de facture définitive tant que les mentions adaptées à votre situation ne sont pas vérifiées. Les règles varient notamment selon votre statut et vos clients (particuliers ou professionnels). Les informations officielles sur les mentions de facture sont disponibles sur [economie.gouv.fr](https://www.economie.gouv.fr/entreprises/gerer-son-entreprise-au-quotidien/gerer-sa-comptabilite-et-ses-demarches/mentions-obligatoires-dune-facture-tout-savoir).

## Mettre l'application sur GitHub

1. Connectez-vous à GitHub puis choisissez **New repository**.
2. Nommez-le par exemple `factures-coaching` et cochez **Public** si vous souhaitez utiliser GitHub Pages sans offre payante. Ne cochez pas l'option qui crée un fichier README : celui du projet est déjà inclus.
3. Après la création, choisissez **Add file → Upload files** et déposez les quatre fichiers de ce dossier : `index.html`, `styles.css`, `app.js` et `alex-coaching-logo.jpeg` (vous pouvez aussi ajouter `README.md`). Cliquez sur **Commit changes**.
4. Ouvrez **Settings → Pages**, choisissez **Deploy from a branch**, sélectionnez la branche `main` et le dossier `/ (root)`, puis enregistrez.
5. GitHub affichera l'adresse publique de votre application après quelques minutes.

> Important : les données sont enregistrées dans le navigateur, sur l'appareil utilisé. La publication GitHub ne synchronise pas vos clients ni vos factures entre plusieurs appareils. Une version suivante pourra ajouter une connexion sécurisée et une base de données.
