import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketTest = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('Déconnecté');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const socketUrl = 'http://localhost:5000';
    addLog(`Tentative de connexion à ${socketUrl}`);

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      setStatus('Connecté');
      addLog('✅ Connexion Socket.IO réussie');
    });

    newSocket.on('disconnect', (reason) => {
      setStatus('Déconnecté');
      addLog(`❌ Déconnexion: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      setStatus('Erreur');
      addLog(`❌ Erreur de connexion: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const testEmit = () => {
    if (socket) {
      socket.emit('test-message', 'Hello from frontend');
      addLog('📤 Message test envoyé');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Test Socket.IO</h2>
      
      <div className="mb-4">
        <span className="font-semibold">Statut: </span>
        <span className={`px-2 py-1 rounded text-sm ${
          status === 'Connecté' ? 'bg-green-100 text-green-800' :
          status === 'Erreur' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      </div>

      <button
        onClick={testEmit}
        disabled={!socket || status !== 'Connecté'}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Test Message
      </button>

      <div className="border rounded p-3 max-h-40 overflow-y-auto">
        <h3 className="font-semibold mb-2">Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun log...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-xs text-gray-700 mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocketTest;
