const Guest = require('../models/Guest');
const CheckIn = require('../models/CheckIn');
const archiver = require('archiver');
const { formatDate } = require('../utils/helpers');

/**
 * Export des QR codes en ZIP
 */
const exportQRCodes = async (req, res) => {
  try {
    const event = req.event;
    const { type = 'all' } = req.query;

    console.log(`Export QR codes pour événement ${event._id}, type: ${type}`);

    // Construire le filtre
    const filter = { eventId: event._id, qrCodeUrl: { $exists: true, $ne: null } };
    
    if (type !== 'all') {
      if (['VIP', 'Standard', 'Staff'].includes(type)) {
        filter.invitationType = type;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Type invalide. Utilisez: all, VIP, Standard, ou Staff'
        });
      }
    }

    const guests = await Guest.find(filter).lean();
    console.log(`Invités trouvés avec QR codes: ${guests.length}`);

    if (guests.length === 0) {
      // Vérifier combien d'invités n'ont pas de QR code
      const totalGuests = await Guest.countDocuments({ eventId: event._id });
      const guestsWithoutQR = await Guest.countDocuments({ 
        eventId: event._id, 
        $or: [
          { qrCodeUrl: { $exists: false } },
          { qrCodeUrl: null }
        ]
      });
      
      return res.status(404).json({
        success: false,
        message: `Aucun QR code trouvé. ${guestsWithoutQR}/${totalGuests} invités n'ont pas de QR code. Générez d'abord les QR codes.`
      });
    }

    // Configuration de la réponse pour le ZIP
    const fileName = `qr-codes-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Créer l'archive ZIP
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      console.error('Erreur lors de la création du ZIP:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'archive'
        });
      }
    });

    // Pipe l'archive vers la réponse
    archive.pipe(res);

    // Ajouter les QR codes au ZIP
    let successCount = 0;
    let errorCount = 0;
    
    guests.forEach((guest, index) => {
      try {
        if (!guest.qrCodeUrl) {
          console.log(`Invité ${guest.name} sans QR code`);
          errorCount++;
          return;
        }

        // Vérifier le format base64
        if (!guest.qrCodeUrl.startsWith('data:image/png;base64,')) {
          console.log(`Format QR code invalide pour ${guest.name}:`, guest.qrCodeUrl.substring(0, 50));
          errorCount++;
          return;
        }

        // Extraire les données base64 du QR code
        const base64Data = guest.qrCodeUrl.replace(/^data:image\/png;base64,/, '');
        
        if (!base64Data) {
          console.log(`Données base64 vides pour ${guest.name}`);
          errorCount++;
          return;
        }

        const buffer = Buffer.from(base64Data, 'base64');
        
        if (buffer.length === 0) {
          console.log(`Buffer vide pour ${guest.name}`);
          errorCount++;
          return;
        }
        
        // Nom de fichier sécurisé
        const safeName = guest.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        const fileName = `${String(index + 1).padStart(3, '0')}_${safeName}_${guest.invitationType}.png`;
        
        archive.append(buffer, { name: fileName });
        successCount++;
        console.log(`QR code ajouté: ${fileName} (${buffer.length} bytes)`);
        
      } catch (error) {
        console.error(`Erreur lors de l'ajout du QR code pour ${guest.name}:`, error);
        errorCount++;
      }
    });

    console.log(`QR codes traités: ${successCount} succès, ${errorCount} erreurs`);

    // Ajouter un fichier d'informations
    const infoContent = `Informations sur l'événement
=====================================

Nom de l'événement: ${event.name}
Date: ${formatDate(event.date)}
Lieu: ${event.location}
Code administrateur: ${event.adminCode}

Statistiques de l'export
========================

Nombre total de QR codes: ${guests.length}
Date d'export: ${formatDate(new Date())}
Type d'export: ${type === 'all' ? 'Tous les invités' : type}

Répartition par type:
${guests.reduce((acc, guest) => {
  acc[guest.invitationType] = (acc[guest.invitationType] || 0) + 1;
  return acc;
}, {})}

Instructions d'utilisation
=========================

1. Imprimez les QR codes ou envoyez-les aux invités
2. Utilisez l'application de scan pour valider les entrées
3. Les QR codes sont sécurisés et uniques pour chaque invité

Chaque fichier suit le format: [Numéro]_[Nom]_[Type].png
`;

    archive.append(infoContent, { name: 'README.txt' });

    // Finaliser l'archive
    await archive.finalize();

  } catch (error) {
    console.error('Erreur lors de l\'export des QR codes:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de l\'export'
      });
    }
  }
};

/**
 * Export de la liste des invités en CSV
 */
