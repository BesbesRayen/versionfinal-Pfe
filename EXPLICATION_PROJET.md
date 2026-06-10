# Explication Complete Du Projet CreditTN

Ce document explique le projet CreditTN de maniere simple: objectif, architecture, dossiers, base de donnees, principaux flux metier et fonctions importantes.

## 1. Idee Generale

CreditTN est une plateforme full-stack de type BNPL, c'est-a-dire "Buy Now, Pay Later". Elle permet a un client de creer un compte, verifier son email, faire son KYC, consulter des boutiques et produits, acheter au comptant ou a credit, payer ses mensualites, gerer ses cartes et recevoir des notifications.

Le projet contient aussi une interface admin pour gerer les utilisateurs, les demandes KYC, les credits, les articles, les boutiques, les factures, les messages et les notifications.

## 2. Architecture Globale

Le projet est compose de 5 parties principales:

```text
pfeprojet-main/
|-- creadiTn/                 Backend Spring Boot
|-- Dashboard_client-main/    Dashboard web Next.js
|-- frontend mobile/          Application mobile Expo / React Native
|-- socket-server/            Serveur temps reel Socket.IO
|-- scripts/db/               Scripts SQL et donnees initiales
|-- docker-compose.yml        Lancement de tous les services
|-- README.md                 Guide rapide
|-- PROJECT_DOCUMENTATION.md  Documentation technique detaillee
`-- EXPLICATION_PROJET.md     Ce fichier
```

Les services communiquent comme ceci:

```text
Mobile App / Dashboard Web
          |
          v
   Backend Spring Boot API
          |
          v
      MySQL Database

Backend Spring Boot ---> Socket Server ---> Mobile / Dashboard
```

Le backend contient la logique metier. Les frontends affichent les donnees et appellent les APIs. Le socket server diffuse les notifications en temps reel.

## 3. Technologies Utilisees

- Backend: Java 17, Spring Boot, Spring MVC, Spring Security, JWT, Spring Data JPA, Hibernate.
- Base de donnees: MySQL 8.
- Dashboard web: Next.js, React, TypeScript, Tailwind CSS.
- Application mobile: Expo, React Native, React Native Web, TypeScript.
- Temps reel: Socket.IO.
- Email: SMTP pour OTP, verification email, reset password, confirmations.
- KYC: integration Didit API.
- DevOps local: Docker Compose.
- Tests: Maven tests, Vitest, ESLint.

## 4. Backend Spring Boot

Le backend est dans:

```text
creadiTn/src/main/java/com/creaditn/creaditnbackend/
```

Il suit une architecture en couches:

```text
controller/   Recoit les requetes HTTP REST
service/      Contient la logique metier
repository/   Accede a la base de donnees avec Spring Data JPA
entity/       Represente les tables MySQL
dto/          Objets de requete et reponse API
security/     JWT, filtres, regles d'acces
config/       Configuration mail, Swagger, MVC, Jackson
scheduler/    Taches automatiques de paiement et rappel
util/         Fonctions utilitaires
exception/    Gestion des erreurs API
```

### Exemple de flux backend

Quand un utilisateur demande un credit:

```text
CreditController
   -> CreditService
      -> UserRepository / FinancialProfileRepository / CardRepository
      -> CreditCalculator
      -> CreditRequestRepository
      -> InstallmentService
      -> NotificationService
