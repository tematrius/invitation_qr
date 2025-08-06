# Guide de Déploiement - QR Events
## Stack: Netlify + Railway + MongoDB Atlas

Ce guide vous accompagne pour déployer votre système de validation d'invitations par QR Code.

## 🎯 Architecture de déploiement

- **Frontend**: Netlify (React build statique)
- **Backend**: Railway (API Node.js/Express)  
- **Base de données**: MongoDB Atlas (512MB gratuit)
- **Code source**: GitHub (déploiement automatique)

## 📋 Prérequis

- Compte GitHub avec votre code
- Node.js 16+ installé localement
- Comptes sur : MongoDB Atlas, Railway, Netlify

---

## 1. 🗄️ MongoDB Atlas - Base de données

### Étape 1 : Création du cluster
1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster :
   - Choisissez **M0 Sandbox** (gratuit, 512MB)
   - Région : Europe (eu-west-1) ou plus proche de vos utilisateurs
   - Nom du cluster : `qr-events-cluster`

### Étape 2 : Configuration sécurité
1. **Database Access** :
   - Créez un utilisateur : `qr-admin`
   - Générez un mot de passe fort (sauvegardez-le !)
   - Privilèges : `Atlas Admin` ou `Read and write to any database`

2. **Network Access** :
   - Ajoutez `0.0.0.0/0` (toutes les IPs) pour simplifier
   - Ou ajoutez les IPs spécifiques de Railway si vous les connaissez

### Étape 3 : Récupération de l'URI
1. Cliquez sur **Connect** sur votre cluster
2. Choisissez **Connect your application**
3. Copiez l'URI de connexion :
```
mongodb+srv://<username>:<password>@qr-events-cluster.xxxxx.mongodb.net/qrevents?retryWrites=true&w=majority
```

---

## 2. 🚂 Railway - Backend API

### Préparation du backend

Créons d'abord les fichiers nécessaires pour le déploiement :

1. **Vérifiez le package.json** (déjà configuré) :
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

2. **Variables d'environnement de production** :
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qrevents
JWT_SECRET=genere-un-secret-ultra-securise-32-caracteres-minimum
QR_SECRET_KEY=genere-un-autre-secret-ultra-securise-32-caracteres
CORS_ORIGIN=https://votre-app.netlify.app
```

### Déploiement sur Railway

1. **Création du projet** :
   - Allez sur [Railway](https://railway.app)
   - Connectez-vous avec GitHub
   - Cliquez sur **"New Project"**
   - Sélectionnez **"Deploy from GitHub repo"**
   - Choisissez votre dépôt `invitation_qr`

2. **Configuration automatique** :
   - Railway détecte automatiquement le Node.js
   - Il lance `npm install` puis `npm start`
   - Le port sera automatiquement configuré

3. **Variables d'environnement** :
   - Dans le dashboard Railway, allez dans **Variables**
   - Ajoutez une par une :
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://votre-uri-atlas
   JWT_SECRET = votre-jwt-secret-32-chars-min
   QR_SECRET_KEY = votre-qr-secret-32-chars-min
   CORS_ORIGIN = https://votre-app.netlify.app
   ```

4. **Déploiement** :
   - Le déploiement se lance automatiquement
   - Vous obtiendrez une URL : `https://votre-projet.up.railway.app`
   - Testez l'API : `https://votre-projet.up.railway.app/api/health`

---

## 3. 🌐 Netlify - Frontend React

### Préparation du frontend

1. **Configuration de build** (fichier `netlify.toml` créé) :
```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "build"
```

2. **Gestion des routes SPA** (fichier `_redirects` créé) :
```
/*    /index.html   200
```

### Déploiement sur Netlify

