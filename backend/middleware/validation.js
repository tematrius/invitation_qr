const { validateEmail, validatePhone, sanitizeString } = require('../utils/helpers');

/**
 * Middleware de validation pour la création d'événement
 */
const validateCreateEvent = (req, res, next) => {
  const { name, description, date, location, createdBy, maxGuests } = req.body;
  const errors = [];

  // Validation nom
  if (!name || name.trim().length === 0) {
    errors.push('Le nom de l\'événement est requis');
  } else if (name.trim().length > 100) {
    errors.push('Le nom de l\'événement ne peut pas dépasser 100 caractères');
  }

  // Validation date
  if (!date) {
    errors.push('La date de l\'événement est requise');
  } else {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      errors.push('Format de date invalide');
    } else if (eventDate <= new Date()) {
      errors.push('La date de l\'événement doit être dans le futur');
    }
  }

  // Validation lieu
  if (!location || location.trim().length === 0) {
    errors.push('Le lieu de l\'événement est requis');
  } else if (location.trim().length > 200) {
    errors.push('Le lieu ne peut pas dépasser 200 caractères');
  }

  // Validation email créateur
  if (!createdBy || !validateEmail(createdBy)) {
    errors.push('Email administrateur valide requis');
  }

  // Validation description (optionnelle)
  if (description && description.length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
  }

  // Validation nombre max d'invités
  if (maxGuests && (isNaN(maxGuests) || maxGuests < 1)) {
    errors.push('Le nombre maximum d\'invités doit être un nombre positif');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données de validation invalides',
      errors
    });
  }

  // Nettoyer les données
  req.body.name = sanitizeString(name, 100);
  req.body.description = sanitizeString(description, 500);
  req.body.location = sanitizeString(location, 200);
  req.body.createdBy = createdBy.trim().toLowerCase();

  next();
};

/**
 * Middleware de validation pour l'ajout d'invité
 */
const validateAddGuest = (req, res, next) => {
  const { name, email, phone, invitationType } = req.body;
  const errors = [];

  // Validation nom (requis)
  if (!name || name.trim().length === 0) {
    errors.push('Le nom de l\'invité est requis');
  } else if (name.trim().length > 100) {
    errors.push('Le nom ne peut pas dépasser 100 caractères');
  }

  // Validation email (optionnel mais doit être valide si fourni)
  if (email && email.trim().length > 0 && !validateEmail(email)) {
    errors.push('Format d\'email invalide');
  }

  // Validation téléphone (optionnel mais doit être valide si fourni)
  if (phone && phone.trim().length > 0 && !validatePhone(phone)) {
    errors.push('Format de téléphone invalide');
  }

  // Validation type d'invitation
  const validTypes = ['VIP', 'Standard', 'Staff'];
  if (invitationType && !validTypes.includes(invitationType)) {
    errors.push('Type d\'invitation invalide (VIP, Standard, ou Staff)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Données d\'invité invalides',
      errors
    });
  }

  // Nettoyer les données
  req.body.name = sanitizeString(name, 100);
  req.body.email = email ? email.trim().toLowerCase() : undefined;
  req.body.phone = phone ? sanitizeString(phone, 15) : undefined;
  req.body.invitationType = invitationType || 'Standard';

  next();
};

/**
 * Middleware de validation pour l'import CSV
 */
const validateCSVData = (req, res, next) => {
  const { guests } = req.body;
  
  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Aucune donnée d\'invité trouvée'
    });
  }

  if (guests.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Limite de 1000 invités par import'
    });
  }

  const validatedGuests = [];
  const errors = [];

  guests.forEach((guest, index) => {
    const lineErrors = [];
    const lineNumber = index + 1;

    // Validation nom
    if (!guest.name || guest.name.trim().length === 0) {
      lineErrors.push('Nom requis');
    }

    // Validation email si fourni
    if (guest.email && guest.email.trim().length > 0 && !validateEmail(guest.email)) {
      lineErrors.push('Email invalide');
    }

    // Validation téléphone si fourni
    if (guest.phone && guest.phone.trim().length > 0 && !validatePhone(guest.phone)) {
      lineErrors.push('Téléphone invalide');
    }

    // Validation type d'invitation
    const validTypes = ['VIP', 'Standard', 'Staff'];
    if (guest.invitationType && !validTypes.includes(guest.invitationType)) {
      lineErrors.push('Type d\'invitation invalide');
    }

    if (lineErrors.length > 0) {
      errors.push({
        line: lineNumber,
        name: guest.name || 'N/A',
        errors: lineErrors
      });
    } else {
      // Nettoyer et ajouter les données valides
      validatedGuests.push({
        name: sanitizeString(guest.name, 100),
        email: guest.email ? guest.email.trim().toLowerCase() : undefined,
        phone: guest.phone ? sanitizeString(guest.phone, 15) : undefined,
        invitationType: guest.invitationType || 'Standard'
      });
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation dans le fichier CSV',
      errors,
      validCount: validatedGuests.length,
      errorCount: errors.length
    });
  }

  req.body.validatedGuests = validatedGuests;
  next();
};

/**
 * Middleware de validation pour le check-in
 */
const validateCheckIn = (req, res, next) => {
  const { qrToken, guestId, scannerDevice } = req.body;

  console.log('🔍 ValidateCheckIn - Body reçu:', req.body);
  console.log('🔍 ValidateCheckIn - qrToken:', qrToken);
  console.log('🔍 ValidateCheckIn - guestId:', guestId);

  if (!qrToken && !guestId) {
    console.log('❌ ValidateCheckIn - Ni qrToken ni guestId');
    return res.status(400).json({
      success: false,
      message: 'Token QR ou ID invité requis pour le check-in'
    });
  }

  if (qrToken && typeof qrToken !== 'string') {
    console.log('❌ ValidateCheckIn - qrToken invalide');
    return res.status(400).json({
      success: false,
      message: 'Format de token QR invalide'
    });
  }

  // Nettoyer les données
  if (scannerDevice) {
    req.body.scannerDevice = sanitizeString(scannerDevice, 50);
  }

  console.log('✅ ValidateCheckIn - Validation passée');
  next();
};

module.exports = {
  validateCreateEvent,
  validateAddGuest,
  validateCSVData,
  validateCheckIn
};