const exportGuestList = async (req, res) => {
  try {
    const event = req.event;
    const { includeQR = 'false' } = req.query;

    console.log(`Export liste invités pour événement ${event._id}`);

    const guests = await Guest.find({ eventId: event._id })
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Invités trouvés: ${guests.length}`);

    if (guests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun invité trouvé'
      });
    }

    // Construire le CSV avec échappement sécurisé
    const headers = ['Nom', 'Email', 'Telephone', 'Type', 'Status', 'Date_Ajout'];
    
    if (includeQR === 'true') {
      headers.push('QR_Code_Genere', 'Date_CheckIn', 'CheckIn_Par');
    }
    
    let csvContent = headers.join(',') + '\n';

    guests.forEach(guest => {
      try {
        // Échapper les guillemets et caractères spéciaux
        const escapeCSV = (value) => {
          if (value === null || value === undefined) return '';
          const str = String(value).replace(/"/g, '""');
          return `"${str}"`;
        };

        const row = [
          escapeCSV(guest.name || ''),
          escapeCSV(guest.email || ''),
          escapeCSV(guest.phone || ''),
          escapeCSV(guest.invitationType || 'Standard'),
          escapeCSV(guest.isCheckedIn ? 'Présent' : 'En attente'),
          escapeCSV(guest.createdAt ? formatDate(guest.createdAt) : '')
        ];

        if (includeQR === 'true') {
          row.push(escapeCSV(guest.qrToken ? 'Oui' : 'Non'));
          row.push(escapeCSV(guest.checkedInAt ? formatDate(guest.checkedInAt) : ''));
          row.push(escapeCSV(guest.checkedInBy || ''));
        }

        csvContent += row.join(',') + '\n';
      } catch (rowError) {
        console.error(`Erreur lors du traitement de l'invité ${guest.name}:`, rowError);
      }
    });

    const fileName = `invites-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Envoyer le contenu avec BOM UTF-8
    const csvWithBOM = '\ufeff' + csvContent;
    res.send(csvWithBOM);

    console.log(`Export CSV liste invités réussi: ${fileName}`);

  } catch (error) {
    console.error('Erreur lors de l\'export de la liste d\'invités:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de l\'export'
      });
    }
  }
};

/**
 * Export des données de présence en CSV
 */
const exportAttendanceData = async (req, res) => {
  try {
    const event = req.event;

    console.log(`Export présences pour événement ${event._id}`);

    // D'abord, vérifier s'il y a des invités pour cet événement
    const totalGuests = await Guest.countDocuments({ eventId: event._id });
    console.log(`Total invités pour l'événement: ${totalGuests}`);

    // Vérifier tous les check-ins (pas seulement success)
    const allCheckIns = await CheckIn.countDocuments({ eventId: event._id });
    console.log(`Total check-ins enregistrés: ${allCheckIns}`);

    // Vérifier les check-ins avec statut success
    const successfulCheckIns = await CheckIn.countDocuments({ 
      eventId: event._id, 
      status: 'success' 
    });
    console.log(`Check-ins avec statut 'success': ${successfulCheckIns}`);

    // Si pas de check-ins success, vérifier les invités présents directement
    const presentGuests = await Guest.find({ 
      eventId: event._id, 
      isCheckedIn: true 
    }).lean();
    console.log(`Invités marqués comme présents: ${presentGuests.length}`);

    // Si pas de check-ins mais des invités présents, créer le CSV à partir des invités
    if (successfulCheckIns === 0 && presentGuests.length > 0) {
      console.log('Utilisation des données d\'invités présents au lieu des check-ins');
      
      const headers = ['Nom', 'Email', 'Telephone', 'Type', 'Heure_Arrivee'];
      let csvContent = headers.join(',') + '\n';

      presentGuests.forEach(guest => {
        const escapeCSV = (value) => {
          if (value === null || value === undefined) return '';
          const str = String(value).replace(/"/g, '""');
          return `"${str}"`;
        };

        const row = [
          escapeCSV(guest.name || ''),
          escapeCSV(guest.email || ''),
          escapeCSV(guest.phone || ''),
          escapeCSV(guest.invitationType || 'Standard'),
          escapeCSV(guest.checkedInAt ? formatDate(guest.checkedInAt) : 'Non défini')
        ];
        
        csvContent += row.join(',') + '\n';
      });

      const fileName = `presences-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const csvWithBOM = '\ufeff' + csvContent;
      res.send(csvWithBOM);
      
      console.log(`Export CSV présences réussi depuis les invités: ${fileName}`);
      return;
    }

    // Récupérer les données de check-in avec détails des invités
    const checkIns = await CheckIn.find({ 
      eventId: event._id, 
      status: 'success' 
    })
    .populate('guestId', 'name email phone invitationType')
    .sort({ scanTime: 1 })
    .lean();

    console.log(`Check-ins trouvés: ${checkIns.length}`);

    if (checkIns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnée de présence trouvée'
      });
    }

    // Construire le CSV avec échappement sécurisé
    const headers = ['Nom', 'Email', 'Telephone', 'Type', 'Heure_Arrivee', 'Scanner_Utilise', 'IP_Scanner', 'Notes'];
    let csvContent = headers.join(',') + '\n';

    checkIns.forEach(checkIn => {
      try {
        if (checkIn.guestId) {
          const guest = checkIn.guestId;
          
          // Échapper les guillemets et caractères spéciaux
          const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value).replace(/"/g, '""');
            return `"${str}"`;
          };

          const row = [
            escapeCSV(guest.name || ''),
            escapeCSV(guest.email || ''),
            escapeCSV(guest.phone || ''),
            escapeCSV(guest.invitationType || 'Standard'),
            escapeCSV(checkIn.scanTime ? formatDate(checkIn.scanTime) : ''),
            escapeCSV(checkIn.scannerDevice || ''),
            escapeCSV(checkIn.scannerIP || ''),
            escapeCSV(checkIn.notes || '')
          ];
          
          csvContent += row.join(',') + '\n';
        }
      } catch (rowError) {
        console.error(`Erreur lors du traitement du check-in ${checkIn._id}:`, rowError);
      }
    });

    const fileName = `presences-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Envoyer le contenu avec BOM UTF-8
    const csvWithBOM = '\ufeff' + csvContent;
    res.send(csvWithBOM);

    console.log(`Export CSV présences réussi: ${fileName}`);

  } catch (error) {
    console.error('Erreur lors de l\'export des présences:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de l\'export'
      });
    }
  }
};

