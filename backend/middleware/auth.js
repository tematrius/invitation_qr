const Event = require('../models/Event');

/**
 * Middleware pour vérifier le code administrateur
 */
const verifyAdminCode = async (req, res, next) => {
  try {
    const { adminCode } = req.params;
    console.log('🔐 VerifyAdminCode - AdminCode reçu:', adminCode);
    
    if (!adminCode) {
      console.log('❌ VerifyAdminCode - Pas de code admin');
      return res.status(400).json({
        success: false,
        message: 'Code administrateur requis'
      });
    }

    // Rechercher l'événement par code admin
    const event = await Event.findOne({ 
      adminCode: adminCode.toUpperCase(),
      isActive: true 
    });

    console.log('🔍 VerifyAdminCode - Événement trouvé:', event ? event.name : 'AUCUN');

    if (!event) {
      console.log('❌ VerifyAdminCode - Événement non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé ou inactif'
      });
    }

    // Vérifier si l'événement n'est pas expiré (30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (event.createdAt < thirtyDaysAgo) {
      return res.status(410).json({
        success: false,
        message: 'Cet événement a expiré (plus de 30 jours)'
      });
    }

    // Ajouter l'événement à la requête
    req.event = event;
    console.log('✅ VerifyAdminCode - Passé avec succès, event attaché');
    next();

  } catch (error) {
    console.error('Erreur lors de la vérification du code admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware pour vérifier que l'événement appartient bien au code admin
 */
const verifyEventOwnership = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { adminCode } = req.params;

    if (!eventId || !adminCode) {
      return res.status(400).json({
        success: false,
        message: 'ID événement et code admin requis'
      });
    }

    const event = await Event.findOne({
      _id: eventId,
      adminCode: adminCode.toUpperCase(),
      isActive: true
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé ou accès non autorisé'
      });
    }

    req.event = event;
    next();

  } catch (error) {
    console.error('Erreur lors de la vérification de propriété:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware pour logger les actions administratives
 */
const logAdminAction = (action) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Logger la requête
    console.log(`[ADMIN ACTION] ${action}`, {
      adminCode: req.params.adminCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Logger la réponse
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      console.log(`[ADMIN ACTION COMPLETE] ${action}`, {
        adminCode: req.params.adminCode,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  verifyAdminCode,
  verifyEventOwnership,
  logAdminAction
};
