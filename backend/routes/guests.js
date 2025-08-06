const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const router = express.Router();

const guestController = require('../controllers/guestController');
const { verifyAdminCode, logAdminAction } = require('../middleware/auth');
const { validateAddGuest, validateCSVData } = require('../middleware/validation');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');

// Configuration de multer pour l'upload CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV sont autorisés'));
    }
  }
});

/**
 * @route   POST /api/guests/:adminCode/add-single
 * @desc    Ajouter un invité individuellement
 * @access  Private (admin code required)
 */
router.post('/:adminCode/add-single',
  apiLimiter,
  verifyAdminCode,
  validateAddGuest,
  logAdminAction('ADD_SINGLE_GUEST'),
  guestController.addSingleGuest
);

/**
 * @route   POST /api/guests/:adminCode/import-csv
 * @desc    Importer une liste CSV d'invités
 * @access  Private (admin code required)
 */
router.post('/:adminCode/import-csv',
  uploadLimiter,
  verifyAdminCode,
  upload.single('csvFile'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Fichier CSV requis'
        });
      }

      // Parser le CSV
      const guests = [];
      const csvStream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        csvStream
          .pipe(csv({
            mapHeaders: ({ header }) => header.toLowerCase().trim()
          }))
          .on('data', (row) => {
            // Nettoyer et mapper les données
            const guest = {
              name: row.nom || row.name || '',
              email: row.email || row.mail || '',
              phone: row.telephone || row.phone || row.tel || '',
              invitationType: row.type || row.invitation_type || 'Standard'
            };
            
            // Valider que le nom n'est pas vide
            if (guest.name.trim()) {
              guests.push(guest);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (guests.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucun invité valide trouvé dans le fichier CSV'
        });
      }

      // Ajouter les invités à la requête pour validation
      req.body.guests = guests;
      next();

    } catch (error) {
      console.error('Erreur lors du parsing CSV:', error);
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la lecture du fichier CSV: ' + error.message
      });
    }
  },
  validateCSVData,
  logAdminAction('IMPORT_CSV_GUESTS'),
  guestController.importGuestsFromCSV
);

/**
 * @route   GET /api/guests/:adminCode
 * @desc    Récupérer tous les invités d'un événement
 * @access  Private (admin code required)
 */
router.get('/:adminCode',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('GET_EVENT_GUESTS'),
  guestController.getEventGuests
);

/**
 * @route   PUT /api/guests/:adminCode/:guestId
 * @desc    Modifier un invité
 * @access  Private (admin code required)
 */
router.put('/:adminCode/:guestId',
  apiLimiter,
  verifyAdminCode,
  validateAddGuest,
  logAdminAction('UPDATE_GUEST'),
  guestController.updateGuest
);

/**
 * @route   DELETE /api/guests/:adminCode/:guestId
 * @desc    Supprimer un invité
 * @access  Private (admin code required)
 */
router.delete('/:adminCode/:guestId',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('DELETE_GUEST'),
  guestController.deleteGuest
);

/**
 * @route   POST /api/guests/:adminCode/generate-qr
 * @desc    Générer les QR codes pour les invités
 * @access  Private (admin code required)
 */
router.post('/:adminCode/generate-qr',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('GENERATE_QR_CODES'),
  guestController.generateQRCodes
);

module.exports = router;