1. **Création du site** :
   - Allez sur [Netlify](https://netlify.com)
   - Connectez-vous avec GitHub
   - Cliquez sur **"New site from Git"**
   - Choisissez votre dépôt `invitation_qr`

2. **Configuration build** :
   - Base directory : `frontend`
   - Build command : `npm install && npm run build`
   - Publish directory : `frontend/build`

3. **Variables d'environnement** :
   - Dans les paramètres du site, allez dans **Environment variables**
   - Ajoutez :
   ```
   REACT_APP_API_URL = https://votre-backend.up.railway.app/api
   REACT_APP_ENVIRONMENT = production
   ```

4. **Déploiement** :
   - Le build se lance automatiquement
   - Vous obtiendrez une URL : `https://random-name.netlify.app`
   - Vous pouvez changer le nom dans les paramètres

### Mise à jour CORS

N'oubliez pas de mettre à jour la variable `CORS_ORIGIN` sur Railway avec votre URL Netlify finale !

---

## 4. 🔧 Configuration finale

### Génération des secrets sécurisés

Utilisez ces commandes pour générer des secrets forts :

```bash
# JWT_SECRET (32 caractères minimum)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# QR_SECRET_KEY (32 caractères minimum)  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test du déploiement

1. **Backend** : `https://votre-backend.up.railway.app/api/health`
2. **Frontend** : `https://votre-app.netlify.app`
3. **Fonctionnalités** :
   - Création d'événement
   - Ajout d'invités
   - Génération QR codes
   - Scanner fonctionnel

---

## 5. 🚀 Déploiement automatique

### GitHub Actions (optionnel)

Les deux plateformes se déploient automatiquement à chaque push sur `main` :
- **Railway** : Redéploie le backend automatiquement
- **Netlify** : Rebuild le frontend automatiquement

### Branches de déploiement

- `main` → Production (Railway + Netlify)
- `develop` → Vous pouvez créer des environnements de staging

---

## 6. 💡 Conseils production

### Monitoring
- **Railway** : Logs intégrés, métriques de performance
- **MongoDB Atlas** : Monitoring de base gratuit
- **Netlify** : Analytics de site intégrés

### Sauvegardes
- **MongoDB Atlas** : Sauvegardes automatiques (M0 limitées)
- **Code** : GitHub comme source de vérité

### Sécurité
- Secrets jamais dans le code
- CORS configuré strictement
- Rate limiting activé
- Validation des données côté serveur

### Performance
- Build optimisé React (déjà configuré)
- Compression gzip (automatique sur Netlify)
- CDN global (Netlify)

---

## 🆘 Dépannage

### Erreurs courantes

1. **Erreur CORS** : Vérifiez `CORS_ORIGIN` sur Railway
2. **Base de données** : Vérifiez l'URI MongoDB et les autorisations IP
3. **Build frontend** : Vérifiez `REACT_APP_API_URL`
4. **Routes 404** : Vérifiez le fichier `_redirects`

### Logs utiles

- **Railway** : Dashboard → Deploy logs
- **Netlify** : Dashboard → Deploy logs  
- **MongoDB** : Atlas → Monitoring

---

## 📞 Support

- **Railway** : [Documentation](https://docs.railway.app)
- **Netlify** : [Documentation](https://docs.netlify.com)
- **MongoDB Atlas** : [Documentation](https://docs.atlas.mongodb.com)

### 2. Configuration réseau et sécurité

1. **Whitelist IP** : Autorisez `0.0.0.0/0` (toutes les IPs) pour les déploiements cloud
2. **Utilisateur DB** : Créez un utilisateur avec permissions lecture/écriture
3. **Connection String** : Récupérez l'URI de connexion

Exemple URI :
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/qr-invitations
```

## 🚀 Déploiement Backend

### Option 1: Railway (Recommandé)

Railway offre un déploiement simple avec détection automatique.

1. **Préparer le projet**
   ```bash
   cd backend
   # Assurez-vous que package.json contient:
   # "start": "node server.js"
   ```

2. **Déployer sur Railway**
   - Connectez votre repository GitHub à Railway
   - Railway détecte automatiquement Node.js
   - Ou utilisez Railway CLI :
   ```bash
   npm install -g @railway/cli
   railway login
   railway deploy
   ```

3. **Variables d'environnement Railway**
   Dans le dashboard Railway, configurez :
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-invitations
   JWT_SECRET=your-super-secure-jwt-secret-production
   QR_SECRET_KEY=your-qr-signature-secret-production
   CORS_ORIGIN=https://votre-frontend-url.netlify.app
   PORT=5000
   ```

4. **Domaine personnalisé** (optionnel)
   - Railway fournit un domaine automatique : `xxx.railway.app`
   - Configurez un domaine personnalisé si souhaité

### Option 2: Render

1. **Préparer le build**
   ```bash
   # Render utilise le script "start" de package.json
   ```

2. **Créer le service Render**
   - Connectez votre repository GitHub
   - Choisissez "Web Service"
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Variables d'environnement Render**
   ```env
   NODE_ENV=production
   MONGODB_URI=votre-mongodb-uri
   JWT_SECRET=votre-jwt-secret
   QR_SECRET_KEY=votre-qr-secret
   CORS_ORIGIN=https://votre-frontend.netlify.app
   ```

### Option 3: Heroku

1. **Installation Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Créer l'application**
   ```bash
   cd backend
   heroku create votre-app-name
   ```

3. **Variables d'environnement**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="votre-mongodb-uri"
   heroku config:set JWT_SECRET="votre-jwt-secret"
   heroku config:set QR_SECRET_KEY="votre-qr-secret"
   heroku config:set CORS_ORIGIN="https://votre-frontend.netlify.app"
   ```

4. **Déploiement**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🎨 Déploiement Frontend

### Option 1: Netlify (Recommandé)

Netlify est parfait pour les applications React avec déploiement continu.

1. **Préparer le build**
   ```bash
   cd frontend
   # Créer .env.production
   echo "REACT_APP_API_URL=https://votre-backend.railway.app/api" > .env.production
   
   # Tester le build localement
   npm run build
   ```

2. **Déploiement Netlify**

   **Option A: GitHub Integration (Recommandé)**
   - Connectez votre repository sur [Netlify](https://netlify.com)
   - Build settings :
     - Build command: `npm run build`
     - Publish directory: `build`
     - Base directory: `frontend`

   **Option B: Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=build
   ```

3. **Variables d'environnement Netlify**
   Dans Netlify Dashboard > Site Settings > Environment Variables :
   ```env
   REACT_APP_API_URL=https://votre-backend.railway.app/api
   REACT_APP_ENVIRONMENT=production
   REACT_APP_SOCKET_URL=https://votre-backend.railway.app
   ```

4. **Configuration des redirects**
   Créez `frontend/public/_redirects` :
   ```
   /*    /index.html   200
   ```

### Option 2: Vercel

1. **Installation Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Déploiement**
   ```bash
   cd frontend
   vercel
   ```

3. **Variables d'environnement**
   ```bash
   vercel env add REACT_APP_API_URL
   # Entrez: https://votre-backend.railway.app/api
   ```

### Option 3: GitHub Pages

1. **Installation gh-pages**
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. **Configuration package.json**
   ```json
   {
     "homepage": "https://username.github.io/repository-name",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. **Déploiement**
   ```bash
   npm run deploy
   ```

## 🔧 Configuration post-déploiement

### 1. Mise à jour des URLs

Une fois les deux services déployés, mettez à jour :

**Backend - Variables CORS :**
```env
CORS_ORIGIN=https://votre-frontend.netlify.app
SOCKET_CORS_ORIGIN=https://votre-frontend.netlify.app
```

**Frontend - URL API :**
```env
REACT_APP_API_URL=https://votre-backend.railway.app/api
REACT_APP_SOCKET_URL=https://votre-backend.railway.app
```

### 2. Test complet

1. **Test frontend** : Accédez à votre URL Netlify
2. **Test API** : Vérifiez `https://votre-backend.railway.app/api/health`
3. **Test création événement** : Créez un événement de test
4. **Test scanner** : Testez le scanner QR sur mobile

### 3. Configuration DNS (optionnel)

Si vous utilisez un domaine personnalisé :

1. **Frontend** : Configurez les CNAME vers Netlify
2. **Backend** : Configurez les CNAME vers Railway/Render
3. **SSL** : Les plateformes configurent HTTPS automatiquement

## 📊 Monitoring et maintenance

### 1. Logs d'application

**Railway :**
```bash
railway logs
```

**Render :**
- Consultez les logs dans le dashboard Render

**Heroku :**
```bash
heroku logs --tail
```

### 2. Monitoring MongoDB

1. **Atlas Monitoring** : Utilisez le monitoring intégré MongoDB Atlas
2. **Alertes** : Configurez des alertes pour l'utilisation et les erreurs
3. **Backups** : Configurez des sauvegardes automatiques

### 3. Analytics et erreurs

1. **Sentry** (optionnel) : Pour le monitoring d'erreurs
   ```bash
   npm install @sentry/react @sentry/node
   ```

2. **Google Analytics** (optionnel) : Pour les statistiques d'usage

### 4. Sauvegardes

1. **Code** : Repository Git comme backup
2. **Base de données** : Sauvegardes MongoDB Atlas automatiques
3. **Uploads** : Si des fichiers sont uploadés, configurez des sauvegardes

## 🔒 Sécurité en production

### 1. Variables secrètes

Générez des secrets forts pour la production :

```bash
# JWT Secret (32+ caractères)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# QR Secret (32+ caractères)  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configuration HTTPS

- **Automatique** : Netlify et Railway configurent HTTPS automatiquement
- **Headers sécurité** : Le middleware Helmet est déjà configuré
- **CORS** : Configuré pour votre domaine frontend uniquement

### 3. Rate limiting

Le backend inclut déjà :
- Rate limiting par IP
- Protection contre les scans abusifs
- Validation stricte des données

## 🚨 Dépannage

### Erreurs communes

1. **CORS Error**
   - Vérifiez `CORS_ORIGIN` dans les variables backend
   - Assurez-vous que l'URL correspond exactement (https/http, www/non-www)

2. **Database Connection**
   - Vérifiez `MONGODB_URI`
   - Confirmez que l'IP 0.0.0.0/0 est autorisée dans Atlas

3. **Build Errors**
   - Vérifiez les versions Node.js (16+)
   - Nettoyez node_modules : `rm -rf node_modules && npm install`

4. **Socket.IO Errors**
   - Vérifiez `REACT_APP_SOCKET_URL`
   - Confirmez que WebSocket est autorisé sur la plateforme

### Logs utiles

**Backend debug :**
```javascript
// Ajoutez temporairement dans server.js
console.log('Environment variables check:');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
```

**Frontend debug :**
```javascript
// Ajoutez temporairement dans App.js
console.log('API URL:', process.env.REACT_APP_API_URL);
```

## 📈 Optimisations performance

### Backend

1. **Compression** : Activez gzip
2. **Cache** : Redis pour les sessions (optionnel)
3. **CDN** : CloudFlare pour les assets statiques

### Frontend

1. **Bundle optimization** : Déjà optimisé avec Create React App
2. **Images** : Compressez les images avant upload
3. **Lazy loading** : Pour les composants non-critiques

### Base de données

1. **Index** : Les index MongoDB sont déjà configurés
2. **Aggregation** : Pour les statistiques complexes
3. **Sharding** : Pour la scalabilité future

## 🎯 Checklist de déploiement

- [ ] MongoDB Atlas configuré et accessible
- [ ] Backend déployé avec toutes les variables d'environnement
- [ ] Frontend déployé avec l'URL API correcte
- [ ] CORS configuré correctement
- [ ] Test de création d'événement
- [ ] Test de scan QR mobile
- [ ] Test des exports
- [ ] Monitoring configuré
- [ ] Sauvegardes configurées
- [ ] Documentation mise à jour

## 📞 Support

En cas de problème :

1. Vérifiez les logs des plateformes
2. Testez les variables d'environnement
3. Confirmez la connectivité entre frontend et backend
4. Vérifiez la documentation des plateformes de déploiement

Votre système QREvents est maintenant déployé et prêt pour la production ! 🎉
