const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'événement est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  date: {
    type: Date,
    required: [true, 'La date de l\'événement est requise'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date de l\'événement doit être dans le futur'
    }
  },
  location: {
    type: String,
    required: [true, 'Le lieu de l\'événement est requis'],
    trim: true,
    maxlength: [200, 'Le lieu ne peut pas dépasser 200 caractères']
  },
  adminCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdBy: {
    type: String,
    required: [true, 'L\'email de l\'administrateur est requis'],
    validate: {
      validator: function(email) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: 'Email invalide'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxGuests: {
    type: Number,
    default: 1000,
    min: [1, 'Le nombre maximum d\'invités doit être au moins 1']
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
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour optimiser les recherches
eventSchema.index({ adminCode: 1, isActive: 1 });

module.exports = mongoose.model('Event', eventSchema);
