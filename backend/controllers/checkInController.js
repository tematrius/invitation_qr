const Guest = require('../models/Guest');
const CheckIn = require('../models/CheckIn');
const QRCodeGenerator = require('../utils/qrGenerator');
const { calculateEventStats } = require('../utils/helpers');

// Initialiser le générateur de QR codes
const qrGenerator = new QRCodeGenerator();

/**
 * Valider et effectuer le check-in via QR code
 */
const validateQRCode = async (req, res) => {
  try {
    const event = req.event;
    const { qrToken, scannerDevice } = req.body;
    const scannerIP = req.ip;

    // Valider le token QR
    const tokenValidation = qrGenerator.validateQRToken(qrToken);
    
    if (!tokenValidation.valid) {
      // Logger la tentative invalide
      await CheckIn.create({
        eventId: event._id,
        guestId: null,
        scanTime: new Date(),
        scannerDevice,
        scannerIP,
        status: tokenValidation.code === 'EXPIRED' ? 'expired' : 'invalid',
        notes: tokenValidation.error
      });

      return res.status(400).json({
        success: false,
        message: tokenValidation.error,
        code: tokenValidation.code
      });
    }

    const { eventId, guestId } = tokenValidation.data;

    // Vérifier que le QR code correspond à cet événement
    if (eventId !== event._id.toString()) {
      await CheckIn.create({
        eventId: event._id,
        guestId: null,
        scanTime: new Date(),
        scannerDevice,
        scannerIP,
        status: 'invalid',
        notes: 'QR code pour un autre événement'
      });

      return res.status(400).json({
        success: false,
        message: 'Ce QR code ne correspond pas à cet événement',
        code: 'WRONG_EVENT'
      });
    }

    // Récupérer l'invité
    const guest = await Guest.findOne({ 
      _id: guestId, 
      eventId: event._id,
      qrToken: qrToken 
    });

    if (!guest) {
      await CheckIn.create({
        eventId: event._id,
        guestId: guestId,
        scanTime: new Date(),
        scannerDevice,
        scannerIP,
        status: 'invalid',
        notes: 'Invité non trouvé ou token invalide'
      });

      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé',
        code: 'GUEST_NOT_FOUND'
      });
    }

    // Vérifier si déjà check-in
    if (guest.isCheckedIn) {
      await CheckIn.create({
        eventId: event._id,
        guestId: guest._id,
        scanTime: new Date(),
        scannerDevice,
        scannerIP,
        status: 'duplicate',
        notes: `Déjà enregistré le ${guest.checkedInAt}`
      });

      return res.status(400).json({
        success: false,
        message: 'Cet invité est déjà enregistré',
        code: 'ALREADY_CHECKED_IN',
        data: {
          guest: {
            name: guest.name,
            checkedInAt: guest.checkedInAt,
            invitationType: guest.invitationType
          }
        }
      });
    }

    // Effectuer le check-in
    guest.isCheckedIn = true;
    guest.checkedInAt = new Date();
    guest.checkedInBy = scannerDevice || 'Scanner QR';
    await guest.save();

    // Logger le check-in réussi
    await CheckIn.create({
      eventId: event._id,
      guestId: guest._id,
      scanTime: new Date(),
      scannerDevice,
      scannerIP,
      status: 'success',
      notes: 'Check-in réussi'
    });

    res.json({
      success: true,
      message: 'Check-in effectué avec succès',
      data: {
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          invitationType: guest.invitationType,
          checkedInAt: guest.checkedInAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la validation du QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la validation'
    });
  }
};

/**
 * Check-in manuel d'un invité
 */
