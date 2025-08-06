const Event = require('../models/Event');
const { generateAdminCode } = require('../utils/helpers');

/**
 * Créer un nouvel événement
 */
const createEvent = async (req, res) => {
  try {
    const { name, description, date, location, createdBy, maxGuests } = req.body;

    // Générer un code administrateur unique
    let adminCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      adminCode = generateAdminCode();
      const existingEvent = await Event.findOne({ adminCode });
      if (!existingEvent) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Impossible de générer un code administrateur unique. Veuillez réessayer.'
      });
    }

    // Créer l'événement
    const event = new Event({
      name,
      description,
      date: new Date(date),
      location,
      adminCode,
      createdBy,
      maxGuests: maxGuests || 1000
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: {
        event: {
          id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          adminCode: event.adminCode,
          maxGuests: event.maxGuests,
          createdAt: event.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la création de l\'événement'
    });
  }
};

/**
 * Vérifier un code administrateur
 */
const verifyAdminCode = async (req, res) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode) {
      return res.status(400).json({
        success: false,
        message: 'Code administrateur requis'
      });
    }

    const event = await Event.findOne({ 
      adminCode: adminCode.toUpperCase(),
      isActive: true 
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Code administrateur invalide ou événement inactif'
      });
    }

    // Vérifier si l'événement n'est pas expiré
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (event.createdAt < thirtyDaysAgo) {
      return res.status(410).json({
        success: false,
        message: 'Cet événement a expiré (plus de 30 jours)'
      });
    }

    res.json({
      success: true,
      message: 'Code administrateur valide',
      data: {
        event: {
          id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          adminCode: event.adminCode,
          maxGuests: event.maxGuests,
          createdAt: event.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du code admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les détails d'un événement
 */
const getEventDetails = async (req, res) => {
  try {
    const event = req.event; // Injecté par le middleware verifyAdminCode

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          adminCode: event.adminCode,
          maxGuests: event.maxGuests,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Modifier un événement
 */
const updateEvent = async (req, res) => {
  try {
    const event = req.event;
    const { name, description, date, location, maxGuests } = req.body;

    // Mettre à jour uniquement les champs fournis
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (date !== undefined) {
      const newDate = new Date(date);
      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La nouvelle date doit être dans le futur'
        });
      }
      event.date = newDate;
    }
    if (location !== undefined) event.location = location;
    if (maxGuests !== undefined) {
      if (maxGuests < 1) {
        return res.status(400).json({
          success: false,
          message: 'Le nombre maximum d\'invités doit être au moins 1'
        });
      }
      event.maxGuests = maxGuests;
    }

    await event.save();

    res.json({
      success: true,
      message: 'Événement mis à jour avec succès',
      data: {
        event: {
          id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          location: event.location,
          maxGuests: event.maxGuests,
          updatedAt: event.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Supprimer (désactiver) un événement
 */
const deleteEvent = async (req, res) => {
  try {
    const event = req.event;

    // Désactiver l'événement au lieu de le supprimer
    event.isActive = false;
    await event.save();

    res.json({
      success: true,
      message: 'Événement désactivé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  createEvent,
  verifyAdminCode,
  getEventDetails,
  updateEvent,
  deleteEvent
};
