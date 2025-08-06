const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de l\'invité est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true; // Email optionnel
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: 'Email invalide'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Téléphone optionnel
        return /^[\d\s\-\+\(\)]{8,15}$/.test(phone);
      },
      message: 'Numéro de téléphone invalide'
    }
  },
  qrToken: {
    type: String,
    unique: true,
    sparse: true, // Permet des valeurs null/undefined multiples
    index: true
  },
  qrCodeUrl: {
    type: String // Base64 ou URL du QR code
  },
  isCheckedIn: {
    type: Boolean,
    default: false,
    index: true
  },
  checkedInAt: {
    type: Date
  },
  checkedInBy: {
    type: String // Nom ou ID de la personne qui a scanné
  },
  invitationType: {
    type: String,
    enum: {
      values: ['VIP', 'Standard', 'Staff'],
      message: 'Le type d\'invitation doit être VIP, Standard ou Staff'
    },
    default: 'Standard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
guestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index composé pour éviter les doublons nom+email par événement
guestSchema.index({ eventId: 1, email: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { email: { $exists: true, $ne: null } }
});

// Index pour les statistiques
guestSchema.index({ eventId: 1, isCheckedIn: 1 });
guestSchema.index({ eventId: 1, invitationType: 1 });

module.exports = mongoose.model('Guest', guestSchema);
