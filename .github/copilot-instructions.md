<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Système de validation d'invitations par QR Code

Ce projet implémente un système complet de gestion d'événements avec validation d'invités par QR code.

## Architecture technique

### Backend (Node.js + Express + MongoDB)
- **API REST** avec authentification par code administrateur
- **Modèles MongoDB** : Event, Guest, CheckIn
- **Sécurité** : Rate limiting, validation, middleware d'authentification
- **QR Codes** : Génération sécurisée avec tokens signés (HMAC)
- **WebSocket** : Mises à jour temps réel via Socket.IO
- **Export** : ZIP (QR codes), CSV (listes), rapports

### Frontend (React + Tailwind CSS)
- **SPA React** avec React Router pour la navigation
- **Tailwind CSS** pour le styling responsive
- **Hooks personnalisés** : Socket.IO, QR Scanner, LocalStorage
- **API client** : Axios avec intercepteurs et gestion d'erreurs
- **Components** : Dashboard admin, scanner mobile, gestion invités

## Fonctionnalités principales

### 1. Création et gestion d'événements
- Formulaire de création avec code admin généré automatiquement
- Dashboard administrateur avec statistiques temps réel
- Modification et suppression d'événements

### 2. Gestion des invités
- Ajout individuel d'invités avec validation
- Import CSV avec preview et validation ligne par ligne
- Liste paginée avec recherche et filtres
- Modification et suppression d'invités

### 3. QR Codes sécurisés
- Génération par batch avec barre de progression
- Tokens signés avec HMAC SHA256 et expiration
- Export ZIP organisé par type d'invitation
- Validation en temps réel avec anti-duplication

### 4. Scanner mobile
- Interface optimisée mobile avec html5-qrcode
- Scan continu avec feedback visuel/sonore
- Check-in manuel pour codes illisibles
- Historique des scans avec statuts

### 5. Analytics et exports
- Statistiques temps réel (présence, types, erreurs)
- Graphiques de fréquentation par heure
- Exports : QR codes (ZIP), listes (CSV), rapports (TXT)

## Structure des données

### Event Schema
```javascript
{
  name: String (required),
  date: Date (required),
  location: String (required),
  adminCode: String (unique, 8 chars),
  createdBy: String (email),
  maxGuests: Number (default: 1000),
  isActive: Boolean (default: true)
}
```

### Guest Schema
```javascript
{
  eventId: ObjectId (ref: Event),
  name: String (required),
  email: String (optional, validated),
  phone: String (optional, validated),
  qrToken: String (unique, signed),
  qrCodeUrl: String (base64 PNG),
  isCheckedIn: Boolean (default: false),
  checkedInAt: Date,
  invitationType: Enum ['VIP', 'Standard', 'Staff']
}
```

### CheckIn Schema (logs)
```javascript
{
  guestId: ObjectId (ref: Guest),
  eventId: ObjectId (ref: Event),
  scanTime: Date,
  scannerDevice: String,
  scannerIP: String,
  status: Enum ['success', 'duplicate', 'invalid', 'expired'],
  notes: String
}
```

## Conventions de code

### Backend
- **Controllers** : Logique métier isolée avec gestion d'erreurs
- **Middleware** : Validation, authentification, rate limiting
- **Utils** : Générateurs QR, helpers, sécurité
- **Models** : Schémas Mongoose avec validation et index
- **Routes** : Organisation par fonctionnalité avec middleware

### Frontend
- **Components** : Fonctionnels avec hooks, props typées
- **Pages** : Containers avec logique de navigation
- **Hooks** : Logique réutilisable (Socket, QR, Storage)
- **Utils** : API client, helpers, formatage
- **Styles** : Tailwind avec classes personnalisées

### Sécurité
- **QR Tokens** : Structure `eventId.guestId.timestamp.signature`
- **Rate Limiting** : Par IP et par action (scan, upload, création)
- **Validation** : Server-side avec Mongoose + client-side React
- **CORS** : Configuration stricte pour domaines autorisés
- **Logs** : Actions admin et tentatives de scan

### API REST Structure
```
POST /api/auth/create-event      # Créer événement
POST /api/auth/verify-admin      # Vérifier code admin
GET  /api/events/:adminCode      # Détails événement
PUT  /api/events/:adminCode/:id  # Modifier événement
POST /api/guests/:adminCode/add-single    # Ajouter invité
POST /api/guests/:adminCode/import-csv    # Import CSV
GET  /api/guests/:adminCode              # Liste invités
POST /api/guests/:adminCode/generate-qr   # Générer QR
POST /api/checkin/:adminCode/validate     # Scanner QR
POST /api/checkin/:adminCode/manual       # Check-in manuel
GET  /api/checkin/:adminCode/stats        # Statistiques
GET  /api/export/:adminCode/qr-codes      # Export QR ZIP
GET  /api/export/:adminCode/guest-list    # Export CSV
```

## Variables d'environnement

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
QR_SECRET_KEY=your-qr-secret
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Instructions spécifiques pour Copilot

1. **Validation** : Toujours valider côté serveur ET client
2. **Erreurs** : Utiliser toast.error() pour les erreurs utilisateur
3. **Loading** : États de chargement pour toutes les actions async
4. **Mobile** : Interface responsive, scanner optimisé mobile
5. **Performance** : Pagination, debounce, memoization
6. **Sécurité** : Jamais d'exposition de secrets, validation stricte
7. **UX** : Feedback visuel, confirmations pour actions destructives
8. **Logs** : Console.error pour debug, actions admin loggées
9. **Types** : PropTypes ou TypeScript pour la documentation
10. **Tests** : Jest pour backend, React Testing Library pour frontend
