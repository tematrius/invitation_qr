# Système de validation d'invitations par QR Code

Un système complet de gestion d'événements avec validation d'invités par QR codes sécurisés, interface d'administration, scanner mobile et analytics temps réel.

## ✨ Fonctionnalités principales

### 🎯 Gestion d'événements
- Création d'événements avec code administrateur unique
- Dashboard administrateur avec statistiques temps réel
- Modification et gestion complète des événements

### 👥 Gestion des invités
- Ajout individuel avec validation en temps réel
- **Import CSV** avec preview et validation ligne par ligne
- Liste paginée avec recherche et filtres avancés
- Modification et suppression d'invités

### 🔒 QR Codes sécurisés
- Génération automatique avec tokens signés (HMAC SHA256)
- Protection anti-duplication et expiration automatique
- Export ZIP organisé par type d'invitation
- Validation en temps réel avec logs de sécurité

### 📱 Scanner mobile
- Interface optimisée mobile avec `html5-qrcode`
- Scan continu avec feedback visuel et sonore
- Check-in manuel pour codes illisibles
- Historique des scans avec statuts détaillés

### 📊 Analytics et exports
- Statistiques temps réel (présence, types, erreurs)
- Graphiques de fréquentation par heure
- **Exports multiples** : QR codes (ZIP), listes (CSV), rapports (TXT)
- Mises à jour temps réel via WebSocket

## 🛠️ Stack technique

### Backend
- **Node.js + Express** : API REST sécurisée
- **MongoDB + Mongoose** : Base de données avec schémas validés
- **Socket.IO** : Mises à jour temps réel
- **QR Code** : Génération sécurisée avec `qrcode`
- **Sécurité** : Rate limiting, CORS, validation, logs

### Frontend
- **React 18** : Interface utilisateur moderne
- **Tailwind CSS** : Styling responsive et accessible
- **React Router** : Navigation SPA
- **Axios** : Client API avec intercepteurs
- **html5-qrcode** : Scanner QR mobile

### Sécurité
- Tokens QR signés avec HMAC SHA256
- Rate limiting par IP et action
- Validation server-side et client-side
- Protection CORS configurée
- Logs complets des actions admin

## 🚀 Installation et démarrage

### Prérequis
- Node.js 16+ et npm
- MongoDB (local ou Atlas)
- Git

### 1. Cloner le projet
```bash
git clone <repository-url>
cd party
```

### 2. Configuration Backend
```bash
cd backend
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos configurations MongoDB, secrets, etc.
```

### 3. Configuration Frontend
```bash
cd ../frontend
npm install

# Créer le fichier d'environnement (optionnel)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 4. Démarrage en développement

**Backend** (terminal 1) :
```bash
cd backend
npm run dev
```

**Frontend** (terminal 2) :
```bash
cd frontend
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du projet

```
party/
├── backend/                 # API Node.js + Express
│   ├── controllers/         # Logique métier
│   ├── middleware/          # Authentification, validation, sécurité
│   ├── models/             # Schémas MongoDB (Event, Guest, CheckIn)
│   ├── routes/             # Routes API organisées
│   ├── utils/              # QR generator, helpers, sécurité
│   ├── server.js           # Point d'entrée serveur
│   └── package.json
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages principales
│   │   ├── hooks/          # Hooks personnalisés (Socket, QR, Storage)
│   │   ├── utils/          # API client, helpers
│   │   └── App.js
│   ├── public/
│   └── package.json
└── README.md
```

## 🔧 Configuration des variables d'environnement

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qr-invitations
JWT_SECRET=your-super-secret-jwt-key
QR_SECRET_KEY=your-qr-signature-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## 📖 Utilisation

### 1. Créer un événement
1. Accédez à la page d'accueil
2. Cliquez sur "Créer un événement"
3. Remplissez le formulaire (nom, date, lieu, email admin)
4. **Conservez le code administrateur généré** (8 caractères)

### 2. Ajouter des invités

**Ajout individuel :**
- Accédez au dashboard avec votre code admin
- Onglet "Gestion des invités" → "Ajouter un invité"
- Remplissez nom, email (optionnel), téléphone (optionnel), type

