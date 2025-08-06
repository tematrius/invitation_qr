import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiDownload, FiFileText, FiUsers, FiBarChart2, FiPackage, FiCalendar, FiClock, FiMenu } from 'react-icons/fi';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ExportsPage = () => {
  const { adminCode } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!adminCode) {
      navigate('/');
      return;
    }
    loadData();
  }, [adminCode, navigate]);

  // Fermer le menu mobile lors d'un clic ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, statsData] = await Promise.all([
        api.get(`/events/${adminCode}`),
        api.get(`/checkin/${adminCode}/stats`)
      ]);
      
      setEvent(eventData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      if (error.response?.status === 404) {
        toast.error('Événement non trouvé');
        navigate('/');
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, filename, endpoint) => {
    try {
      setExporting(prev => ({ ...prev, [type]: true }));
      
      const response = await api.get(`/export/${adminCode}/${endpoint}`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${filename} téléchargé !`);
    } catch (error) {
      console.error(`Erreur export ${type}:`, error);
      toast.error(error.response?.data?.message || `Erreur lors de l'export ${type}`);
    } finally {
      setExporting(prev => ({ ...prev, [type]: false }));
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const exportOptions = [
    {
      id: 'qr-codes',
      title: 'QR Codes',
      description: 'Archive ZIP contenant tous les QR codes des invités',
      icon: FiPackage,
      filename: `qr-codes-${event?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${formatDate(new Date())}.zip`,
      endpoint: 'qr-codes',
      color: 'purple',
      available: stats?.totalGuests > 0,
      unavailableReason: 'Aucun invité à exporter'
    },
    {
      id: 'guest-list',
      title: 'Liste des invités',
      description: 'Fichier CSV avec tous les invités et leurs informations',
      icon: FiUsers,
      filename: `invites-${event?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${formatDate(new Date())}.csv`,
      endpoint: 'guest-list',
      color: 'blue',
      available: stats?.totalGuests > 0,
      unavailableReason: 'Aucun invité à exporter'
    },
    {
      id: 'attendance',
      title: 'Présences',
      description: 'Fichier CSV avec les heures d\'arrivée des invités présents',
      icon: FiClock,
      filename: `presences-${event?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${formatDate(new Date())}.csv`,
      endpoint: 'attendance',
      color: 'green',
      available: stats?.checkedIn > 0,
      unavailableReason: 'Aucune présence enregistrée'
    },
    {
      id: 'report',
      title: 'Rapport complet',
      description: 'Rapport détaillé avec statistiques et analytics complètes',
      icon: FiBarChart2,
      filename: `rapport-${event?.name?.replace(/[^a-zA-Z0-9]/g, '-')}-${formatDate(new Date())}.txt`,
      endpoint: 'report',
      color: 'orange',
      available: true,
      unavailableReason: null
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700'
      }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiFileText className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données pour l'export</p>
          <Link
            to={`/admin/${adminCode}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo et titre */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                QREvents
              </Link>
              <div className="hidden sm:block h-6 border-l border-gray-300" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Exports</h1>
                <p className="text-sm text-gray-600">{event.name}</p>
              </div>
            </div>
            
            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to={`/admin/${adminCode}`}
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-medium text-sm border border-blue-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour dashboard
              </Link>
            </div>

            {/* Bouton hamburger mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 mobile-menu-container"
            >
              <FiMenu className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Menu mobile */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 mobile-menu-container">
              <div className="flex flex-col space-y-2">
                <div className="pb-2 border-b border-gray-100">
                  <h1 className="text-lg font-semibold text-gray-900">Exports</h1>
                  <p className="text-sm text-gray-600">{event.name}</p>
                </div>
                <Link
                  to={`/admin/${adminCode}`}
                  className="inline-flex items-center text-blue-700 hover:text-blue-800 font-medium py-2 bg-blue-50 rounded-lg px-3 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to={`/admin/${adminCode}`}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            to={`/admin/${adminCode}/guests`}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Gestion des invités
          </Link>
          <Link
            to={`/scan/${adminCode}`}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Scanner
          </Link>
          <Link
            to={`/admin/${adminCode}/exports`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Exports
          </Link>
        </div>

        {/* Résumé de l'événement */}
        <div className="bg-white rounded-lg shadow-sm p-6 border mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Résumé de l'événement</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FiCalendar className="h-4 w-4" />
              <span>
                {new Date(event.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGuests}</div>
              <div className="text-sm text-blue-800">Total invités</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
              <div className="text-sm text-green-800">Présents</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalGuests - stats.checkedIn}</div>
              <div className="text-sm text-yellow-800">En attente</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalGuests > 0 ? Math.round((stats.checkedIn / stats.totalGuests) * 100) : 0}%
              </div>
              <div className="text-sm text-purple-800">Taux présence</div>
            </div>
          </div>
        </div>

        {/* Options d'export */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Options d'export</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportOptions.map((option) => {
              const colors = getColorClasses(option.color);
              const Icon = option.icon;
              
              return (
                <div
                  key={option.id}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-6 transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 ${colors.bg} rounded-lg`}>
                      <Icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {option.description}
                      </p>
                      
                      {option.available ? (
                        <button
                          onClick={() => handleExport(option.id, option.filename, option.endpoint)}
                          disabled={exporting[option.id]}
                          className={`flex items-center space-x-2 ${colors.button} text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        >
                          {exporting[option.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Export en cours...</span>
                            </>
                          ) : (
                            <>
                              <FiDownload className="h-4 w-4" />
                              <span>Télécharger</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">
                          {option.unavailableReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informations sur les formats */}
        <div className="bg-white rounded-lg shadow-sm p-6 border mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Formats d'export</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Fichiers CSV</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Format compatible Excel et Google Sheets</li>
                <li>• Encodage UTF-8 pour les caractères accentués</li>
                <li>• Séparateur : virgule (,)</li>
                <li>• En-têtes de colonnes inclus</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Archive QR codes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Format ZIP compressé</li>
                <li>• Images PNG haute qualité (300x300px)</li>
                <li>• Noms de fichiers organisés par type</li>
                <li>• Prêt pour impression ou envoi</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Conseils d'utilisation</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Exportez les QR codes avant l'événement pour les distribuer</li>
              <li>• Téléchargez le rapport complet après l'événement pour l'archivage</li>
              <li>• Les fichiers CSV peuvent être réimportés dans d'autres systèmes</li>
              <li>• Conservez une copie de sauvegarde de tous les exports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportsPage;
