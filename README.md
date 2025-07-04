# Documentation du projet ERP

## 1. Présentation générale

Ce projet est une application ERP (Enterprise Resource Planning) simple, permettant la gestion de clients, produits, factures, et la génération de relevés PDF, avec une interface web moderne (React) et un backend Node.js/Express connecté à une base de données SQL via Sequelize.

---

## 2. Architecture du projet

```
holbertonschool-portfolio_project/
│
├── back/         # Backend Node.js/Express
│   ├── controllers/   # Logique métier (CRUD, PDF, email)
│   ├── middlewares/   # Middlewares Express (authentification)
│   ├── migrations/    # Migrations Sequelize
│   ├── models/        # Modèles Sequelize (ORM)
│   ├── routes/        # Définition des routes API REST
│   ├── config/        # Configuration DB
│   ├── app.js         # Configuration de l'app Express
│   ├── server.js      # Point d'entrée du serveur
│   └── package.json   # Dépendances backend
│
├── front/        # Frontend React
│   ├── src/
│   │   ├── components/ # Composants réutilisables (dialogs, layout)
│   │   ├── context/    # Contexte d'authentification
│   │   ├── pages/      # Pages principales (Clients, Produits, etc.)
│   │   ├── services/   # Appels API (axios)
│   │   ├── App.jsx     # Routing principal
│   │   ├── main.jsx    # Point d'entrée React
│   │   ├── App.css     # Styles principaux
│   │   └── index.css   # Styles globaux
│   ├── public/
│   └── package.json    # Dépendances frontend
│
├── migrations/   # (racine) Migrations globales
├── models/       # (racine) Modèles globaux
├── config/       # (racine) Config globale
└── README.md     # Documentation
```

---

## 3. Fonctionnalités principales

### Backend (Node.js/Express)

- **Authentification JWT** : Inscription, connexion, routes protégées.
- **Gestion des clients** : CRUD, pagination, email, téléphone uniques.
- **Gestion des produits** : CRUD, description unique, gestion du stock.
- **Gestion des factures** : CRUD, génération PDF, envoi par email, gestion du stock produit.
- **Relevé de compte client** : Génération PDF, envoi par email.
- **Statistiques** : Nombre de clients, produits, factures, chiffre d'affaires mensuel.
- **Réinitialisation de mot de passe** : Token sécurisé, email, expiration.

### Frontend (React)

- **Connexion sécurisée** : Authentification, redirection, gestion du token.
- **Tableau de bord** : Statistiques globales et graphiques.
- **Pages Clients, Produits, Factures** : CRUD, dialogues d'ajout/édition, pagination, responsive.
- **Téléchargement et envoi de PDF** : Pour factures et relevés clients.
- **Réinitialisation de mot de passe** : Formulaires dédiés, gestion des erreurs.
- **Design moderne** : Utilisation de Material UI, responsive, expérience utilisateur fluide.

---

## 4. Détail des principaux fichiers

### Backend

- **back/app.js**  
  Configure l'application Express, les middlewares (CORS, Helmet, JSON), et les routes principales.

- **back/server.js**  
  Démarre le serveur Express sur le port défini dans les variables d'environnement.

