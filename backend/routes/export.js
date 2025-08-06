const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyAdminCode, logAdminAction } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   GET /api/export/:adminCode/qr-codes
 * @desc    Export ZIP des QR codes
 * @access  Private (admin code required)
 */
router.get('/:adminCode/qr-codes',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('EXPORT_QR_CODES'),
  exportController.exportQRCodes
);

/**
 * @route   GET /api/export/:adminCode/guest-list
 * @desc    Export CSV de la liste des invités
 * @access  Private (admin code required)
 */
router.get('/:adminCode/guest-list',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('EXPORT_GUEST_LIST'),
  exportController.exportGuestList
);

/**
 * @route   GET /api/export/:adminCode/attendance
 * @desc    Export CSV des présences
 * @access  Private (admin code required)
 */
router.get('/:adminCode/attendance',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('EXPORT_ATTENDANCE'),
  exportController.exportAttendanceData
);

/**
 * @route   GET /api/export/:adminCode/report
 * @desc    Export du rapport complet de l'événement
 * @access  Private (admin code required)
 */
router.get('/:adminCode/report',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('EXPORT_EVENT_REPORT'),
  exportController.exportEventReport
);

module.exports = router;
