const crypto = require('crypto');

console.log('=== GÉNÉRATION DE SECRETS SÉCURISÉS ===\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const qrSecret = crypto.randomBytes(32).toString('hex');

console.log('Copiez ces valeurs dans vos variables d\'environnement :\n');

console.log('JWT_SECRET=');
console.log(jwtSecret);
console.log('\nQR_SECRET_KEY=');
console.log(qrSecret);

console.log('\n=== À CONFIGURER ===');
console.log('1. Railway (Backend) :');
console.log('   - JWT_SECRET = ' + jwtSecret);
console.log('   - QR_SECRET_KEY = ' + qrSecret);
console.log('   - CORS_ORIGIN = https://votre-app.netlify.app');
console.log('   - MONGODB_URI = mongodb+srv://nolymashika21:aqVdzHEy6DoeVqId@cluster0.s9hoy6l.mongodb.net/qrevents?retryWrites=true&w=majority&appName=Cluster0');

console.log('\n2. Netlify (Frontend) :');
console.log('   - REACT_APP_API_URL = https://votre-backend.up.railway.app/api');
console.log('   - REACT_APP_ENVIRONMENT = production');

console.log('\n=== RAPPEL DÉPLOIEMENT ===');
console.log('1. Déployez d\'abord le backend sur Railway');
console.log('2. Notez l\'URL Railway du backend');
console.log('3. Configurez REACT_APP_API_URL avec cette URL');
console.log('4. Déployez le frontend sur Netlify');
console.log('5. Notez l\'URL Netlify du frontend');
console.log('6. Mettez à jour CORS_ORIGIN sur Railway avec l\'URL Netlify');
