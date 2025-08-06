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
    // Configuration pour mobile - privilégier caméra arrière
    rememberLastUsedCamera: true,
    // Configuration caméra optimisée
    videoConstraints: {
      facingMode: { ideal: "environment" }, // Caméra arrière
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    ...options
  };

  // Initialiser le scanner
  const startScanning = async (elementId, onScanSuccess, onScanFailure) => {
    try {
      // Nettoyer d'abord si nécessaire
      if (scannerRef.current) {
        console.log('🧹 Nettoyage du scanner précédent...');
        await stopScanning();
        // Attendre un peu pour libérer les ressources
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setError(null);
      setIsScanning(true);

      // Vérifier si l'API caméra est supportée
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('L\'API caméra n\'est pas supportée sur cet appareil');
      }

      // Vérifier que l'élément existe
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Élément ${elementId} non trouvé`);
      }

      console.log('📷 Création du scanner QR simple...');
      
      // Configuration simplifiée - PAS de UI supplémentaire
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        // IMPORTANT: Désactiver tous les éléments UI supplémentaires
        showTorchButtonIfSupported: false,
        showZoomSliderIfSupported: false,
        showCameraSelection: false,
        // Privilégier caméra arrière
        videoConstraints: {
          facingMode: "environment" // Force caméra arrière
        }
      };

      // Créer le scanner avec configuration minimale
      const scanner = new Html5QrcodeScanner(
        elementId,
        config,
        false // verbose = false
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

      // Masquer les éléments UI indésirables après un court délai
      setTimeout(() => {
        // Masquer le sélecteur de caméra et l'option d'import de fichier
        const cameraSelection = document.querySelector('#' + elementId + ' select');
        const fileInput = document.querySelector('#' + elementId + ' input[type="file"]');
        const fileButton = document.querySelector('#' + elementId + ' button');
        
        if (cameraSelection) {
          cameraSelection.style.display = 'none';
          console.log('🙈 Sélecteur de caméra masqué');
        }
        
        if (fileInput) {
          fileInput.style.display = 'none';
          console.log('🙈 Input fichier masqué');
        }
        
        // Masquer le bouton "Scan an Image File" s'il existe
        const buttons = document.querySelectorAll('#' + elementId + ' button');
        buttons.forEach(button => {
          if (button.textContent.includes('Scan an Image File') || 
              button.textContent.includes('Select Camera')) {
            button.style.display = 'none';
            console.log('🙈 Bouton indésirable masqué:', button.textContent);
          }
        });
        
        // Masquer tous les éléments qui ne sont pas la vidéo
        const allElements = document.querySelectorAll('#' + elementId + ' > *');
        allElements.forEach(el => {
          if (!el.querySelector('video') && !el.id.includes('qr-shaded-region')) {
            el.style.display = 'none';
          }
        });
      }, 1000);

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
        console.log('🛑 Arrêt du scanner...');
        // Libérer toutes les ressources
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log('✅ Scanner arrêté et nettoyé');
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de l\'arrêt du scanner:', err);
      // Forcer le nettoyage même en cas d'erreur
      scannerRef.current = null;
      setIsScanning(false);
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
