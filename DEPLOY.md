# QR Events - Production Deployment

Cette application est optimisée pour être déployée sur :
- **Frontend** : Netlify
- **Backend** : Railway  
- **Database** : MongoDB Atlas

## Variables d'environnement requises

### Backend (Railway)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qrevents
JWT_SECRET=votre-jwt-secret-ultra-securise-minimum-32-caracteres
QR_SECRET_KEY=votre-qr-secret-ultra-securise-minimum-32-caracteres
CORS_ORIGIN=https://votre-app.netlify.app
```

### Frontend (Netlify)
```env
REACT_APP_API_URL=https://votre-backend.up.railway.app/api
REACT_APP_ENVIRONMENT=production
```

## Déploiement Railway (Backend)

1. Connectez votre GitHub à Railway
2. Sélectionnez ce dépôt
3. Railway détectera automatiquement le backend Node.js
4. Configurez les variables d'environnement
5. Le déploiement se lance automatiquement

## Déploiement Netlify (Frontend)  

1. Connectez votre GitHub à Netlify
2. Sélectionnez ce dépôt
3. Configurez :
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
4. Ajoutez les variables d'environnement
5. Le déploiement se lance automatiquement

## Configuration MongoDB Atlas

Assurez-vous que :
- Le cluster est créé (M0 gratuit)
- L'utilisateur de base de données est configuré
- Les IPs sont autorisées (0.0.0.0/0 ou IPs spécifiques)
- L'URI de connexion est correcte