```

Le controller ne fait pas la logique lourde. Il transmet la requete au service. Le service valide les regles et sauvegarde les donnees.

## 5. Principaux Controllers Backend

Les controllers exposent les endpoints REST:

- `AuthController`: inscription, login, verification email, reset password, Google login.
- `UserController`: profil utilisateur, changement mot de passe, photo, suppression compte.
- `KycController`: upload CIN/selfie, verification KYC, statut KYC.
- `CreditController`: simulation credit, demande credit, liste des credits, solde credit.
- `CreadiScoreController`: calcul et lecture du score CreditTN.
- `FinancialProfileController`: creation et lecture du profil financier.
- `CardController`: ajout, remplacement, suppression, carte par defaut, blocage carte.
- `ArticleController`: liste des articles, articles populaires, detail article.
- `StoreController`: boutiques publiques et articles par boutique.
- `PurchaseController`: checkout comptant ou credit, commandes utilisateur.
- `PaymentController`: paiement mensualite, payer tout, autopay, methodes de paiement.
- `NotificationController`: notifications client.
- `SupportController`: FAQ, tickets support, feedback, messages contact.
- `AdminController`: login admin, statistiques, utilisateurs, KYC, credits, activite.
- `AdminArticleController`: CRUD articles admin.
- `AdminStoreController`: CRUD boutiques admin.
- `AdminInvoiceController`: factures et PDF.
- `AdminNotificationController`: notifications admin.

## 6. Services Et Fonctions Importantes

### AuthService

Fonctions importantes:

- `register`: cree un utilisateur, encode le mot de passe, cree le wallet, genere OTP email.
- `login`: verifie email/mot de passe, verifie que le compte est actif, retourne un JWT.
- `verifyEmail`: valide le code OTP et active le compte.
- `requestPasswordReset`: prepare un reset password.
- `confirmPasswordReset`: change le mot de passe apres verification.
- `googleLogin`: login via Google, actuellement utilise en mode demo/compatibilite.

### KycService

Fonctions importantes:

- `submitKycDocuments`: enregistre les URLs des documents KYC.
- `uploadMultipart`: recoit les fichiers CIN recto, CIN verso et selfie.
- `uploadAndVerify`: upload + verification complete.
- `approveKyc`: admin approuve un document KYC.
- `rejectKyc`: admin rejette un document KYC.
- `manualReviewKyc`: met un dossier en revue manuelle.
- `getPendingDocuments`: retourne les KYC en attente pour admin.

### KycDecisionService

Ce service decide si un KYC est:

- approuve automatiquement,
- refuse,
- envoye en revue manuelle.

Il utilise des seuils comme confiance provider, liveness, risque de fraude et coherence identite.

### CreditService

Fonctions importantes:

- `simulate`: calcule une simulation sans sauvegarder.
- `createCreditRequest`: cree une demande de credit et les mensualites.
- `approveCreditRequest`: admin approuve une demande.
- `rejectCreditRequest`: admin refuse une demande.
- `getCreditBalance`: calcule le credit disponible, utilise et restant.
- `calculateRemainingPrincipal`: calcule le principal restant a payer.

### CreditCalculator

Fonctions importantes:

- `validateInstallmentDuration`: accepte seulement certaines durees, par exemple 3, 6, 9, 12 mois.
- `calculatePrincipal`: montant finance apres acompte.
- `calculateInterestAmount`: interet selon la duree.
- `calculateTotalRepayable`: total a rembourser.
- `calculateRepaymentSchedule`: repartition des mensualites.
- `requiredDownPayment`: acompte minimum.
- `calculateFirstDueDate`: premiere date de paiement selon le jour de salaire.

### CreadiScoreService

Fonctions importantes:

- `calculateScore`: calcule un score utilisateur avec KYC, salaire, profil, comportement.
- `getLatestScore`: retourne le dernier score sauvegarde.
- `computeCreditLimitForUser`: transforme le score en limite credit.

### CardService

Fonctions importantes:

- `addCard`: ajoute une carte, chiffre le numero, garde seulement `last4`.
- `replaceCard`: remplace une ancienne carte.
- `deleteCard`: supprime une carte apres verification.
- `setDefaultCard`: definit une carte par defaut.
- `blockCard`: bloque une carte.
- `getDefaultActiveCard`: recupere la carte active par defaut pour paiement.

### PurchaseService

Fonctions importantes:

- `checkout`: gere l'achat d'un article. Si le paiement est comptant, la commande est terminee directement. Si le paiement est a credit, il cree une demande credit, les mensualites, la commande, la facture et les notifications.
- `getUserOrders`: liste les commandes d'un utilisateur.
- `getCreditOrdersForAdmin`: liste les achats credit pour admin.

### PaymentService

Fonctions importantes:

- `makePayment`: paie une mensualite.
- `payAllInstallments`: paie toutes les mensualites ouvertes.
- `collectOutstandingInstallmentsForAdmin`: recouvrement admin.
- `getUserPayments`: historique paiements.
- `getPaymentByReference`: recherche paiement par reference.

### InstallmentService

Fonctions importantes:

- `generateInstallments`: cree les mensualites d'un credit.
- `getUserInstallments`: liste les mensualites utilisateur.
- `getUserPendingInstallments`: liste les mensualites non payees.
- `markAsPaid`: marque une mensualite comme payee.
- `markOverdueInstallments`: marque les mensualites en retard.

### InvoiceService

Fonctions importantes:

- `createCreditInvoice`: cree une facture pour achat credit.
- `getAllInvoices`: liste admin.
- `getInvoice`: detail facture.
- `generateInvoicePdf`: genere PDF facture.

### NotificationService Et SocketEventService

Fonctions importantes:

- `sendNotification`: cree une notification utilisateur.
- `getUnreadCount`: nombre de notifications non lues.
- `markAsRead`: marque comme lue.
- `emitNewArticle`, `emitUpdateArticle`, `emitDeleteArticle`: envoient des evenements temps reel au socket server.

## 7. Base De Donnees

La base principale est MySQL, nommee `creaditn`.

Tables importantes:

- `users`: utilisateurs, auth, email verification, statut KYC, profil.
- `financial_profiles`: salaire, jour salaire, emploi, risque.
- `kyc_documents`: documents CIN/selfie, resultats provider, statut KYC.
- `kyc_audit_logs`: historique decisions KYC admin.
- `cards`: cartes utilisateur chiffrees.
- `creadi_scores`: scores CreditTN.
- `credit_requests`: demandes de credit.
- `installments`: mensualites.
- `payments`: paiements de mensualites.
- `purchase_orders`: commandes comptant ou credit.
- `invoices`: factures.
- `articles`: produits.
- `stores`: boutiques.
- `notifications`: notifications client.
- `admin_notifications`: notifications admin.
- `transactions`: journal des transactions.
- `user_wallet`: wallet interne de demonstration.
- `messages`: messages de contact.

Relations principales:

```text
User 1--N Cards
User 1--N CreditRequests
CreditRequest 1--N Installments
Installment 1--N Payments
User 1--N PurchaseOrders
PurchaseOrder 1--1 Invoice
User 1--1 FinancialProfile
User 1--N Notifications
User 1--N KycDocuments
```

## 8. Dashboard Web Next.js

Le dashboard est dans:

```text
Dashboard_client-main/
```

Structure importante:

```text
src/app/          Pages Next.js et routes API
src/components/   Composants React reutilisables
src/lib/          Fonctions API, socket, utilitaires
src/data/         Donnees statiques FAQ/boutiques
```

Pages importantes:

- `/`: landing page publique.
- `/login`: login client.
- `/register`: inscription client.
- `/dashboard`: tableau de bord client web.
- `/support`: support/contact.
- `/boutiques`: liste boutiques.
- `/boutiques/[id]`: produits d'une boutique.
- `/admin/login`: login admin.
- `/admin`: dashboard admin.
- `/admin/users`: gestion utilisateurs.
- `/admin/kyc`: validation KYC.
- `/admin/credits`: demandes credit.
- `/admin/articles`: gestion articles.
- `/admin/stores`: gestion boutiques.
- `/admin/invoices`: factures.
- `/admin/messages`: messages contact.
- `/admin/notifications`: notifications admin.

Fonctions importantes dans `src/lib/api.ts`:

- `fetchBackend`: helper central pour appeler le backend.
- `getAdminStats`: statistiques admin.
- `getAdminUsers`: liste utilisateurs.
- `getAdminCredits`: credits.
- `approveKyc` / `rejectKyc`: decision KYC.
- `approveCredit` / `rejectCredit`: decision credit.
- `getAdminArticles`, `createAdminArticle`, `updateAdminArticle`, `deleteAdminArticle`: CRUD articles.
- `getAdminStores`, `createAdminStore`, `updateAdminStore`, `deleteAdminStore`: CRUD boutiques.
- `getAdminInvoices`: factures.
- `getAdminNotifications`: notifications admin.

## 9. Application Mobile Expo / React Native

L'application mobile est dans:

```text
frontend mobile/
```

Structure importante:

```text
src/App.tsx        Routage principal
src/pages/         Ecrans mobile
src/components/    Layout, navigation, cartes UI
src/lib/           API, auth, panier, socket, deep links
src/data/          Catalogue local fallback
```

Ecrans importants:

- `Login.tsx`: connexion.
- `Register.tsx`: inscription.
- `EmailVerification.tsx`: verification OTP.
- `Home.tsx`: accueil client.
- `Profile.tsx`: profil.
- `PersonalInformation.tsx`: infos personnelles.
- `FinancialProfile.tsx`: profil financier.
- `KycVerification.tsx`: verification KYC.
- `Credit.tsx`: simulation et demande credit.
- `CreadiScoreDashboard.tsx`: score CreditTN.
- `Shops.tsx`: liste boutiques.
- `ShopProducts.tsx`: produits boutique.
- `ProductDetail.tsx`: detail produit.
- `Cart.tsx`: panier.
- `Cards.tsx`: gestion cartes.
- `Installments.tsx`: mensualites.
- `PaymentHistory.tsx`: historique paiements.
- `Notifications.tsx`: notifications.
- `Support.tsx`: support.

Fonctions importantes:

- `setAuthToken`: stocke le JWT cote API client.
- `AuthProvider`: gere session, login, logout.
- `CartProvider`: gere panier local.
- `getLocalCreditMath`: calcule une preview locale du credit.
- `getCreditPreviewValues`: prepare les valeurs affichees dans l'ecran credit.
- `resolveDeepLink`: transforme un lien profond en action app.
- `useArticleSocket`: met a jour les articles en temps reel.
- `isValidLuhn`: valide un numero de carte.

## 10. Socket Server

Le serveur temps reel est dans:

```text
socket-server/index.js
```

Il expose:

- `GET /health`: verifier que le serveur fonctionne.
- `POST /emit`: endpoint appele par le backend pour diffuser un evenement.

Evenements globaux:

- `new-article`: nouvel article.
- `update-article`: article modifie.
- `delete-article`: article supprime.

Evenements par utilisateur:

- `kyc-update`: changement statut KYC.
- `credit-update`: changement credit.
- `payment-due`: paiement a venir.
- `notification`: notification client.

Les utilisateurs rejoignent une room:

```text
user:<userId>
```

Cela permet d'envoyer une notification a un seul utilisateur.

## 11. Flux Metier Principaux

### Inscription Et Login

```text
Frontend
 -> POST /api/auth/register
 -> AuthController
 -> AuthService.register
 -> users + user_wallet
 -> EmailService.sendEmailVerificationOtp
