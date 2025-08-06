import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCamera, FiCameraOff, FiUser, FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiSettings, FiVolumeX, FiVolume2 } from 'react-icons/fi';
import useQRScanner from '../hooks/useQRScanner';
import useSocket from '../hooks/useSocket';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const ScannerPage = () => {
  const { adminCode } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualCheckin, setManualCheckin] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stats, setStats] = useState({ scanned: 0, errors: 0 });
  
  const audioContextRef = useRef(null);
  // Désactivation temporaire de Socket.IO pour éviter les erreurs
  // const socket = useSocket(adminCode);
  const socket = null;
  
  const { startScanning, stopScanning, error: scannerError } = useQRScanner();

  useEffect(() => {
    if (!adminCode) {
      navigate('/');
      return;
    }
    loadEvent();
    loadStats(); // Charger les stats initiales
  }, [adminCode, navigate]);

  // Socket.IO désactivé temporairement
  // useEffect(() => {
  //   if (socket) {
  //     socket.on('checkinUpdate', (data) => {
  //       // Mettre à jour les stats en temps réel
  //       setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }));
  //     });

  //     return () => {
  //       socket.off('checkinUpdate');
  //     };
  //   }
  // }, [socket]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (scannerActive) {
        stopScanning();
      }
    };
  }, [scannerActive, stopScanning]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${adminCode}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Erreur event:', error);
      if (error.response?.status === 404) {
        toast.error('Événement non trouvé');
        navigate('/');
      } else {
        toast.error('Erreur lors du chargement de l\'événement');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/checkin/${adminCode}/stats`);
      if (response.data.success && response.data.data) {
        const statsData = response.data.data;
        setStats({
          total: statsData.totalGuests || 0,
          scanned: statsData.checkedIn || 0,
          errors: statsData.scanErrors || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const playSound = (type) => {
    if (!audioEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sons différents selon le résultat
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      } else {
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
      }
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Impossible de jouer le son:', error);
    }
  };

  async function handleScanSuccess(decodedText) {
    try {
      console.log('🔍 QR Code scanné:', decodedText);
      console.log('🔍 AdminCode utilisé:', adminCode);
      
      const response = await api.post(`/checkin/${adminCode}/validate`, {
        qrToken: decodedText
      });
      
      console.log('✅ Réponse serveur:', response.data);
      
      const result = {
        type: 'success',
        guest: response.data.guest,
        message: response.data.message,
        timestamp: new Date()
      };
      
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Garder 10 derniers
      
      // Recharger les stats pour avoir les vrais chiffres
      await loadStats();
      
      playSound('success');
      toast.success(`🎉 ${response.data.guest.name} enregistré !`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      console.error('❌ Détails erreur:', error.response?.data);
      console.error('❌ Status code:', error.response?.status);
      
      const result = {
        type: 'error',
        message: error.response?.data?.message || 'Erreur de validation',
        qrToken: decodedText.substring(0, 20) + '...',
        timestamp: new Date()
      };
      
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      
      playSound('error');
      
      // Gestion spéciale pour l'invité déjà enregistré
      if (error.response?.data?.code === 'ALREADY_CHECKED_IN') {
        const guestData = error.response.data.data?.guest;
        const checkInTime = guestData?.checkedInAt ? 
          new Date(guestData.checkedInAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'heure inconnue';
        
        toast.error(
          `⚠️ ${guestData?.name || 'Cet invité'} est déjà enregistré depuis ${checkInTime}`,
          { 
            duration: 5000,
            position: 'top-center',
            style: {
              background: '#F59E0B',
              color: 'white'
            }
          }
        );
      } else if (error.response?.data?.code === 'NO_QR_CODE') {
        // Erreur QR code non généré
        toast.error(
          `🚫 QR code non généré pour cet invité. Veuillez d'abord générer les QR codes.`,
          { 
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#DC2626',
              color: 'white'
            }
          }
        );
      } else {
        toast.error(`❌ ${result.message}`, {
          duration: 4000,
          position: 'top-center'
        });
      }
    }
  }

  function handleScanError(error) {
    console.log('Scan error (normal):', error);
    // Ne pas afficher les erreurs de scan normal (pas de QR trouvé)
  }

  const toggleScanner = async () => {
    console.log('🔄 Toggle scanner - État actuel:', scannerActive);
    
    if (scannerActive) {
      console.log('🛑 Arrêt du scanner');
      stopScanning();
      setScannerActive(false);
    } else {
      try {
        console.log('🎬 Tentative de démarrage du scanner');
        
        // Vérifier les permissions caméra avant de démarrer
        const permissions = await navigator.permissions.query({ name: 'camera' });
        console.log('📷 Permissions caméra:', permissions.state);
        
        if (permissions.state === 'denied') {
          throw new Error('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
        }
        
        // Vérifier que l'élément existe
        const container = document.getElementById('qr-scanner-container');
        console.log('📦 Container trouvé:', !!container);
        
        if (!container) {
          throw new Error('Container du scanner non trouvé');
        }
        
        // Demander explicitement l'accès à la caméra
        console.log('🔑 Demande d\'accès à la caméra...');
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('✅ Accès caméra obtenu');
        
        // CORRECTION: Passer les bons paramètres à startScanning
        console.log('▶️ Démarrage du scanner...');
        await startScanning('qr-scanner-container', handleScanSuccess, handleScanError);
        console.log('✅ Scanner démarré avec succès');
        
        setScannerActive(true);
        toast.success('Scanner activé', { duration: 2000 });
      } catch (error) {
        console.error('❌ Erreur scanner:', error);
        
        // Messages d'erreur plus spécifiques
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          toast.error('Accès à la caméra refusé. Autorisez l\'accès et réessayez.');
        } else if (error.message.includes('NotFoundError')) {
          toast.error('Aucune caméra trouvée sur cet appareil.');
        } else if (error.message.includes('NotSupportedError')) {
          toast.error('Scanner QR non supporté sur ce navigateur.');
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
      }
    }
  };

  const handleManualCheckin = async (e) => {
    e.preventDefault();
    if (!selectedGuest) {
      toast.error('Veuillez sélectionner un invité');
      return;
    }

    console.log('Frontend - Invité sélectionné:', selectedGuest);
    console.log('Frontend - ID à envoyer:', selectedGuest.id);
    
    try {
      const requestData = {
        guestId: selectedGuest.id,
        scannerDevice: 'Scanner Manuel Web'
      };
      
      console.log('Frontend - Données envoyées:', requestData);
      
      const response = await api.post(`/checkin/${adminCode}/manual`, requestData);
      
      console.log('✅ Réponse backend reçue:', response.data);
      
      const result = {
        type: 'success',
        guest: response.data.data.guest,
        message: 'Check-in manuel réussi',
        timestamp: new Date(),
        manual: true
      };
      
      setLastScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      
      // Recharger les stats pour avoir les vrais chiffres
      console.log('📊 Rechargement des stats...');
      await loadStats();
      console.log('📊 Stats rechargées avec succès');
      
      setGuestName('');
      setSelectedGuest(null);
      setSearchResults([]);
      setManualCheckin(false);
      
      // Message de confirmation avec plus de détails
      toast.success(
        `🎉 ${response.data.data.guest.name} enregistré avec succès !`,
        { 
          duration: 4000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );
      
    } catch (error) {
      console.error('❌ Erreur check-in manuel complète:', error);
      console.error('❌ Détails de la réponse:', error.response);
      console.error('❌ Status code:', error.response?.status);
      console.error('❌ Message backend:', error.response?.data);
      
      // Gestion spéciale pour l'invité déjà enregistré
      if (error.response?.data?.code === 'ALREADY_CHECKED_IN') {
        const guestData = error.response.data.data?.guest;
        const checkInTime = guestData?.checkedInAt ? 
          new Date(guestData.checkedInAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'heure inconnue';
        
        toast.error(
          `⚠️ ${guestData?.name || 'Cet invité'} est déjà enregistré depuis ${checkInTime}`,
          { 
            duration: 5000,
            style: {
              background: '#F59E0B',
              color: 'white'
            }
          }
        );
      } else if (error.response?.data?.code === 'NO_QR_CODE') {
        // Erreur QR code non généré
        toast.error(
          `🚫 ${selectedGuest.name} n'a pas de QR code généré. Veuillez d'abord générer les QR codes depuis la gestion des invités.`,
          { 
            duration: 6000,
            style: {
              background: '#DC2626',
              color: 'white'
            }
          }
        );
      } else if (error.response?.status === 500) {
        // Erreur serveur - peut-être que le check-in a quand même réussi
        toast.error(
          'Erreur serveur, mais l\'enregistrement a peut-être réussi. Vérifiez le dashboard.',
          { 
            duration: 6000,
            style: {
              background: '#DC2626',
              color: 'white'
            }
          }
        );
        // Recharger les stats au cas où
        await loadStats();
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors du check-in manuel');
      }
    }
  };

  const searchGuests = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/checkin/${adminCode}/search?search=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.data.guests || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGuestNameChange = (e) => {
    const value = e.target.value;
    setGuestName(value);
    setSelectedGuest(null);
    
    // Debounce la recherche
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchGuests(value);
    }, 300);
  };

  const selectGuest = (guest) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setSearchResults([]);
  };

  const getResultIcon = (result) => {
    if (result.type === 'success') {
      return <FiCheckCircle className="h-6 w-6 text-green-600" />;
    } else {
      return <FiXCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getResultBgColor = (result) => {
    if (result.type === 'success') {
      return 'bg-green-50 border-green-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Événement non trouvé</h2>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header mobile */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{event.name}</h1>
            <p className="text-sm text-gray-400">Scanner QR</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 text-gray-400 hover:text-white"
              title={audioEnabled ? 'Désactiver les sons' : 'Activer les sons'}
            >
              {audioEnabled ? <FiVolume2 className="h-5 w-5" /> : <FiVolumeX className="h-5 w-5" />}
            </button>
            
            <Link
              to={`/admin/${adminCode}`}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Dashboard
            </Link>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.scanned}</div>
            <div className="text-xs text-gray-400">Scannés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
            <div className="text-xs text-gray-400">Erreurs</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Zone caméra */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="relative aspect-square max-w-sm mx-auto">
            {/* Container pour le scanner QR */}
            <div 
              id="qr-scanner-container" 
              className={`w-full h-full ${scannerActive ? 'block' : 'hidden'}`}
              style={{ minHeight: '300px' }}
            ></div>
            
            {!scannerActive && (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center" style={{ minHeight: '300px' }}>
                <div className="text-center">
                  <FiCameraOff className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                  <p className="text-gray-400">Caméra désactivée</p>
                  <p className="text-xs text-gray-500 mt-2">Cliquez sur "Démarrer le scanner" pour activer</p>
                </div>
              </div>
            )}
            
            {/* Overlay de scan */}
            {scannerActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Coins du cadre de scan */}
                <div className="absolute top-16 left-16 w-8 h-8 border-l-4 border-t-4 border-blue-400"></div>
                <div className="absolute top-16 right-16 w-8 h-8 border-r-4 border-t-4 border-blue-400"></div>
                <div className="absolute bottom-16 left-16 w-8 h-8 border-l-4 border-b-4 border-blue-400"></div>
                <div className="absolute bottom-16 right-16 w-8 h-8 border-r-4 border-b-4 border-blue-400"></div>
                
                {/* Ligne de scan animée */}
                <div className="absolute inset-x-16 top-16 bottom-16 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
          
          {scannerError && (
            <div className="p-4 bg-red-900 border-t border-red-700">
              <p className="text-red-300 text-sm text-center">{scannerError}</p>
              <p className="text-red-400 text-xs text-center mt-2">
                Vérifiez les autorisations caméra dans votre navigateur
              </p>
            </div>
          )}
          
          {/* Zone de debug temporaire */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-2 bg-yellow-900 border-t border-yellow-700">
              <p className="text-yellow-300 text-xs">
                Debug: Scanner actif = {scannerActive ? 'OUI' : 'NON'} | 
                Erreur = {scannerError || 'Aucune'}
              </p>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="space-y-4">
          <button
            onClick={toggleScanner}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
              scannerActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {scannerActive ? (
              <>
                <FiCameraOff className="inline h-6 w-6 mr-2" />
                Arrêter le scanner
              </>
            ) : (
              <>
                <FiCamera className="inline h-6 w-6 mr-2" />
                Démarrer le scanner
              </>
            )}
          </button>
          
          <button
            onClick={() => setManualCheckin(!manualCheckin)}
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            <FiUser className="inline h-5 w-5 mr-2" />
            Check-in manuel
          </button>
        </div>

        {/* Formulaire check-in manuel */}
        {manualCheckin && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Check-in manuel</h3>
            <form onSubmit={handleManualCheckin} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={handleGuestNameChange}
                  placeholder="Tapez le nom de l'invité..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                
                {/* Résultats de recherche */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => selectGuest(guest)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors ${
                          guest.isCheckedIn ? 'opacity-50' : ''
                        }`}
                        disabled={guest.isCheckedIn}
                      >
                        <div className="font-medium text-white">{guest.name}</div>
                        <div className="text-sm text-gray-400">
                          {guest.email} • {guest.invitationType}
                          {guest.isCheckedIn && ' • Déjà enregistré'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Indicateur de chargement */}
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <FiRefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Invité sélectionné */}
              {selectedGuest && (
                <div className="bg-gray-700 rounded-lg p-3 border border-green-500">
                  <div className="flex items-center space-x-2">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-white">{selectedGuest.name}</div>
                      <div className="text-sm text-gray-400">
                        {selectedGuest.email} • {selectedGuest.invitationType}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setManualCheckin(false);
                    setGuestName('');
                    setSelectedGuest(null);
                    setSearchResults([]);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedGuest}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedGuest ? 'Enregistrer' : 'Sélectionner un invité'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dernier résultat */}
        {lastScanResult && (
          <div className={`rounded-lg border p-4 ${getResultBgColor(lastScanResult)}`}>
            <div className="flex items-start space-x-3">
              {getResultIcon(lastScanResult)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${
                    lastScanResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastScanResult.type === 'success' ? 'Succès' : 'Erreur'}
                    {lastScanResult.manual && ' (Manuel)'}
                  </h4>
                  <span className={`text-xs ${
                    lastScanResult.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastScanResult.timestamp.toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                
                {lastScanResult.guest && (
                  <div className={`mb-1 ${
                    lastScanResult.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <div className="font-medium">{lastScanResult.guest.name}</div>
                    <div className="text-sm opacity-75">{lastScanResult.guest.type}</div>
                  </div>
                )}
                
                <p className={`text-sm ${
                  lastScanResult.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastScanResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historique des scans */}
        {scanHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Historique récent</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scanHistory.map((result, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    {result.type === 'success' ? (
                      <FiCheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <FiXCircle className="h-4 w-4 text-red-400" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {result.guest?.name || 'Erreur de scan'}
                        {result.manual && ' (Manuel)'}
                      </div>
                      {result.guest && (
                        <div className="text-xs text-gray-400">{result.guest.type}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {result.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Instructions</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Pointez la caméra vers le QR code de l'invité</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Assurez-vous que le QR code est bien éclairé et dans le cadre</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Utilisez le check-in manuel si le QR code est illisible</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Les sons indiquent le succès (aigu) ou l'échec (grave) du scan</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