**Import CSV :**
- Format attendu : `nom,email,telephone,type`
- Exemple : `Jean Dupont,jean@email.com,0123456789,Standard`
- Types disponibles : `VIP`, `Standard`, `Staff`
- Preview et validation automatique des données

### 3. Générer les QR codes
- Onglet "Gestion des invités" → Bouton "Générer QR codes"
- Traitement par batch de 50 invités
- Export ZIP automatique avec noms organisés
- QR codes haute qualité (300x300px PNG)

### 4. Scanner les invités
- Accédez à `/scan/VOTRE_CODE_ADMIN` sur mobile
- Scanner automatique avec caméra
- Feedback immédiat (vert=succès, rouge=erreur)
- Check-in manuel pour codes illisibles

### 5. Exports et rapports
- **QR codes** : ZIP avec tous les codes organisés
- **Liste invités** : CSV avec statuts et informations
- **Présences** : CSV avec heures d'arrivée détaillées
- **Rapport complet** : TXT avec analytics complètes

## 🔐 Sécurité

### Structure des tokens QR
```javascript
{
  eventId: "...",
  guestId: "...", 
  timestamp: 1234567890,
  expiresAt: 1234567890,
  signature: "hmac_sha256_signature"
}
```

### Protection implémentée
- **Rate limiting** : 30 scans/minute, 100 API calls/15min
- **Anti-duplication** : Un invité ne peut être scanné qu'une fois
- **Expiration** : QR codes valides 24h par défaut
- **Logs** : Toutes les tentatives de scan sont enregistrées
- **Validation** : Server-side obligatoire + client-side

## 📊 API REST

### Authentification
```
POST /api/auth/create-event     # Créer événement
POST /api/auth/verify-admin     # Vérifier code admin
```

### Événements  
```
GET  /api/events/:adminCode           # Détails événement
PUT  /api/events/:adminCode/:id       # Modifier événement
```

### Invités
```
POST /api/guests/:adminCode/add-single     # Ajouter invité
POST /api/guests/:adminCode/import-csv     # Import CSV  
GET  /api/guests/:adminCode               # Liste invités
PUT  /api/guests/:adminCode/:guestId      # Modifier invité
POST /api/guests/:adminCode/generate-qr    # Générer QR codes
```

### Check-in
```
POST /api/checkin/:adminCode/validate     # Scanner QR
POST /api/checkin/:adminCode/manual       # Check-in manuel
GET  /api/checkin/:adminCode/stats        # Statistiques
```

### Exports
```
GET /api/export/:adminCode/qr-codes      # Export QR (ZIP)
GET /api/export/:adminCode/guest-list    # Export CSV invités
GET /api/export/:adminCode/attendance    # Export CSV présences
GET /api/export/:adminCode/report        # Rapport complet
```

## 🚀 Déploiement en production

### Backend (Railway/Render)
1. Connecter votre repository GitHub
2. Configurer les variables d'environnement
3. Définir la commande de build : `npm install`
4. Définir la commande de démarrage : `npm start`

### Frontend (Netlify)
1. Connecter le repository GitHub
2. Dossier de build : `frontend`
3. Commande de build : `npm run build`
4. Dossier de publication : `build`
5. Configurer `REACT_APP_API_URL` avec l'URL du backend

### Base de données MongoDB Atlas
1. Créer un cluster gratuit (M0)
2. Configurer l'accès réseau (0.0.0.0/0 pour le cloud)
3. Créer un utilisateur et récupérer la connection string
4. Mettre à jour `MONGODB_URI` dans les variables d'environnement
5. aqVdzHEy6DoeVqId (mdp) nolymashika21=user
6. mongodb+srv://nolymashika21:aqVdzHEy6DoeVqId@cluster0.s9hoy6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

## 🧪 Tests

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans le dossier `docs/`
- Vérifier les logs serveur pour les erreurs

## 🔄 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Création et gestion d'événements
- ✅ Import CSV avec validation
- ✅ Génération QR codes sécurisés
- ✅ Scanner mobile optimisé
- ✅ Dashboard admin temps réel
- ✅ Exports multiples (ZIP, CSV, TXT)
- ✅ WebSocket pour mises à jour live
- ✅ Sécurité avancée et rate limiting
