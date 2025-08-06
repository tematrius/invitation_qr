const crypto = require('crypto');
const QRCode = require('qrcode');

class QRCodeGenerator {
  constructor(secretKey) {
    this.secretKey = secretKey || process.env.QR_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error('QR_SECRET_KEY est requis');
    }
  }

  /**
   * Génère un token sécurisé pour le QR code
   * @param {Object} payload - Données à inclure dans le token
   * @param {string} payload.eventId - ID de l'événement
   * @param {string} payload.guestId - ID de l'invité
   * @param {string} payload.name - Nom de l'invité
   * @param {number} expiryHours - Heures avant expiration (défaut: 24h)
   * @returns {string} Token base64 signé
   */
  generateQRToken(payload, expiryHours = 24) {
    const tokenData = {
      eventId: payload.eventId,
      guestId: payload.guestId,
      name: payload.name,
      timestamp: Date.now(),
      expiresAt: Date.now() + (expiryHours * 60 * 60 * 1000)
    };

    // Génération de la signature HMAC
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(tokenData))
      .digest('hex');

    const signedToken = {
      ...tokenData,
      signature
    };

    // Encodage en base64
    return Buffer.from(JSON.stringify(signedToken)).toString('base64');
  }

  /**
   * Valide un token QR code
   * @param {string} qrToken - Token à valider
   * @returns {Object} Résultat de la validation
   */
  validateQRToken(qrToken) {
    try {
      // Décodage du token
      const decoded = JSON.parse(Buffer.from(qrToken, 'base64').toString());
      const { signature, ...tokenData } = decoded;

      // Vérification de la signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(JSON.stringify(tokenData))
        .digest('hex');

      if (signature !== expectedSignature) {
        return {
          valid: false,
          error: 'Signature invalide',
          code: 'INVALID_SIGNATURE'
        };
      }

      // Vérification de l'expiration
      if (Date.now() > decoded.expiresAt) {
        return {
          valid: false,
          error: 'QR code expiré',
          code: 'EXPIRED',
          data: tokenData
        };
      }

      return {
        valid: true,
        data: tokenData
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Format de QR code invalide',
        code: 'INVALID_FORMAT'
      };
    }
  }

  /**
   * Génère l'image QR code en base64
   * @param {string} qrToken - Token à encoder
   * @param {Object} options - Options de génération
   * @returns {Promise<string>} Image QR en base64
   */
  async generateQRCodeImage(qrToken, options = {}) {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrToken, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du QR code: ${error.message}`);
    }
  }

  /**
   * Génère QR code et token pour un invité
   * @param {Object} guest - Données de l'invité
   * @param {string} eventId - ID de l'événement
   * @returns {Promise<Object>} Token et image QR
   */
  async generateGuestQR(guest, eventId) {
    const qrToken = this.generateQRToken({
      eventId: eventId,
      guestId: guest._id.toString(),
      name: guest.name
    });

    const qrCodeImage = await this.generateQRCodeImage(qrToken);

    return {
      qrToken,
      qrCodeUrl: qrCodeImage
    };
  }
}

module.exports = QRCodeGenerator;
