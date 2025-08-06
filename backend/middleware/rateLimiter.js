const rateLimit = require('express-rate-limit');

// Rate limiting pour les API générales (très permissif pour le développement)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes par fenêtre (augmenté de 500 à 1000)
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict pour la création d'événements (augmenté pour le développement)
const createEventLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 événements par heure par IP (augmenté de 5 à 20)
  message: {
    error: 'Limite de création d\'événements atteinte. Veuillez réessayer dans 1 heure.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour le scan de QR codes (augmenté pour le développement)
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 scans par minute (augmenté de 30 à 100)
  message: {
    error: 'Trop de scans effectués. Veuillez attendre avant de scanner à nouveau.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'upload de fichiers (augmenté pour le développement)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads par 15 minutes (augmenté de 10 à 50)
  message: {
    error: 'Limite d\'upload atteinte. Veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'authentification (augmenté pour le développement)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 tentatives de connexion par 15 minutes (augmenté de 10 à 50)
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  createEventLimiter,
  scanLimiter,
  uploadLimiter,
  authLimiter
};
