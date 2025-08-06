const express = require('express');
const router = express.Router();
const checkInController = require('../controllers/checkInController');
const { verifyAdminCode, logAdminAction } = require('../middleware/auth');
const { validateCheckIn } = require('../middleware/validation');
const { scanLimiter, apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/checkin/:adminCode/validate
 * @desc    Valider un QR code scanné
 * @access  Private (admin code required)
 */
router.post('/:adminCode/validate',
  scanLimiter,
  verifyAdminCode,
  validateCheckIn,
  logAdminAction('VALIDATE_QR_CODE'),
  checkInController.validateQRCode
);

/**
 * @route   POST /api/checkin/:adminCode/manual
 * @desc    Check-in manuel d'un invité
 * @access  Private (admin code required)
 */
router.post('/:adminCode/manual',
  scanLimiter,
  verifyAdminCode,
  (req, res, next) => {
    console.log('🐛 DEBUG MIDDLEWARE - req.body:', req.body);
    console.log('🐛 DEBUG MIDDLEWARE - Content-Type:', req.headers['content-type']);
    console.log('🐛 DEBUG MIDDLEWARE - Method:', req.method);
    next();
  },
  validateCheckIn,
  logAdminAction('MANUAL_CHECKIN'),
  checkInController.manualCheckIn
);

/**
 * @route   GET /api/checkin/:adminCode/stats
 * @desc    Statistiques de présence
 * @access  Private (admin code required)
 */
router.get('/:adminCode/stats',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('GET_ATTENDANCE_STATS'),
  checkInController.getAttendanceStats
);

/**
 * @route   GET /api/checkin/:adminCode/search
 * @desc    Rechercher un invité pour check-in manuel
 * @access  Private (admin code required)
 */
router.get('/:adminCode/search',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('SEARCH_GUEST_CHECKIN'),
  checkInController.searchGuestForCheckIn
);

module.exports = router;
