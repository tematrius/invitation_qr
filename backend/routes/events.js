const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyAdminCode, verifyEventOwnership, logAdminAction } = require('../middleware/auth');
const { validateCreateEvent } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route   GET /api/events/:adminCode
 * @desc    Récupérer les détails de l'événement
 * @access  Private (admin code required)
 */
router.get('/:adminCode',
  apiLimiter,
  verifyAdminCode,
  logAdminAction('GET_EVENT_DETAILS'),
  eventController.getEventDetails
);

/**
 * @route   PUT /api/events/:adminCode/:eventId
 * @desc    Modifier l'événement
 * @access  Private (admin code required)
 */
router.put('/:adminCode/:eventId',
  apiLimiter,
  verifyEventOwnership,
  logAdminAction('UPDATE_EVENT'),
  eventController.updateEvent
);

/**
 * @route   DELETE /api/events/:adminCode/:eventId
 * @desc    Supprimer (désactiver) l'événement
 * @access  Private (admin code required)
 */
router.delete('/:adminCode/:eventId',
  apiLimiter,
  verifyEventOwnership,
  logAdminAction('DELETE_EVENT'),
  eventController.deleteEvent
);

module.exports = router;
