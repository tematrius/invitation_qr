import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date pour l'affichage
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy HH:mm') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString, { locale: fr }) : 'Date invalide';
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Formate une date relative (il y a X temps)
 */
export const formatRelativeTime = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) 
      ? formatDistanceToNow(dateObj, { addSuffix: true, locale: fr })
      : 'Date invalide';
  } catch (error) {
    return 'Date invalide';
  }
};

/**
 * Valide un email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{8,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Génère un identifiant unique
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Formate un nom de fichier sécurisé
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};

/**
 * Calcule les statistiques d'un ensemble de données
 */
export const calculateStats = (data, options = {}) => {
  const { groupBy, countBy } = options;
  
  const stats = {
    total: data.length,
    groups: {}
  };

  if (groupBy) {
    stats.groups = data.reduce((acc, item) => {
      const key = item[groupBy] || 'Non défini';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  if (countBy) {
    stats.counts = data.reduce((acc, item) => {
      const key = item[countBy] ? 'true' : 'false';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  return stats;
};

/**
 * Debounce function pour limiter les appels d'API
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Convertit un fichier en base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Parse un fichier CSV
 */
export const parseCSV = (text) => {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return headers.reduce((obj, header, index) => {
        obj[header.toLowerCase()] = values[index] || '';
        return obj;
      }, {});
    });
};

/**
 * Formate un nombre avec des séparateurs
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

/**
 * Calcule un pourcentage
 */
export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Copie du texte dans le presse-papiers
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Vérifie si l'appareil est mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Vérifie si l'appareil supporte les caméras
 */
export const supportsCameraAPI = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Génère une couleur aléatoire
 */
export const generateRandomColor = () => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Convertit une taille en octets en format lisible
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valide les données d'un invité
 */
export const validateGuestData = (guest) => {
  const errors = [];
  
  if (!guest.name || guest.name.trim().length === 0) {
    errors.push('Le nom est requis');
  }
  
  if (guest.email && !validateEmail(guest.email)) {
    errors.push('Email invalide');
  }
  
  if (guest.phone && !validatePhone(guest.phone)) {
    errors.push('Numéro de téléphone invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Génère un template CSV pour l'import
 */
export const generateCSVTemplate = () => {
  const headers = ['nom', 'email', 'telephone', 'type'];
  const example = ['Jean Dupont', 'jean@example.com', '0123456789', 'Standard'];
  
  return `${headers.join(',')}\n${example.join(',')}`;
};

/**
 * Nettoie et normalise les données CSV
 */
export const cleanCSVData = (data) => {
  return data.map(row => ({
    name: (row.nom || row.name || '').trim(),
    email: (row.email || row.mail || '').trim().toLowerCase(),
    phone: (row.telephone || row.phone || row.tel || '').trim(),
    invitationType: (row.type || row.invitation_type || 'Standard').trim()
  })).filter(row => row.name.length > 0);
};

export default {
  formatDate,
  formatRelativeTime,
  validateEmail,
  validatePhone,
  generateId,
  sanitizeFilename,
  calculateStats,
  debounce,
  fileToBase64,
  parseCSV,
  formatNumber,
  calculatePercentage,
  copyToClipboard,
  isMobile,
  supportsCameraAPI,
  generateRandomColor,
  formatFileSize,
  validateGuestData,
  generateCSVTemplate,
  cleanCSVData
};