```

Ensuite:

```text
Frontend
 -> POST /api/auth/verify-email
 -> AuthService.verifyEmail
 -> JWT retourne au client
```

### KYC

```text
Mobile KYC screen
 -> POST /api/kyc/verify
 -> KycController
 -> KycService.uploadAndVerify
 -> DiditClient
 -> KycDecisionService
 -> kyc_documents + user.kyc_status
```

### Achat A Credit

```text
Mobile produit
 -> POST /api/purchases/checkout
 -> PurchaseController
 -> PurchaseService.checkout
 -> CreditService.createCreditRequest
 -> InstallmentService.generateInstallments
 -> InvoiceService.createCreditInvoice
 -> NotificationService
```

### Paiement Mensualite

```text
Mobile installments
 -> POST /api/payments/installments/{id}/pay
 -> PaymentController
 -> PaymentService.makePayment
 -> installments status PAID
 -> payments + transactions
 -> EmailService / NotificationService
```

### Admin KYC

```text
Dashboard admin
 -> GET /api/admin/kyc/pending
 -> AdminController
 -> KycService.getPendingDocuments

Dashboard admin approve/reject
 -> PUT /api/admin/kyc/{id}/approve ou reject
 -> KycService.approveKyc / rejectKyc
 -> kyc_audit_logs
