# 🚀 DÉPLOIEMENT QR EVENTS - GUIDE COMPLET

## Votre configuration actuelle
✅ **MongoDB Atlas** : Déjà configuré (cluster0.s9hoy6l.mongodb.net)
✅ **Code source** : Sur GitHub  
✅ **Fichiers de config** : Créés automatiquement

## 📋 Variables d'environnement à configurer

### 🚂 RAILWAY (Backend API)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://nolymashika21:aqVdzHEy6DoeVqId@cluster0.s9hoy6l.mongodb.net/qrevents?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=a1b2c3d4e5f67890123456789012345678901234567890123456789012345678
QR_SECRET_KEY=987654321fedcba0987654321fedcba01234567890abcdef0123456789012345
CORS_ORIGIN=https://invitation-qr-d.netlify.app
```

### 🌐 NETLIFY (Frontend React)
```
REACT_APP_API_URL=https://invitationqr-production.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

## 🎯 ÉTAPES DE DÉPLOIEMENT (15 minutes)

### 1️⃣ Déployer le Backend sur Railway
1. Allez sur **railway.app**
2. Cliquez **"Deploy from GitHub repo"**
3. Connectez votre GitHub et sélectionnez votre repo
4. Railway détecte automatiquement Node.js
5. Dans **Variables**, ajoutez les 6 variables Railway ci-dessus
6. Le déploiement se lance automatiquement
7. **Notez l'URL générée** : `https://xxxxx.up.railway.app`

### 2️⃣ Déployer le Frontend sur Netlify  
1. Allez sur **netlify.com**
2. Cliquez **"New site from Git"**
3. Connectez GitHub et sélectionnez votre repo
4. Configurez le build :
   - **Base directory** : `frontend`
   - **Build command** : `npm install && npm run build`
   - **Publish directory** : `frontend/build`
5. Dans **Environment variables**, ajoutez les 2 variables Netlify
   - ⚠️ Remplacez `votre-backend.up.railway.app` par la vraie URL Railway
6. **Notez l'URL générée** : `https://invitation-qr-d.netlify.app`

### 3️⃣ Configuration finale
1. Retournez sur **Railway**
2. Modifiez `CORS_ORIGIN` avec l'URL Netlify exacte : `https://invitation-qr-d.netlify.app`
3. Redéployez si nécessaire
4. **Testez votre application** ! 🎉

## 🔍 URLs de test final
- **API Backend** : `https://invitationqr-production.up.railway.app/api/health`
- **Application** : `https://invitation-qr-d.netlify.app`

## 📱 Fonctionnalités à tester
- ✅ Création d'événement
- ✅ Ajout d'invités (manuel et CSV)
- ✅ Génération QR codes
- ✅ Scanner mobile
- ✅ Dashboard admin
- ✅ Exports

## 🆘 En cas de problème

### Scanner mobile ne fonctionne pas
- **Autorisations caméra** : Vérifiez que le navigateur a accès à la caméra
- **HTTPS requis** : Le scanner ne fonctionne qu'en HTTPS (✅ Netlify utilise HTTPS)
- **Navigateurs supportés** : Chrome, Safari, Firefox récents
- **Alternative** : Utilisez le check-in manuel si le scanner échoue
- **Cache** : Videz le cache navigateur (Ctrl+F5 ou navigation privée)
- **Permissions** : Sur mobile, autorisez explicitement l'accès caméra

#### 📱 Instructions par navigateur mobile :

**Safari iOS :**
1. Aller sur `https://invitation-qr-d.netlify.app`
2. Aller dans Scanner QR
3. Popup "Autoriser l'accès à la caméra" → **Autoriser**
4. Si pas de popup : Paramètres iOS → Safari → Caméra → Autoriser

**Chrome Mobile :**
1. Sur le site, cliquer sur l'icône 🔒 dans la barre d'adresse
2. Caméra → Autoriser
3. Actualiser la page
4. Ou : Paramètres Chrome → Paramètres du site → Caméra

**Firefox Mobile :**
1. Menu (3 points) → Paramètres → Confidentialité
2. Autorisations → Caméra → Autoriser pour le site
3. Redémarrer Firefox

**Phoenix Browser :**
- Peut avoir des problèmes de compatibilité
- **Recommandation** : Utiliser Chrome ou Safari à la place
- Ou utiliser le check-in manuel

### Backend ne démarre pas
- Vérifiez les variables d'environnement Railway
- Consultez les logs Railway (onglet Deploy)
- Testez l'URL : `/api/health`

### Frontend ne se connecte pas
- Vérifiez `REACT_APP_API_URL` sur Netlify
- Vérifiez `CORS_ORIGIN` sur Railway
- Consultez la console browser (F12)

### Base de données inaccessible
- Vérifiez l'URI MongoDB dans Railway
- Vérifiez les autorisations IP sur MongoDB Atlas
- Le cluster doit autoriser 0.0.0.0/0 ou les IPs Railway

## 💡 Conseils
- Le déploiement est **automatique** à chaque `git push`
- Railway et Netlify ont des logs détaillés
- MongoDB Atlas : surveillez l'usage dans le dashboard
- Les secrets générés sont des exemples - générez les vôtres pour la sécurité

## 📞 Support
- **Railway** : docs.railway.app
- **Netlify** : docs.netlify.com  
- **MongoDB Atlas** : docs.atlas.mongodb.com

---

**🎊 Félicitations ! Votre système QR Events sera bientôt en ligne !**
