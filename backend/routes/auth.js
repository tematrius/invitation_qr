const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateCreateEvent } = require('../middleware/validation');
const { createEventLimiter, authLimiter } = require('../middleware/rateLimiter');
const { logAdminAction } = require('../middleware/auth');

/**
 * @route   POST /api/auth/create-event
 * @desc    Créer un nouvel événement et obtenir le code admin
 * @access  Public (rate limited)
 */
router.post('/create-event', 
  createEventLimiter,
  validateCreateEvent,
  logAdminAction('CREATE_EVENT'),
  eventController.createEvent
);

/**
 * @route   POST /api/auth/verify-admin
 * @desc    Vérifier le code administrateur
 * @access  Public (rate limited)
 */
router.post('/verify-admin',
  authLimiter,
  logAdminAction('VERIFY_ADMIN'),
  eventController.verifyAdminCode
);

module.exports = router;
