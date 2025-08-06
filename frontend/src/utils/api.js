import axios from 'axios';
import toast from 'react-hot-toast';

// Configuration de base d'Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    // Debug: Log toutes les requêtes
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      params: config.params
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    // Debug: Log réponses réussies
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Debug: Log erreurs
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // Gestion globale des erreurs
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          if (data.errors && Array.isArray(data.errors)) {
            toast.error(data.errors.join('\n'));
          } else {
            toast.error(data.message || 'Requête invalide');
          }
          break;
        case 401:
          toast.error('Non autorisé');
          break;
        case 403:
          toast.error('Accès interdit');
          break;
        case 404:
          toast.error('Ressource non trouvée');
          break;
        case 429:
          toast.error('Trop de requêtes. Veuillez attendre.');
          break;
        case 500:
          toast.error('Erreur serveur. Veuillez réessayer.');
          break;
        default:
          toast.error(data.message || 'Une erreur est survenue');
      }
    } else if (error.request) {
      toast.error('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } else {
      toast.error('Erreur de configuration de la requête');
    }
    
    return Promise.reject(error);
  }
);

// Services API

// ***** AUTHENTIFICATION *****
export const authAPI = {
  // Créer un événement
  createEvent: async (eventData) => {
    const response = await api.post('/auth/create-event', eventData);
    return response.data;
  },

  // Vérifier le code admin
  verifyAdminCode: async (adminCode) => {
    const response = await api.post('/auth/verify-admin', { adminCode });
    return response.data;
  }
};

// ***** ÉVÉNEMENTS *****
export const eventAPI = {
  // Récupérer les détails d'un événement
  getEventDetails: async (adminCode) => {
    const response = await api.get(`/events/${adminCode}`);
    return response.data;
  },

  // Mettre à jour un événement
  updateEvent: async (adminCode, eventId, updateData) => {
    const response = await api.put(`/events/${adminCode}/${eventId}`, updateData);
    return response.data;
  },

  // Supprimer un événement
  deleteEvent: async (adminCode, eventId) => {
    const response = await api.delete(`/events/${adminCode}/${eventId}`);
    return response.data;
  }
};

// ***** INVITÉS *****
export const guestAPI = {
  // Ajouter un invité
  addSingleGuest: async (adminCode, guestData) => {
    const response = await api.post(`/guests/${adminCode}/add-single`, guestData);
    return response.data;
  },

  // Importer des invités depuis CSV
  importGuestsFromCSV: async (adminCode, csvFile) => {
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    
    const response = await api.post(`/guests/${adminCode}/import-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Récupérer la liste des invités
  getEventGuests: async (adminCode, params = {}) => {
    const response = await api.get(`/guests/${adminCode}`, { params });
    return response.data;
  },

  // Mettre à jour un invité
  updateGuest: async (adminCode, guestId, updateData) => {
    const response = await api.put(`/guests/${adminCode}/${guestId}`, updateData);
    return response.data;
  },

  // Supprimer un invité
  deleteGuest: async (adminCode, guestId) => {
    const response = await api.delete(`/guests/${adminCode}/${guestId}`);
    return response.data;
  },

  // Générer les QR codes
  generateQRCodes: async (adminCode, options = {}) => {
    const response = await api.post(`/guests/${adminCode}/generate-qr`, options);
    return response.data;
  }
};

// ***** CHECK-IN *****
export const checkinAPI = {
  // Valider un QR code
  validateQRCode: async (adminCode, qrData) => {
    const response = await api.post(`/checkin/${adminCode}/validate`, qrData);
    return response.data;
  },

  // Check-in manuel
  manualCheckIn: async (adminCode, guestData) => {
    const response = await api.post(`/checkin/${adminCode}/manual`, guestData);
    return response.data;
  },

  // Récupérer les statistiques
  getAttendanceStats: async (adminCode, period = '24h') => {
    const response = await api.get(`/checkin/${adminCode}/stats`, {
      params: { period }
    });
    return response.data;
  },

  // Rechercher un invité pour check-in
  searchGuestForCheckIn: async (adminCode, searchTerm) => {
    const response = await api.get(`/checkin/${adminCode}/search`, {
      params: { search: searchTerm }
    });
    return response.data;
  }
};

// ***** EXPORTS *****
export const exportAPI = {
  // Export des QR codes (retourne un blob)
  exportQRCodes: async (adminCode, type = 'all') => {
    const response = await api.get(`/export/${adminCode}/qr-codes`, {
      params: { type },
      responseType: 'blob'
    });
    return response.data;
  },

  // Export de la liste des invités
  exportGuestList: async (adminCode, includeQR = false) => {
    const response = await api.get(`/export/${adminCode}/guest-list`, {
      params: { includeQR },
      responseType: 'blob'
    });
    return response.data;
  },

  // Export des données de présence
  exportAttendanceData: async (adminCode) => {
    const response = await api.get(`/export/${adminCode}/attendance`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export du rapport complet
  exportEventReport: async (adminCode) => {
    const response = await api.get(`/export/${adminCode}/report`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// ***** UTILITAIRES *****
export const utilsAPI = {
  // Vérifier la santé du serveur
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Récupérer les statistiques système
  getSystemStats: async () => {
    const response = await api.get('/system-stats');
    return response.data;
  }
};

// Helper pour télécharger un fichier depuis un blob
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;