const manualCheckIn = async (req, res) => {
  try {
    const event = req.event;
    const { guestId, scannerDevice } = req.body;
    const scannerIP = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    console.log('Check-in manuel - Event:', event._id);
    console.log('Check-in manuel - Body reçu:', req.body);
    console.log('Check-in manuel - GuestId:', guestId);
    console.log('Check-in manuel - ScannerIP:', scannerIP);

    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: 'Token QR ou ID invité requis pour le check-in'
      });
    }

    const guest = await Guest.findOne({ _id: guestId, eventId: event._id });
    console.log('Check-in manuel - Invité trouvé:', guest ? guest.name : 'NON TROUVÉ');

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité non trouvé'
      });
    }

    // Vérifier si l'invité a un QR code généré
    if (!guest.qrToken || !guest.qrCodeUrl) {
      return res.status(400).json({
        success: false,
        message: 'QR code non généré pour cet invité. Veuillez d\'abord générer les QR codes.',
        code: 'NO_QR_CODE'
      });
    }

    // Vérifier si déjà check-in
    if (guest.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'Cet invité est déjà enregistré',
        code: 'ALREADY_CHECKED_IN',
        data: {
          guest: {
            name: guest.name,
            checkedInAt: guest.checkedInAt,
            invitationType: guest.invitationType
          }
        }
      });
    }

    // Effectuer le check-in
    guest.isCheckedIn = true;
    guest.checkedInAt = new Date();
    guest.checkedInBy = `${scannerDevice || 'Manuel'} (Check-in manuel)`;
    
    console.log('Check-in manuel - Avant sauvegarde invité');
    await guest.save();
    console.log('Check-in manuel - Invité sauvegardé avec succès');

    // Logger le check-in manuel (optionnel pour éviter les erreurs)
    try {
      console.log('Check-in manuel - Création du log CheckIn');
      console.log('Check-in manuel - eventId:', event._id);
      console.log('Check-in manuel - guestId:', guest._id);
      console.log('Check-in manuel - scannerIP:', scannerIP);
      
      const checkInData = {
        eventId: event._id,
        guestId: guest._id,
        scanTime: new Date(),
        scannerDevice: `${scannerDevice || 'Manuel'} (Manuel)`,
        scannerIP: scannerIP || '127.0.0.1', // IP par défaut si pas définie
        status: 'success',
        notes: 'Check-in manuel'
      };
      
      console.log('Check-in manuel - Données à créer:', checkInData);
      
      const checkInLog = await CheckIn.create(checkInData);
      console.log('Check-in manuel - Log CheckIn créé avec succès:', checkInLog._id);
      
      // Vérifier que le log a bien été créé
      const verifyLog = await CheckIn.findById(checkInLog._id);
      console.log('Check-in manuel - Vérification log créé:', verifyLog ? 'OK' : 'ÉCHEC');
      
    } catch (logError) {
      console.warn('⚠️ Erreur lors de la création du log CheckIn (non critique):', logError);
      console.warn('⚠️ Le check-in de l\'invité a réussi mais le log a échoué');
    }

    console.log('Check-in manuel - Préparation de la réponse');
    const responseData = {
      success: true,
      message: 'Check-in manuel effectué avec succès',
      data: {
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          invitationType: guest.invitationType,
          checkedInAt: guest.checkedInAt
        }
      }
    };
    
    console.log('Check-in manuel - Réponse à envoyer:', responseData);
    res.json(responseData);
    console.log('Check-in manuel - Réponse envoyée avec succès');

  } catch (error) {
    console.error('❌ Erreur détaillée lors du check-in manuel:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Rechercher un invité pour check-in manuel
 */
const searchGuestForCheckIn = async (req, res) => {
  try {
    const event = req.event;
    const { search } = req.query;

    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche trop court (minimum 2 caractères)'
      });
    }

    const guests = await Guest.find({
      eventId: event._id,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    })
    .limit(20)
    .lean();

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
          checkedInAt: guest.checkedInAt
        }))
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche d\'invité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Obtenir les statistiques de présence d'un événement
 */
const getAttendanceStats = async (req, res) => {
  try {
    const event = req.event;
    console.log('Event ID pour stats:', event._id);

    // Statistiques de base
    const totalGuests = await Guest.countDocuments({ eventId: event._id });
    const checkedIn = await Guest.countDocuments({ eventId: event._id, isCheckedIn: true });
    const pending = totalGuests - checkedIn;

    console.log('Stats de base:', { totalGuests, checkedIn, pending });

    // Statistiques par type d'invitation
    const guestsByType = await Guest.aggregate([
      { $match: { eventId: event._id } },
      { 
        $group: { 
          _id: '$invitationType',
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: ['$isCheckedIn', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Invités par type:', guestsByType);

    // Répartition par type pour graphique pie
    const byType = guestsByType.map(type => ({
      name: type._id,
      count: type.total,
      checkedIn: type.checkedIn
    }));

    console.log('byType transformé:', byType);

    // Check-ins par heure (dernières 24h) - avec correction du fuseau horaire français
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checkinsByHour = await Guest.aggregate([
      { 
        $match: { 
          eventId: event._id,
          isCheckedIn: true,
          checkedInAt: { $gte: last24Hours }
        }
      },
      {
        $addFields: {
          // Convertir en heure française (UTC+1 ou UTC+2 selon saison)
          localHour: {
            $hour: {
              $dateAdd: {
                startDate: '$checkedInAt',
                unit: 'hour',
                amount: 1 // Ajuster selon votre fuseau (2 pour l'été)
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$localHour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Formater les données pour le graphique
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourData = checkinsByHour.find(item => item._id === hour);
      hourlyData.push({
        hour: `${hour}h`,
        count: hourData ? hourData.count : 0
      });
    }

    // Derniers check-ins
    const recentCheckIns = await Guest.find({
      eventId: event._id,
      isCheckedIn: true
    })
    .sort({ checkedInAt: -1 })
    .limit(10)
    .select('name invitationType checkedInAt')
    .lean();

    // Erreurs de scan (dernière heure)
    const scanErrors = await CheckIn.countDocuments({
      eventId: event._id,
      status: { $in: ['invalid', 'expired', 'duplicate'] },
      scanTime: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // dernière heure
    });

    // Scans réussis (tous les check-ins avec succès)
    const successfulScans = await CheckIn.countDocuments({
      eventId: event._id,
      status: 'success'
    });

    const responseData = {
      success: true,
      totalGuests,
      checkedIn,
      pending,
      attendanceRate: totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0,
      byType,
      checkinsByHour: hourlyData.filter(h => h.count > 0), // seulement les heures avec des check-ins
      recentCheckIns: recentCheckIns.map(checkin => ({
        guestName: checkin.name,
        guestType: checkin.invitationType,
        checkedInAt: checkin.checkedInAt
      })),
      scanErrors,
      successfulScans, // Ajout du compteur de scans réussis
      lastUpdated: new Date()
    };

    console.log('Réponse complète des stats:', JSON.stringify(responseData, null, 2));

    res.json(responseData);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  validateQRCode,
  manualCheckIn,
  getAttendanceStats,
  searchGuestForCheckIn
};
