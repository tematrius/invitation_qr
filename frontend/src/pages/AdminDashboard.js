import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiUsers, FiUserCheck, FiClock, FiAlertCircle, FiDownload, FiGrid, FiSettings, FiRefreshCw, FiMenu } from 'react-icons/fi';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [guestStats, setGuestStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const adminCode = localStorage.getItem('adminCode');
  // Désactivation temporaire de Socket.IO pour éviter les erreurs
  // const { socket, isConnected } = useSocket(adminCode);
  const socket = null;
  const isConnected = false;

  // Debug: afficher l'état de la connexion Socket (désactivé)
  // useEffect(() => {
  //   console.log('Socket state:', { socket: !!socket, isConnected, hasOn: socket && typeof socket.on === 'function' });
  // }, [socket, isConnected]);

  useEffect(() => {
    if (!adminCode) {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [adminCode, navigate]); // loadDashboardData est définie dans le composant, pas besoin de l'ajouter

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

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(`/checkin/${adminCode}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  }, [adminCode]);

  // Écouter les mises à jour temps réel (désactivé temporairement)
  // useEffect(() => {
  //   if (socket && typeof socket.on === 'function') {
  //     socket.on('checkinUpdate', (data) => {
  //       setStats(prev => prev ? { ...prev, checkedIn: prev.checkedIn + 1 } : null);
  //       toast.success(`${data.guestName} vient d'arriver !`, {
  //         icon: '✅',
  //         duration: 3000
  //       });
  //     });

  //     socket.on('guestAdded', () => {
  //       loadStats();
  //       toast.success('Nouvel invité ajouté !', { icon: '👤' });
  //     });

  //     return () => {
  //       if (socket && typeof socket.off === 'function') {
  //         socket.off('checkinUpdate');
  //         socket.off('guestAdded');
  //       }
  //     };
  //   }
  // }, [socket, loadStats]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [eventData, statsData] = await Promise.all([
        api.get(`/events/${adminCode}`),
        api.get(`/checkin/${adminCode}/stats`)
      ]);
      
      console.log('Event data:', eventData.data);
      console.log('Stats data:', statsData.data);
      console.log('Stats data.data:', statsData.data.data);
      console.log('Stats byType:', statsData.data.byType || statsData.data.data?.byType);
      console.log('Stats totalGuests:', statsData.data.totalGuests || statsData.data.data?.totalGuests);
      
      // Le backend retourne { success: true, data: { event: {...} } }
      setEvent(eventData.data.data?.event || eventData.data);
      
      // Les stats sont dans statsData.data.data selon la structure backend
      const statsInfo = statsData.data.data || statsData.data;
      console.log('Structure complète statsInfo:', statsInfo);
      
      // Le backend retourne directement les champs à la racine
      setStats({
        totalGuests: statsInfo.totalGuests || 0,
        checkedIn: statsInfo.checkedIn || 0,
        pending: statsInfo.pending || 0,
        attendanceRate: statsInfo.attendanceRate || 0,
        scanErrors: statsInfo.scanErrors || 0,
        checkinsByHour: statsInfo.checkinsByHour || [],
        recentCheckIns: statsInfo.recentCheckIns || []
      });
      
      // Les données par type sont dans byType directement
      setGuestStats({
        byType: statsInfo.byType || []
      });
    } catch (error) {
      console.error('Erreur dashboard:', error);
      if (error.response?.status === 404) {
        toast.error('Événement non trouvé');
        localStorage.removeItem('adminCode');
        navigate('/');
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Données mises à jour !', { icon: '🔄' });
  };

  const formatDate = (date) => {
    if (!date) return 'Date non définie';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Date invalide';
    
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Présent': return 'text-green-600 bg-green-100';
      case 'Absent': return 'text-gray-600 bg-gray-100';
      case 'En attente': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

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
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données de l'événement</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
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
                <h1 className="text-xl font-semibold text-gray-900">{event.name}</h1>
                <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
              </div>
            </div>
            
            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Indicateur de connexion Socket (désactivé temporairement) */}
              {/* 
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
              </div>
              */}
              
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="Actualiser"
              >
                <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600">Code admin:</span>
                <code className="text-sm font-mono font-semibold text-gray-900">{adminCode}</code>
              </div>
              
              <button
                onClick={() => {
                  localStorage.removeItem('adminCode');
                  navigate('/');
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Déconnexion
              </button>
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
              <div className="flex flex-col space-y-3">
                <div className="pb-3 border-b border-gray-100">
                  <h1 className="text-lg font-semibold text-gray-900">{event.name}</h1>
                  <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                  <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2 inline-block">
                    <span className="text-xs text-gray-600">Code admin:</span>
                    <code className="text-xs font-mono font-semibold text-gray-900 ml-1">{adminCode}</code>
                  </div>
                </div>
                
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 py-2"
                >
                  <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('adminCode');
                    navigate('/');
                  }}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 py-2"
                >
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation - Desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          <Link
            to={`/admin/${adminCode}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
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
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Exports
          </Link>
        </div>

        {/* Navigation - Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-2 mb-8">
          <Link
            to={`/admin/${adminCode}`}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-center text-sm"
          >
            Dashboard
          </Link>
          <Link
            to={`/admin/${adminCode}/guests`}
            className="bg-white text-gray-700 px-3 py-2 rounded-lg border hover:bg-gray-50 text-center text-sm"
          >
            Gestion
          </Link>
          <Link
            to={`/scan/${adminCode}`}
            className="bg-white text-gray-700 px-3 py-2 rounded-lg border hover:bg-gray-50 text-center text-sm"
          >
            Scanner
          </Link>
          <Link
            to={`/admin/${adminCode}/exports`}
            className="bg-white text-gray-700 px-3 py-2 rounded-lg border hover:bg-gray-50 text-center text-sm"
          >
            Exports
          </Link>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total invités</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGuests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiUserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Présents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
                <p className="text-xs text-green-600">
                  {stats.totalGuests > 0 ? Math.round((stats.checkedIn / stats.totalGuests) * 100) : 0}% du total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGuests - stats.checkedIn}</p>
                <p className="text-xs text-yellow-600">
                  {stats.totalGuests > 0 ? Math.round(((stats.totalGuests - stats.checkedIn) / stats.totalGuests) * 100) : 0}% restant
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Erreurs scan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scanErrors || 0}</p>
                <p className="text-xs text-red-600">Dernière heure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Répartition par type */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par type d'invité</h3>
            {guestStats.byType && guestStats.byType.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={guestStats.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {guestStats.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>

          {/* Évolution des arrivées */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Arrivées par heure</h3>
            {stats.checkinsByHour && stats.checkinsByHour.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.checkinsByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Aucune arrivée enregistrée
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to={`/admin/${adminCode}/guests?action=add`}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiUsers className="h-5 w-5" />
              <span>Ajouter un invité</span>
            </Link>
            
            <Link
              to={`/admin/${adminCode}/guests?action=import`}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="h-5 w-5" />
              <span>Import CSV</span>
            </Link>
            
              <Link
                to={`/admin/${adminCode}/guests?action=generate-qr`}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiGrid className="h-5 w-5" />
                <span>Générer QR codes</span>
              </Link>            <Link
              to={`/scan/${adminCode}`}
              className="flex items-center justify-center space-x-2 bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FiSettings className="h-5 w-5" />
              <span>Scanner mobile</span>
            </Link>
          </div>
        </div>

        {/* Dernières arrivées */}
        {stats.recentCheckIns && stats.recentCheckIns.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières arrivées</h3>
            <div className="space-y-3">
              {stats.recentCheckIns.slice(0, 5).map((checkin, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">{checkin.guestName}</p>
                      <p className="text-sm text-gray-600">{checkin.guestType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {new Date(checkin.checkedInAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(checkin.checkedInAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.recentCheckIns.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to={`/admin/${adminCode}/guests?tab=checkins`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Voir toutes les arrivées →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
