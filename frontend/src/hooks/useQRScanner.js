import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useState, useEffect, useRef } from 'react';

const useQRScanner = (options = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null);
  const scannerRef = useRef(null);
  const elementRef = useRef(null);

  const defaultOptions = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,
    ...options
  };

  // Initialiser le scanner
  const startScanning = async (elementId, onScanSuccess, onScanFailure) => {
    try {
      if (scannerRef.current) {
        await stopScanning();
      }

      setError(null);
      setIsScanning(true);

      // Vérifier si l'API caméra est supportée
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('L\'API caméra n\'est pas supportée sur cet appareil');
      }

      // Créer le scanner
      const scanner = new Html5QrcodeScanner(
        elementId,
        defaultOptions,
        false // verbose
      );

      scannerRef.current = scanner;

      // Gestionnaire de succès
      const handleSuccess = (decodedText, decodedResult) => {
        setLastScanResult({
          text: decodedText,
          result: decodedResult,
          timestamp: new Date()
        });
        
        if (onScanSuccess) {
          onScanSuccess(decodedText, decodedResult);
        }
      };

      // Gestionnaire d'erreur
      const handleError = (errorMessage) => {
        // On ignore les erreurs de scan normales (pas de QR code trouvé)
        if (!errorMessage.includes('No MultiFormat Readers were able')) {
          console.warn('Erreur de scan QR:', errorMessage);
          if (onScanFailure) {
            onScanFailure(errorMessage);
          }
        }
      };

      // Démarrer le scan
      scanner.render(handleSuccess, handleError);

    } catch (err) {
      console.error('Erreur lors du démarrage du scanner:', err);
      setError(err.message);
      setIsScanning(false);
    }
  };

  // Arrêter le scanner
  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de l\'arrêt du scanner:', err);
      setError(err.message);
    }
  };

  // Scanner un fichier image
  const scanFile = async (file, onSuccess, onError) => {
    try {
      const html5QrCode = new Html5Qrcode("temp-file-scanner");
      const result = await html5QrCode.scanFile(file, true);
      
      setLastScanResult({
        text: result,
        result: { decodedText: result },
        timestamp: new Date(),
        source: 'file'
      });

      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      console.error('Erreur lors du scan de fichier:', err);
      setError(err.message);
      if (onError) {
        onError(err.message);
      }
      throw err;
    }
  };

  // Obtenir les caméras disponibles
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      return devices;
    } catch (err) {
      console.error('Erreur lors de la récupération des caméras:', err);
      setError(err.message);
      return [];
    }
  };

  // Changer de caméra
  const switchCamera = async (cameraId) => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.applyVideoConstraints({
          deviceId: { exact: cameraId }
        });
      }
    } catch (err) {
      console.error('Erreur lors du changement de caméra:', err);
      setError(err.message);
    }
  };

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return {
    isScanning,
    error,
    lastScanResult,
    startScanning,
    stopScanning,
    scanFile,
    getCameras,
    switchCamera,
    clearError: () => setError(null),
    clearLastResult: () => setLastScanResult(null)
  };
};

export default useQRScanner;
