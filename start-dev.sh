#!/bin/bash

# Script de démarrage pour le développement QREvents
# Ce script lance le backend et le frontend en parallèle

echo "🚀 Démarrage du système QREvents en mode développement"
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avec Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Fonction pour installer les dépendances si nécessaire
install_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo "📦 Installation des dépendances $name..."
        cd "$dir"
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Erreur lors de l'installation des dépendances $name"
            exit 1
        fi
        echo "✅ Dépendances $name installées"
        cd ..
    else
        echo "✅ Dépendances $name déjà installées"
    fi
}

# Installer les dépendances
echo "🔍 Vérification des dépendances..."
install_dependencies "backend" "backend"
install_dependencies "frontend" "frontend"
echo ""

# Vérifier les fichiers d'environnement
echo "🔍 Vérification des fichiers d'environnement..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Fichier backend/.env manquant"
    echo "📋 Copie du fichier exemple..."
    cp backend/.env.example backend/.env
    echo "✏️  Veuillez éditer backend/.env avec vos configurations"
    echo "   - MONGODB_URI (obligatoire)"
    echo "   - JWT_SECRET (obligatoire)"
    echo "   - QR_SECRET_KEY (obligatoire)"
    echo ""
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Fichier frontend/.env manquant"
    echo "📋 Création du fichier frontend/.env..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
    echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> frontend/.env
    echo "REACT_APP_ENVIRONMENT=development" >> frontend/.env
    echo "✅ Fichier frontend/.env créé"
fi

echo ""

# Fonction pour démarrer un service
start_service() {
    local dir=$1
    local name=$2
    local command=$3
    local port=$4
    
    echo "🔥 Démarrage $name..."
    cd "$dir"
    
    # Démarrer en arrière-plan
    $command &
    local pid=$!
    
    echo "📍 $name démarré (PID: $pid) sur le port $port"
    
    # Sauvegarder le PID pour pouvoir l'arrêter plus tard
    echo $pid > "../${name}.pid"
    
    cd ..
}

# Créer un gestionnaire pour arrêter les services proprement
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    
    # Arrêter le backend
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            echo "✅ Backend arrêté"
        fi
        rm backend.pid
    fi
    
    # Arrêter le frontend
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            echo "✅ Frontend arrêté"
        fi
        rm frontend.pid
    fi
    
    echo "👋 Services arrêtés. Au revoir !"
    exit 0
}

# Configurer le gestionnaire d'arrêt
trap cleanup SIGINT SIGTERM

echo "🔥 Démarrage des services..."
echo ""

# Démarrer le backend
start_service "backend" "backend" "npm run dev" "5000"

# Attendre un peu que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 3

# Démarrer le frontend
start_service "frontend" "frontend" "npm start" "3000"

echo ""
echo "🎉 Système QREvents démarré avec succès !"
echo "=================================================="
echo ""
echo "🌐 Accès aux services :"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API:      http://localhost:5000/api"
echo ""
echo "📱 Pour tester le scanner mobile :"
echo "   1. Créez un événement sur http://localhost:3000"
echo "   2. Ajoutez des invités"
echo "   3. Générez les QR codes"
echo "   4. Accédez au scanner : http://localhost:3000/scan/VOTRE_CODE_ADMIN"
echo ""
echo "🔍 Logs :"
echo "   Backend: Consultez le terminal pour les logs du serveur"
echo "   Frontend: Consultez le navigateur pour les logs React"
echo ""
echo "⏹️  Pour arrêter : Ctrl+C"
echo ""

# Attendre que les services continuent de tourner
wait
