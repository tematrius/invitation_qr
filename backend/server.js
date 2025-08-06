require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

// Import des routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const guestRoutes = require('./routes/guests');
const checkinRoutes = require('./routes/checkin');
const exportRoutes = require('./routes/export');

// Middleware général
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Configuration Socket.IO pour les mises à jour temps réel
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Configuration de la base de données MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Connexion à la base de données
connectDB();

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware pour le parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour capturer l'IP réelle
app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  next();
});

// Middleware pour ajouter Socket.IO aux requêtes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rate limiting global
app.use(apiLimiter);

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/export', exportRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur QR Invitation en fonctionnement',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route pour les statistiques système (debug)
app.get('/api/system-stats', async (req, res) => {
  try {
    const stats = {
      mongodb: {
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Gestion Socket.IO pour les mises à jour temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  // Rejoindre une room pour un événement spécifique
  socket.on('join-event', (adminCode) => {
    socket.join(`event-${adminCode}`);
    console.log(`Client ${socket.id} a rejoint l'événement ${adminCode}`);
  });

  // Quitter une room d'événement
  socket.on('leave-event', (adminCode) => {
    socket.leave(`event-${adminCode}`);
    console.log(`Client ${socket.id} a quitté l'événement ${adminCode}`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Fonction helper pour émettre des mises à jour
const emitEventUpdate = (adminCode, eventType, data) => {
  io.to(`event-${adminCode}`).emit('event-update', {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString()
  });
};

// Ajouter la fonction aux modèles pour les mises à jour temps réel
global.emitEventUpdate = emitEventUpdate;

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: validationErrors
    });
  }

  // Erreur de clé dupliquée MongoDB
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Données dupliquées détectées',
      error: 'Un enregistrement avec ces données existe déjà'
    });
  }

  // Erreur de Cast MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Format de données invalide',
      error: 'ID ou format de données incorrect'
    });
  }

  // Erreur Multer (upload de fichiers)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'Erreur d\'upload de fichier',
      error: err.message
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Configuration du port
const PORT = process.env.PORT || 5000;

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur QR Invitation démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`💾 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Connexion MongoDB fermée.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Connexion MongoDB fermée.');
      process.exit(0);
    });
  });
});

module.exports = app;