- **back/controllers/**  
  - `authController.js` : Inscription, connexion, gestion des tokens, reset password.
  - `clientController.js` : CRUD clients, génération/envoi PDF relevé.
  - `productController.js` : CRUD produits.
  - `invoiceController.js` : CRUD factures, génération/envoi PDF facture.

- **back/models/**  
  - `user.model.js` : Modèle utilisateur (email, mot de passe hashé, rôle).
  - `client.model.js` : Modèle client (nom, email, téléphone).
  - `product.model.js` : Modèle produit (nom, prix, stock, description).
  - `invoice.model.js` : Modèle facture (date, total, client, etc.).
  - `invoiceItem.model.js` : Lignes de facture (produit, quantité, prix).
  - `passwordResetToken.model.js` : Token de réinitialisation de mot de passe.

- **back/routes/**  
  - `auth.routes.js` : Routes d'authentification.
  - `client.routes.js` : Routes clients (CRUD, PDF, email).
  - `product.routes.js` : Routes produits (CRUD).
  - `invoice.routes.js` : Routes factures (CRUD, PDF, email).
  - `dashboard.js` : Routes statistiques.

- **back/middlewares/authMiddleware.js**  
  Middleware pour vérifier le token JWT sur les routes protégées.

- **back/config/database.js**  
  Configuration de la connexion Sequelize à la base de données.

---

### Frontend

- **front/src/App.jsx**  
  Routing principal de l'application, gestion des routes protégées.

- **front/src/main.jsx**  
  Point d'entrée React, montage de l'application.

- **front/src/context/AuthContext.jsx**  
  Fournit le contexte d'authentification à toute l'application.

- **front/src/services/api.js**  
  Configuration d'Axios pour les appels API, gestion automatique du token JWT.

- **front/src/pages/**  
  - `Dashboard.jsx` : Statistiques et graphiques.
  - `Clients.jsx` : Liste, ajout, édition, suppression, envoi PDF, pagination.
  - `Products.jsx` : Liste, ajout, édition, suppression, pagination.
  - `Invoices.jsx` : Liste, ajout, édition, suppression, envoi PDF, pagination.
  - `Login.jsx` : Formulaire de connexion.
  - `ForgotPassword.jsx` : Demande de réinitialisation de mot de passe.
  - `ResetPassword.jsx` : Saisie du nouveau mot de passe.

- **front/src/components/**  
  - `Layout.jsx` : Layout principal avec menu latéral.
  - `AddClientDialog.jsx`, `EditClientDialog.jsx` : Dialogues pour clients.
  - `AddProductDialog.jsx`, `EditProductDialog.jsx` : Dialogues pour produits.
  - `AddInvoiceDialog.jsx`, `EditInvoiceDialog.jsx` : Dialogues pour factures.

- **front/src/App.css**  
  Styles principaux de l'application.

- **front/src/index.css**  
  Styles globaux et responsives.

---

## 5. Fonctionnement global

- **Connexion** : L'utilisateur se connecte, reçoit un JWT stocké dans le localStorage.
- **Navigation** : Accès aux pages via le menu latéral (tableau de bord, clients, produits, factures).
- **CRUD** : Ajout, modification, suppression via des dialogues, avec validation et gestion des erreurs.
- **PDF** : Génération côté backend avec Puppeteer, téléchargement ou envoi par email.
- **Statistiques** : Dashboard affiche les totaux et un graphique du chiffre d'affaires mensuel.
- **Sécurité** : Authentification requise pour toutes les routes sensibles, gestion des tokens expirés.
- **Réinitialisation mot de passe** : L'utilisateur reçoit un email avec un lien sécurisé, peut saisir un nouveau mot de passe.

---

## 6. Dépendances principales

### Backend

- **express** : Serveur web
- **sequelize** : ORM SQL
- **mysql2** ou **pg** : Pilote base de données
- **jsonwebtoken** : Authentification JWT
- **bcrypt** : Hashage des mots de passe
- **nodemailer** : Envoi d'emails
- **puppeteer** : Génération de PDF

### Frontend

- **react** : Framework UI
- **react-router-dom** : Routing
- **@mui/material** : Composants UI Material Design
- **axios** : Requêtes HTTP
- **formik**/**yup** : Gestion et validation des formulaires

---

## 7. Configuration et lancement

### Backend

1. Configurer les variables d'environnement (`.env`) :  
   - `PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `GMAIL_USER`, `GMAIL_PASS`, `JWT_SECRET`
2. Installer les dépendances :  
   ```bash
   cd back
   npm install
   ```
3. Lancer le serveur :  
   ```bash
   npm run dev
   ```

### Frontend

1. Installer les dépendances :  
   ```bash
   cd front
   npm install
   ```
2. Lancer le serveur de développement :  
   ```bash
   npm run dev
   ```

---

## 8. Conseils de développement

- **Respecter la structure des dossiers** pour la clarté et la maintenabilité.
- **Utiliser les dialogues** pour toutes les modifications/ajouts côté front.
- **Vérifier les logs backend** en cas d'erreur 500 ou d'envoi d'email.
- **Sécuriser les routes** et ne jamais exposer d'informations sensibles côté client.
- **Faire attention à la gestion des tokens** (expiration, suppression à la déconnexion).

---

## 9. Améliorations possibles

- Ajout de tests unitaires (Jest, Supertest...)
- Gestion des rôles utilisateurs (admin, user...)
- Ajout de logs d'activité
- Export CSV/Excel
- Internationalisation (i18n)
- Déploiement sur le cloud (Heroku, Vercel...)

---

**Pour toute question sur une partie précise du code ou du fonctionnement, n'hésite pas à demander !**