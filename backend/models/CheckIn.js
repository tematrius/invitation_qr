const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  scanTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  scannerDevice: {
    type: String,
    trim: true
  },
  scannerIP: {
    type: String,
    validate: {
      validator: function(ip) {
        if (!ip) return true;
        return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) || 
               /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
      },
      message: 'Adresse IP invalide'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['success', 'duplicate', 'invalid', 'expired'],
      message: 'Le statut doit être success, duplicate, invalid ou expired'
    },
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Les notes ne peuvent pas dépasser 200 caractères']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les statistiques et recherches
checkInSchema.index({ eventId: 1, scanTime: 1 });
checkInSchema.index({ eventId: 1, status: 1 });
checkInSchema.index({ guestId: 1, scanTime: -1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
