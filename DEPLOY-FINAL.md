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
CORS_ORIGIN=https://votre-app.netlify.app
```

### 🌐 NETLIFY (Frontend React)
```
REACT_APP_API_URL=https://votre-backend.up.railway.app/api
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
6. **Notez l'URL générée** : `https://xxxxx.netlify.app`

### 3️⃣ Configuration finale
1. Retournez sur **Railway**
2. Modifiez `CORS_ORIGIN` avec l'URL Netlify exacte
3. Redéployez si nécessaire
4. **Testez votre application** ! 🎉

## 🔍 URLs de test final
- **API Backend** : `https://votre-backend.up.railway.app/api/health`
- **Application** : `https://votre-app.netlify.app`

## 📱 Fonctionnalités à tester
- ✅ Création d'événement
- ✅ Ajout d'invités (manuel et CSV)
- ✅ Génération QR codes
- ✅ Scanner mobile
- ✅ Dashboard admin
- ✅ Exports

## 🆘 En cas de problème

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