```

## 12. Securite

Le backend utilise:

- JWT pour authentifier les utilisateurs.
- `JwtAuthenticationFilter` pour lire le token dans les requetes.
- `SecurityConfig` pour definir les routes publiques/protegees.
- `AdminAuthFilter` pour les routes admin.
- BCrypt pour encoder les mots de passe.
- Chiffrement des numeros de cartes avec `CardCryptoUtil`.

Routes publiques typiques:

- login/register,
- verification email,
- forgot password,
- articles publics,
- boutiques publiques,
- FAQ/contact.

Routes protegees:

- profil utilisateur,
- KYC,
- credit,
- paiements,
- cartes,
- dashboard client,
- admin.

## 13. Taches Automatiques

Dans `scheduler/`:

- `AutopayScheduler`: traite automatiquement les paiements dus.
- `OverdueInstallmentScheduler`: marque les mensualites en retard.
- `PaymentReminderScheduler`: envoie des rappels de paiement.

Ces classes automatisent les operations financieres recurrentes.

## 14. Docker Et Lancement

Le fichier `docker-compose.yml` lance:

- MySQL sur le port `3307`.
- Backend sur le port `8082`.
- Dashboard sur le port `3000`.
- Socket server sur le port `3001`.
- phpMyAdmin sur le port `8081`.
- Mobile web sur le port `8083`.

Commande:

```bash
cp .env.example .env
docker compose up --build
```

URLs locales:

- Dashboard: `http://localhost:3000`
- Backend: `http://localhost:8082`
- Swagger: `http://localhost:8082/swagger-ui.html`
- Socket health: `http://localhost:3001/health`
- phpMyAdmin: `http://localhost:8081`
- Mobile web: `http://localhost:8083`

## 15. Tests Et Verification

Backend:

```bash
cd creadiTn
.\mvnw.cmd test
```

Dashboard:

```bash
cd Dashboard_client-main
npm.cmd run lint
npm.cmd run build
```

Mobile:

```bash
cd "frontend mobile"
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## 16. Resume Simple Pour Presentation

CreditTN est une application BNPL complete avec backend Spring Boot, dashboard Next.js, application mobile Expo et Socket.IO. Le backend gere l'authentification, KYC, score credit, demandes de credit, achats, paiements, factures, notifications et administration. La base MySQL stocke les utilisateurs, cartes, credits, mensualites, paiements, commandes et factures. Le dashboard sert a la fois de site public et d'interface admin. L'application mobile est l'interface principale du client. Le socket server permet de recevoir des notifications et mises a jour en temps reel.

