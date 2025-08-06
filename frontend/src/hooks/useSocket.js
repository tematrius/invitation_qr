import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const useSocket = (adminCode) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventUpdates, setEventUpdates] = useState([]);

  useEffect(() => {
    if (!adminCode) return;

    // URL de base pour Socket.IO (sans /api)
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 
                     (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : null) ||
                     'http://localhost:5000';

    console.log('Connexion Socket.IO à:', socketUrl);

    // Créer la connexion socket
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true
    });

    // Événements de connexion
    newSocket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
      setIsConnected(true);
      
      // Rejoindre la room de l'événement
      if (adminCode) {
        newSocket.emit('join-event', adminCode);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
      setIsConnected(false);
    });

    // Écouter les mises à jour d'événement
    newSocket.on('event-update', (update) => {
      console.log('Mise à jour reçue:', update);
      setEventUpdates(prev => [...prev.slice(-49), update]); // Garder les 50 dernières
    });

    // Gestion des erreurs
    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Nettoyage
    return () => {
      if (newSocket) {
        newSocket.emit('leave-event', adminCode);
        newSocket.disconnect();
      }
    };
  }, [adminCode]);

  // Fonctions utilitaires
  const joinEvent = (eventAdminCode) => {
    if (socket && socket.connected && eventAdminCode) {
      socket.emit('join-event', eventAdminCode);
    }
  };

  const leaveEvent = (eventAdminCode) => {
    if (socket && socket.connected && eventAdminCode) {
      socket.emit('leave-event', eventAdminCode);
    }
  };

  const clearUpdates = () => {
    setEventUpdates([]);
  };

  return {
    socket: socket && socket.connected ? socket : null,
    isConnected,
    eventUpdates,
    joinEvent,
    leaveEvent,
    clearUpdates
  };
};

export default useSocket;
