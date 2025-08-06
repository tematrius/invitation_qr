@echo off
REM Script de démarrage pour Windows - QREvents
REM Ce script lance le backend et le frontend en parallèle

echo 🚀 Démarrage du système QREvents en mode développement
echo ==================================================

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org
    pause
    exit /b 1
)

REM Vérifier si npm est installé
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé. Veuillez l'installer avec Node.js
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%
echo.

REM Vérifier et installer les dépendances backend
echo 🔍 Vérification des dépendances backend...
if not exist "backend\node_modules" (
    echo 📦 Installation des dépendances backend...
    cd backend
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances backend
        pause
        exit /b 1
    )
    echo ✅ Dépendances backend installées
    cd ..
) else (
    echo ✅ Dépendances backend déjà installées
)

REM Vérifier et installer les dépendances frontend
echo 🔍 Vérification des dépendances frontend...
if not exist "frontend\node_modules" (
    echo 📦 Installation des dépendances frontend...
    cd frontend
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances frontend
        pause
        exit /b 1
    )
    echo ✅ Dépendances frontend installées
    cd ..
) else (
    echo ✅ Dépendances frontend déjà installées
)

echo.

REM Vérifier les fichiers d'environnement
echo 🔍 Vérification des fichiers d'environnement...

if not exist "backend\.env" (
    echo ⚠️  Fichier backend\.env manquant
    echo 📋 Copie du fichier exemple...
    copy "backend\.env.example" "backend\.env" >nul
    echo ✏️  Veuillez éditer backend\.env avec vos configurations
    echo    - MONGODB_URI (obligatoire)
    echo    - JWT_SECRET (obligatoire)
    echo    - QR_SECRET_KEY (obligatoire)
    echo.
)

if not exist "frontend\.env" (
    echo ⚠️  Fichier frontend\.env manquant
    echo 📋 Création du fichier frontend\.env...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_SOCKET_URL=http://localhost:5000
        echo REACT_APP_ENVIRONMENT=development
    ) > "frontend\.env"
    echo ✅ Fichier frontend\.env créé
)

echo.

echo 🔥 Démarrage des services...
echo.

REM Démarrer le backend en arrière-plan
echo 🔥 Démarrage du backend...
start "QREvents Backend" cmd /c "cd backend && npm run dev"
echo 📍 Backend démarré sur le port 5000

REM Attendre un peu que le backend démarre
echo ⏳ Attente du démarrage du backend...
timeout /t 3 /nobreak >nul

REM Démarrer le frontend en arrière-plan
echo 🔥 Démarrage du frontend...
start "QREvents Frontend" cmd /c "cd frontend && npm start"
echo 📍 Frontend démarré sur le port 3000

echo.
echo 🎉 Système QREvents démarré avec succès !
echo ==================================================
echo.
echo 🌐 Accès aux services :
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    API:      http://localhost:5000/api
echo.
echo 📱 Pour tester le scanner mobile :
echo    1. Créez un événement sur http://localhost:3000
echo    2. Ajoutez des invités
echo    3. Générez les QR codes
echo    4. Accédez au scanner : http://localhost:3000/scan/VOTRE_CODE_ADMIN
echo.
echo 🔍 Logs :
echo    Backend: Consultez la fenêtre "QREvents Backend"
echo    Frontend: Consultez la fenêtre "QREvents Frontend"
echo.
echo ⏹️  Pour arrêter : Fermez les fenêtres de terminal ou appuyez sur Ctrl+C
echo.

REM Attendre que l'utilisateur appuie sur une touche
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
