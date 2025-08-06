import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiDownload, FiGrid, FiEdit, FiTrash2, FiSearch, FiFilter, FiUpload, FiX, FiCheck, FiUsers, FiMail, FiPhone, FiMenu } from 'react-icons/fi';
import api from '../utils/api';
import useSocket from '../hooks/useSocket';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'react-hot-toast';

const GuestManagement = () => {
  const { adminCode } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [event, setEvent] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [stats, setStats] = useState(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  
  // Formulaires
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Standard'
  });
  
  // Import CSV
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  
  // QR Generation
  const [generatingQR, setGeneratingQR] = useState(false);
  
  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Désactivation temporaire de Socket.IO pour éviter les erreurs
  // const socket = useSocket(adminCode);
  const socket = null;

  useEffect(() => {
    if (!adminCode) {
      navigate('/');
      return;
    }
    
    // Vérifier les paramètres URL pour les actions directes
    const action = searchParams.get('action');
    if (action === 'add') setShowAddModal(true);
    if (action === 'import') setShowImportModal(true);
    if (action === 'generate-qr') handleGenerateQR();
    
    loadEvent();
    loadGuests();
  }, [adminCode, searchParams]);

  // Recharger les invités quand les filtres changent
  useEffect(() => {
    if (adminCode) {
      loadGuests();
    }
  }, [searchTerm, typeFilter, statusFilter]);

  // Socket.IO désactivé temporairement
  // useEffect(() => {
  //   if (socket) {
  //     socket.on('guestAdded', (data) => {
  //       setGuests(prev => [data.guest, ...prev]);
  //       toast.success(`${data.guest.name} ajouté !`, { icon: '👤' });
  //     });

  //     socket.on('checkinUpdate', (data) => {
  //       setGuests(prev => prev.map(guest => 
  //         guest._id === data.guestId 
  //           ? { ...guest, status: 'Présent', checkedInAt: data.checkedInAt }
  //           : guest
  //       ));
  //     });

  //     return () => {
  //       socket.off('guestAdded');
  //       socket.off('checkinUpdate');
  //     };
  //   }
  // }, [socket]);

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

  const loadEvent = async () => {
    try {
      const response = await api.get(`/events/${adminCode}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Erreur event:', error);
      if (error.response?.status === 404) {
        toast.error('Événement non trouvé');
        navigate('/');
      }
    }
  };

  const loadGuests = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/guests/${adminCode}?${params}`);
      
      if (response.data.success && response.data.data) {
        const { guests, pagination, stats } = response.data.data;
        setGuests(Array.isArray(guests) ? guests : []);
        setPagination({
          page: pagination.page,
          total: pagination.totalCount,
          pages: pagination.totalPages
        });
        setStats(stats);
      } else {
        setGuests([]);
      }
    } catch (error) {
      console.error('Erreur guests:', error);
      toast.error('Erreur lors du chargement des invités');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    try {
      // Adapter le format pour le backend (type -> invitationType)
      const guestData = {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        invitationType: guestForm.type // Conversion type -> invitationType
      };
      
      const response = await api.post(`/guests/${adminCode}/add-single`, guestData);
      
      // Réinitialiser les filtres pour voir le nouvel invité
      setSearchTerm('');
      setTypeFilter('');
      setStatusFilter('');
      
      // Vérifier si l'invité existe dans la réponse
      if (response.data && response.data.data && response.data.data.guest) {
        // Mettre à jour l'état local
        setGuests(prev => {
          return [response.data.data.guest, ...(Array.isArray(prev) ? prev : [])];
        });
      }
      
      // Recharger les données pour s'assurer de la cohérence
      await loadGuests();
      
      setShowAddModal(false);
      setGuestForm({ name: '', email: '', phone: '', type: 'Standard' });
      toast.success('Invité ajouté avec succès !');
    } catch (error) {
      console.error('Erreur ajout:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de l\'ajout';
      toast.error(errorMessage);
    }
  };

  const handleEditGuest = async (e) => {
    e.preventDefault();
    try {
      // Adapter le format pour le backend (type -> invitationType)
      const guestData = {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        invitationType: guestForm.type // Conversion type -> invitationType
      };
      
      const response = await api.put(`/guests/${adminCode}/${selectedGuest.id}`, guestData);
      
      // Mettre à jour la liste locale
      setGuests(prev => (Array.isArray(prev) ? prev : []).map(guest => 
        guest.id === selectedGuest.id ? response.data.data.guest : guest
      ));
      
      setShowEditModal(false);
      setSelectedGuest(null);
      setGuestForm({ name: '', email: '', phone: '', type: 'Standard' });
      toast.success('Invité modifié avec succès !');
    } catch (error) {
      console.error('Erreur modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteGuest = async () => {
    try {
      await api.delete(`/guests/${adminCode}/${selectedGuest.id}`);
      setGuests(prev => (Array.isArray(prev) ? prev : []).filter(guest => guest.id !== selectedGuest.id));
      setShowDeleteConfirm(false);
      setSelectedGuest(null);
      toast.success('Invité supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      const preview = [];
      const errors = [];
      
      lines.slice(1).forEach((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const guest = {
          name: values[0] || '',
          email: values[1] || '',
          phone: values[2] || '',
          type: values[3] || 'Standard'
        };
        
        // Validation
        const lineErrors = [];
        if (!guest.name) lineErrors.push('Nom manquant');
        if (guest.email && !/\S+@\S+\.\S+/.test(guest.email)) lineErrors.push('Email invalide');
        if (!['VIP', 'Standard', 'Staff'].includes(guest.type)) lineErrors.push('Type invalide');
        
        preview.push({ ...guest, line: index + 2, errors: lineErrors });
        if (lineErrors.length > 0) {
          errors.push({ line: index + 2, errors: lineErrors });
        }
      });
      
      setCsvPreview(preview);
      setCsvErrors(errors);
    };
    
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (!csvFile || csvErrors.length > 0) return;
    
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      
      const response = await api.post(`/guests/${adminCode}/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setGuests(prev => [...response.data.imported, ...(Array.isArray(prev) ? prev : [])]);
      setShowImportModal(false);
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      
      toast.success(`${response.data.imported.length} invités importés !`);
    } catch (error) {
      console.error('Erreur import:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true);
      const response = await api.post(`/guests/${adminCode}/generate-qr`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Recharger les invités pour voir les QR codes générés
        await loadGuests();
      }
    } catch (error) {
      console.error('Erreur génération QR:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleExportQR = async () => {
    try {
      const response = await api.get(`/export/${adminCode}/qr-codes`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-codes-${event?.name || 'event'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('QR codes exportés !');
    } catch (error) {
      console.error('Erreur export QR:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'export');
    }
  };

  const openEditModal = (guest) => {
    setSelectedGuest(guest);
    setGuestForm({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      type: guest.invitationType // Utiliser invitationType du backend
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (guest) => {
    setSelectedGuest(guest);
    setShowDeleteConfirm(true);
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Présent': 'bg-green-100 text-green-800',
      'Absent': 'bg-gray-100 text-gray-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'checked-in': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    
    // Conversion des statuts
    let displayStatus;
    if (status === 'checked-in' || status === true) {
      displayStatus = 'Présent';
    } else if (status === 'pending' || status === false || !status) {
      displayStatus = 'En attente';
    } else {
      displayStatus = status || 'En attente';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[displayStatus] || classes['En attente']}`}>
        {displayStatus}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const classes = {
      'VIP': 'bg-purple-100 text-purple-800',
      'Standard': 'bg-blue-100 text-blue-800',
      'Staff': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[type] || classes['Standard']}`}>
        {type}
      </span>
    );
  };

  if (loading && (!guests || guests.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
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
                <h1 className="text-xl font-semibold text-gray-900">Gestion des invités</h1>
                <p className="text-sm text-gray-600">{event?.name}</p>
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
                  <h1 className="text-lg font-semibold text-gray-900">Gestion des invités</h1>
                  <p className="text-sm text-gray-600">{event?.name}</p>
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
        {/* Navigation - Desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          <Link
            to={`/admin/${adminCode}`}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            to={`/admin/${adminCode}/guests`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
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
            className="bg-white text-gray-700 px-3 py-2 rounded-lg border hover:bg-gray-50 text-center text-sm"
          >
            Dashboard
          </Link>
          <Link
            to={`/admin/${adminCode}/guests`}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-center text-sm"
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

        {/* Actions et filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 border mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Invités ({pagination.total})
            </h2>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <FiUpload className="h-4 w-4" />
                <span>Import CSV</span>
              </button>
              
              <button
                onClick={handleGenerateQR}
                disabled={generatingQR || !guests || guests.length === 0}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiGrid className="h-4 w-4" />
                <span>{generatingQR ? 'Génération...' : 'Générer QR'}</span>
              </button>
              
              <button
                onClick={handleExportQR}
                disabled={!guests || guests.length === 0}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="h-4 w-4" />
                <span>Export ZIP</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un invité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadGuests(1)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="VIP">VIP</option>
              <option value="Standard">Standard</option>
              <option value="Staff">Staff</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="checked-in">Présent</option>
              <option value="pending">En attente</option>
            </select>
            
            <button
              onClick={() => loadGuests(1)}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <FiFilter className="h-4 w-4" />
              <span>Filtrer</span>
            </button>
          </div>
        </div>

        {/* Liste des invités */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : (!guests || guests.length === 0) ? (
            <div className="p-8 text-center">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun invité</h3>
              <p className="text-gray-600 mb-4">Commencez par ajouter des invités à votre événement</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Ajouter le premier invité
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arrivée
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guests.filter(guest => guest && guest.id).map((guest) => (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{guest.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="space-y-1">
                            {guest.email && (
                              <div className="flex items-center space-x-1">
                                <FiMail className="h-3 w-3" />
                                <span>{guest.email}</span>
                              </div>
                            )}
                            {guest.phone && (
                              <div className="flex items-center space-x-1">
                                <FiPhone className="h-3 w-3" />
                                <span>{guest.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(guest.invitationType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(guest.isCheckedIn ? 'checked-in' : 'pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {guest.checkedInAt ? 
                            new Date(guest.checkedInAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(guest)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifier"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(guest)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {guests.filter(guest => guest && guest.id).map((guest) => (
                  <div key={guest.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{guest.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(guest)}
                          className="text-blue-600"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(guest)}
                          className="text-red-600"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {guest.email && (
                        <div className="flex items-center space-x-1">
                          <FiMail className="h-3 w-3" />
                          <span>{guest.email}</span>
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center space-x-1">
                          <FiPhone className="h-3 w-3" />
                          <span>{guest.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(guest.invitationType)}
                        {getStatusBadge(guest.isCheckedIn ? 'checked-in' : 'pending')}
                      </div>
                      {guest.checkedInAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(guest.checkedInAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} sur {pagination.pages} ({pagination.total} invités)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadGuests(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => loadGuests(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Ajout Invité */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un invité"
      >
        <form onSubmit={handleAddGuest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jean Dupont"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={guestForm.email}
              onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="jean@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={guestForm.phone}
              onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0123456789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'invitation
            </label>
            <select
              value={guestForm.type}
              onChange={(e) => setGuestForm({ ...guestForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Modification Invité */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGuest(null);
        }}
        title="Modifier l'invité"
      >
        <form onSubmit={handleEditGuest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={guestForm.name}
              onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={guestForm.email}
              onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={guestForm.phone}
              onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'invitation
            </label>
            <select
              value={guestForm.type}
              onChange={(e) => setGuestForm({ ...guestForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard">Standard</option>
              <option value="VIP">VIP</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedGuest(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Modifier
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Import CSV */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setCsvFile(null);
          setCsvPreview([]);
          setCsvErrors([]);
        }}
        title="Import CSV"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Format attendu: nom,email,telephone,type (VIP, Standard, Staff)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file"
              />
              <label
                htmlFor="csv-file"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Cliquez pour sélectionner un fichier CSV
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  ou glissez-déposez le fichier ici
                </span>
              </label>
            </div>
            
            {csvFile && (
              <p className="text-sm text-gray-600 mt-2">
                Fichier sélectionné: {csvFile.name}
              </p>
            )}
          </div>

          {(csvPreview && csvPreview.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Aperçu ({csvPreview ? csvPreview.length : 0} lignes)
              </h4>
              
              {(csvErrors && csvErrors.length > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">
                    Erreurs détectées ({csvErrors ? csvErrors.length : 0})
                  </h5>
                  <ul className="text-sm text-red-600 space-y-1">
                    {csvErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>
                        Ligne {error.line}: {error.errors.join(', ')}
                      </li>
                    ))}
                    {(csvErrors && csvErrors.length > 5) && (
                      <li>... et {(csvErrors ? csvErrors.length : 0) - 5} autres erreurs</li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(csvPreview && csvPreview.slice) && csvPreview.slice(0, 10).filter(guest => guest && guest.name).map((guest, index) => (
                      <tr key={index} className={(guest.errors && guest.errors.length > 0) ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 text-sm text-gray-900">{guest.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{guest.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{guest.phone}</td>
                        <td className="px-3 py-2 text-sm">
                          {getTypeBadge(guest.type)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {(guest.errors && guest.errors.length > 0) ? (
                            <span className="text-red-600 text-xs">
                              {(guest.errors && guest.errors.join) ? guest.errors.join(', ') : 'Erreurs non spécifiées'}
                            </span>
                          ) : (
                            <FiCheck className="h-4 w-4 text-green-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(csvPreview && csvPreview.length > 10) && (
                  <div className="text-center py-2 text-sm text-gray-500 bg-gray-50">
                    ... et {(csvPreview ? csvPreview.length : 0) - 10} autres lignes
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowImportModal(false);
                setCsvFile(null);
                setCsvPreview([]);
                setCsvErrors([]);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleImportCSV}
              disabled={!csvFile || (csvErrors && csvErrors.length > 0) || importing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Import en cours...' : `Importer ${csvPreview ? csvPreview.length : 0} invités`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedGuest(null);
        }}
        onConfirm={handleDeleteGuest}
        title="Supprimer l'invité"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedGuest?.name} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmVariant="danger"
      />
    </div>
  );
};

export default GuestManagement;