/**
 * Export du rapport complet de l'événement
 */
const exportEventReport = async (req, res) => {
  try {
    const event = req.event;

    // Récupérer toutes les données
    const [guests, checkIns, errorLogs] = await Promise.all([
      Guest.find({ eventId: event._id }).lean(),
      CheckIn.find({ eventId: event._id, status: 'success' })
        .populate('guestId', 'name email invitationType')
        .lean(),
      CheckIn.find({ eventId: event._id, status: { $ne: 'success' } }).lean()
    ]);

    // Calculer les statistiques
    const totalGuests = guests.length;
    const checkedInGuests = guests.filter(g => g.isCheckedIn).length;
    const attendanceRate = totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0;

    const statsByType = guests.reduce((acc, guest) => {
      const type = guest.invitationType || 'Standard';
      if (!acc[type]) acc[type] = { total: 0, checkedIn: 0 };
      acc[type].total++;
      if (guest.isCheckedIn) acc[type].checkedIn++;
      return acc;
    }, {});

    // Construire le rapport
    let reportContent = `RAPPORT D'ÉVÉNEMENT
===================

Informations générales
---------------------
Nom de l'événement: ${event.name}
Date: ${formatDate(event.date)}
Lieu: ${event.location}
Code administrateur: ${event.adminCode}
Créé par: ${event.createdBy}
Date de création: ${formatDate(event.createdAt)}

Statistiques globales
--------------------
Invités total: ${totalGuests}
Présents: ${checkedInGuests}
Taux de présence: ${attendanceRate}%
En attente: ${totalGuests - checkedInGuests}

Répartition par type d'invitation
--------------------------------
`;

    Object.entries(statsByType).forEach(([type, stats]) => {
      const typeRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
      reportContent += `${type}: ${stats.checkedIn}/${stats.total} (${typeRate}%)\n`;
    });

    reportContent += `
Activité de check-in
------------------
Nombre total de scans réussis: ${checkIns.length}
Nombre d'erreurs: ${errorLogs.length}

`;

    if (checkIns.length > 0) {
      const firstCheckIn = new Date(Math.min(...checkIns.map(c => new Date(c.scanTime))));
      const lastCheckIn = new Date(Math.max(...checkIns.map(c => new Date(c.scanTime))));
      
      reportContent += `Premier check-in: ${formatDate(firstCheckIn)}
Dernier check-in: ${formatDate(lastCheckIn)}

`;
    }

    // Analyse par heure
    const checkInsByHour = checkIns.reduce((acc, checkIn) => {
      const hour = new Date(checkIn.scanTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(checkInsByHour).length > 0) {
      reportContent += `Affluence par heure
------------------
`;
      Object.entries(checkInsByHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          reportContent += `${hour}h: ${count} arrivées\n`;
        });
    }

    if (errorLogs.length > 0) {
      const errorsByType = errorLogs.reduce((acc, error) => {
        acc[error.status] = (acc[error.status] || 0) + 1;
        return acc;
      }, {});

      reportContent += `
Erreurs rencontrées
------------------
`;
      Object.entries(errorsByType).forEach(([type, count]) => {
        reportContent += `${type}: ${count} tentatives\n`;
      });
    }

    reportContent += `
Rapport généré le: ${formatDate(new Date())}
`;

    const fileName = `rapport-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.txt`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.send(reportContent);

  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de la génération du rapport'
    });
  }
};

module.exports = {
  exportQRCodes,
  exportGuestList,
  exportAttendanceData,
  exportEventReport
};
