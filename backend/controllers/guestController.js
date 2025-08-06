const Guest = require('../models/Guest');
const Event = require('../models/Event');
const QRCodeGenerator = require('../utils/qrGenerator');
const { calculateEventStats } = require('../utils/helpers');

// Initialiser le générateur de QR codes
const qrGenerator = new QRCodeGenerator();

/**
 * Ajouter un invité individuellement
 */
const addSingleGuest = async (req, res) => {
  try {
    const event = req.event;
    const { name, email, phone, invitationType } = req.body;

    // Vérifier la limite d'invités
    const currentGuestCount = await Guest.countDocuments({ eventId: event._id });
    if (currentGuestCount >= event.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Limite d'invités atteinte (${event.maxGuests} maximum)`
      });
    }

    // Vérifier les doublons par email si email fourni
    if (email) {
      const existingGuest = await Guest.findOne({ 
        eventId: event._id, 
        email: email.toLowerCase() 
      });
      
      if (existingGuest) {
        return res.status(400).json({
          success: false,
          message: 'Un invité avec cet email existe déjà pour cet événement'
        });
      }
    }

    // Créer l'invité
    const guest = new Guest({
      eventId: event._id,
      name,
      email: email ? email.toLowerCase() : undefined,
      phone,
      invitationType
    });

    await guest.save();

    res.status(201).json({
      success: true,
      message: 'Invité ajouté avec succès',
      data: {
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          invitationType: guest.invitationType,
          isCheckedIn: guest.isCheckedIn,
          createdAt: guest.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'invité:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un invité avec cet email existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Importer une liste d'invités depuis CSV
 */
const importGuestsFromCSV = async (req, res) => {
  try {
    const event = req.event;
    const { validatedGuests } = req.body;

    // Vérifier la limite d'invités
    const currentGuestCount = await Guest.countDocuments({ eventId: event._id });
    const totalAfterImport = currentGuestCount + validatedGuests.length;
    
    if (totalAfterImport > event.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `L'import dépasserait la limite d'invités (${event.maxGuests} maximum). ` +
                 `Actuel: ${currentGuestCount}, Tentative d'ajout: ${validatedGuests.length}`
      });
    }

    // Vérifier les doublons d'emails dans les données existantes
    const emailsToImport = validatedGuests
      .filter(guest => guest.email)
      .map(guest => guest.email.toLowerCase());

    if (emailsToImport.length > 0) {
      const existingEmails = await Guest.find({
        eventId: event._id,
        email: { $in: emailsToImport }
      }).select('email');

      if (existingEmails.length > 0) {
        const duplicates = existingEmails.map(g => g.email);
        return res.status(400).json({
          success: false,
          message: 'Des invités avec ces emails existent déjà',
          duplicateEmails: duplicates
        });
      }
    }

    // Préparer les invités pour l'insertion
    const guestsToInsert = validatedGuests.map(guest => ({
      ...guest,
      eventId: event._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insertion en lot
    const insertedGuests = await Guest.insertMany(guestsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${insertedGuests.length} invités importés avec succès`,
      data: {
        importedCount: insertedGuests.length,
        totalGuests: currentGuestCount + insertedGuests.length,
        guests: insertedGuests.map(guest => ({
          id: guest._id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          invitationType: guest.invitationType
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'import CSV:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation dans les données',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Certains emails sont déjà utilisés'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'import'
    });
  }
};

/**
 * Récupérer tous les invités d'un événement
 */
const getEventGuests = async (req, res) => {
  try {
    const event = req.event;
    const { page = 1, limit = 50, search, type, status } = req.query;

    // Construction des filtres
    const filters = { eventId: event._id };
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && ['VIP', 'Standard', 'Staff'].includes(type)) {
      filters.invitationType = type;
    }

    if (status === 'checked-in') {
      filters.isCheckedIn = true;
    } else if (status === 'pending') {
      filters.isCheckedIn = false;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 par page

    // Récupération des invités
    const [guests, totalCount] = await Promise.all([
      Guest.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Guest.countDocuments(filters)
    ]);

    // Calcul des statistiques
    const allGuests = await Guest.find({ eventId: event._id }).lean();
    const stats = calculateEventStats(allGuests);

    res.json({
      success: true,
      data: {
        guests: guests.map(guest => ({
          id: guest._id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          invitationType: guest.invitationType,
          isCheckedIn: guest.isCheckedIn,
          checkedInAt: guest.checkedInAt,
          hasQRCode: !!guest.qrToken,
          createdAt: guest.createdAt,
          updatedAt: guest.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNextPage: skip + limitNum < totalCount,
          hasPrevPage: parseInt(page) > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des invités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Modifier un invité
 */
const updateGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const event = req.event;
    const { name, email, phone, invitationType } = req.body;

    const guest = await Guest.findOne({ _id: guestId, eventId: event._id });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé'
      });
    }

    // Vérifier les doublons d'email si changement d'email
    if (email && email.toLowerCase() !== guest.email) {
      const existingGuest = await Guest.findOne({ 
        eventId: event._id, 
        email: email.toLowerCase(),
        _id: { $ne: guestId }
      });
      
      if (existingGuest) {
        return res.status(400).json({
          success: false,
          message: 'Un autre invité avec cet email existe déjà'
        });
      }
    }

    // Mettre à jour les champs
    if (name !== undefined) guest.name = name;
    if (email !== undefined) guest.email = email ? email.toLowerCase() : undefined;
    if (phone !== undefined) guest.phone = phone;
    if (invitationType !== undefined) guest.invitationType = invitationType;

    await guest.save();

    res.json({
      success: true,
      message: 'Invité mis à jour avec succès',
      data: {
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          invitationType: guest.invitationType,
          isCheckedIn: guest.isCheckedIn,
          updatedAt: guest.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'invité:', error);

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
 * Supprimer un invité
 */
const deleteGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const event = req.event;

    const guest = await Guest.findOneAndDelete({ _id: guestId, eventId: event._id });
    
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Invité supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'invité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Générer les QR codes pour tous les invités d'un événement
 */
const generateQRCodes = async (req, res) => {
  try {
    const event = req.event;
    const { batchSize = 50, regenerate = false } = req.body;

    // Récupérer les invités sans QR code ou tous si regenerate=true
    const filter = { eventId: event._id };
    if (!regenerate) {
      filter.$or = [
        { qrToken: { $exists: false } },
        { qrToken: null },
        { qrCodeUrl: { $exists: false } },
        { qrCodeUrl: null }
      ];
    }

    const guestsToProcess = await Guest.find(filter).limit(parseInt(batchSize));

    if (guestsToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'Tous les invités ont déjà un QR code',
        data: {
          processedCount: 0,
          totalGuests: await Guest.countDocuments({ eventId: event._id })
        }
      });
    }

    const processed = [];
    const errors = [];

    // Traitement par lots
    for (const guest of guestsToProcess) {
      try {
        const { qrToken, qrCodeUrl } = await qrGenerator.generateGuestQR(guest, event._id);
        
        guest.qrToken = qrToken;
        guest.qrCodeUrl = qrCodeUrl;
        await guest.save();

        processed.push({
          id: guest._id,
          name: guest.name,
          email: guest.email
        });

      } catch (error) {
        console.error(`Erreur QR pour invité ${guest._id}:`, error);
        errors.push({
          guestId: guest._id,
          name: guest.name,
          error: error.message
        });
      }
    }

    const totalGuests = await Guest.countDocuments({ eventId: event._id });
    const guestsWithQR = await Guest.countDocuments({ 
      eventId: event._id, 
      qrToken: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      message: `QR codes générés pour ${processed.length} invités`,
      data: {
        processedCount: processed.length,
        errorCount: errors.length,
        totalGuests,
        guestsWithQR,
        remainingGuests: totalGuests - guestsWithQR,
        processed,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération des QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la génération des QR codes'
    });
  }
};

module.exports = {
  addSingleGuest,
  importGuestsFromCSV,
  getEventGuests,
  updateGuest,
  deleteGuest,
  generateQRCodes
};
