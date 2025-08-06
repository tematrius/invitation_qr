const crypto = require('crypto');

/**
 * Génère un code administrateur unique et sécurisé
 * @param {number} length - Longueur du code (défaut: 8)
 * @returns {string} Code administrateur
 */
function generateAdminCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

/**
 * Génère un hash sécurisé d'une chaîne
 * @param {string} data - Données à hasher
 * @param {string} salt - Salt optionnel
 * @returns {string} Hash SHA256
 */
function generateHash(data, salt = '') {
  return crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

/**
 * Génère un ID unique basé sur timestamp et random
 * @returns {string} ID unique
 */
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomPart}`;
}

/**
 * Valide le format d'un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si valide
 */
function validateEmail(email) {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
}

/**
 * Valide le format d'un numéro de téléphone
 * @param {string} phone - Téléphone à valider
 * @returns {boolean} True si valide
 */
function validatePhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Nettoie et valide une chaîne de caractères
 * @param {string} str - Chaîne à nettoyer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Chaîne nettoyée
 */
function sanitizeString(str, maxLength = 100) {
  if (!str) return '';
  return str.trim().substring(0, maxLength);
}

/**
 * Génère un nom de fichier sécurisé
 * @param {string} originalName - Nom original
 * @param {string} prefix - Préfixe optionnel
 * @returns {string} Nom de fichier sécurisé
 */
function generateSafeFilename(originalName, prefix = '') {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const extension = originalName.split('.').pop() || '';
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  
  return `${prefix}${timestamp}_${randomSuffix}_${safeName}`;
}

/**
 * Formate une date pour l'affichage
 * @param {Date} date - Date à formater
 * @param {string} locale - Locale (défaut: fr-FR)
 * @returns {string} Date formatée
 */
function formatDate(date, locale = 'fr-FR') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

/**
 * Calcule les statistiques d'un événement
 * @param {Array} guests - Liste des invités
 * @returns {Object} Statistiques
 */
function calculateEventStats(guests) {
  const total = guests.length;
  const checkedIn = guests.filter(g => g.isCheckedIn).length;
  const pending = total - checkedIn;
  
  const byType = guests.reduce((acc, guest) => {
    acc[guest.invitationType] = (acc[guest.invitationType] || 0) + 1;
    return acc;
  }, {});

  const checkedInByType = guests
    .filter(g => g.isCheckedIn)
    .reduce((acc, guest) => {
      acc[guest.invitationType] = (acc[guest.invitationType] || 0) + 1;
      return acc;
    }, {});

  return {
    total,
    checkedIn,
    pending,
    attendanceRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    byType,
    checkedInByType
  };
}

module.exports = {
  generateAdminCode,
  generateHash,
  generateUniqueId,
  validateEmail,
  validatePhone,
  sanitizeString,
  generateSafeFilename,
  formatDate,
  calculateEventStats
};
