import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { validateEmail } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    createdBy: '',
    maxGuests: 1000
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [eventCreated, setEventCreated] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur si l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom de l'événement
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'événement est requis';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères';
    }

    // Date
    if (!formData.date) {
      newErrors.date = 'La date de l\'événement est requise';
    } else {
      const selectedDate = new Date(formData.date);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.date = 'La date doit être dans le futur';
      }
    }

    // Lieu
    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu de l\'événement est requis';
    } else if (formData.location.trim().length > 200) {
      newErrors.location = 'Le lieu ne peut pas dépasser 200 caractères';
    }

    // Email administrateur
    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'L\'email administrateur est requis';
    } else if (!validateEmail(formData.createdBy)) {
      newErrors.createdBy = 'Format d\'email invalide';
    }

    // Description (optionnelle)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La description ne peut pas dépasser 500 caractères';
    }

    // Nombre maximum d'invités
    if (formData.maxGuests < 1) {
      newErrors.maxGuests = 'Le nombre maximum d\'invités doit être au moins 1';
    } else if (formData.maxGuests > 10000) {
      newErrors.maxGuests = 'Le nombre maximum d\'invités ne peut pas dépasser 10 000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.createEvent({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        createdBy: formData.createdBy.trim().toLowerCase(),
        maxGuests: parseInt(formData.maxGuests)
      });

      if (response.success) {
        setEventCreated(response.data.event);
        setShowSuccessModal(true);
        toast.success('Événement créé avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate(`/admin/${eventCreated.adminCode}`);
  };

  // Fonction pour copier le code admin
  const copyAdminCode = async () => {
    try {
      await navigator.clipboard.writeText(eventCreated.adminCode);
      toast.success('Code administrateur copié !');
    } catch (error) {
      toast.error('Impossible de copier le code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">QR Invitations</h1>
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Créer un nouvel événement
            </h2>
            <p className="text-gray-600">
              Remplissez les informations ci-dessous pour créer votre événement et obtenir votre code administrateur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de l'événement */}
            <div>
              <label htmlFor="name" className="label label-required">
                Nom de l'événement
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="Ex: Conférence Tech 2024"
                maxLength={100}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
                rows={3}
                placeholder="Description de votre événement..."
                maxLength={500}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Date et heure */}
            <div>
              <label htmlFor="date" className="label label-required">
                Date et heure
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`input-field ${errors.date ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Lieu */}
            <div>
              <label htmlFor="location" className="label label-required">
                Lieu
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`input-field ${errors.location ? 'input-error' : ''}`}
                placeholder="Ex: Centre de conférences, Paris"
                maxLength={200}
                disabled={isLoading}
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location}</p>
              )}
            </div>

            {/* Email administrateur */}
            <div>
              <label htmlFor="createdBy" className="label label-required">
                Email administrateur
              </label>
              <input
                type="email"
                id="createdBy"
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                className={`input-field ${errors.createdBy ? 'input-error' : ''}`}
                placeholder="admin@example.com"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Cet email sera utilisé pour vous identifier en tant qu'administrateur
              </p>
              {errors.createdBy && (
                <p className="text-sm text-red-600 mt-1">{errors.createdBy}</p>
              )}
            </div>

            {/* Nombre maximum d'invités */}
            <div>
              <label htmlFor="maxGuests" className="label">
                Nombre maximum d'invités
              </label>
              <input
                type="number"
                id="maxGuests"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleChange}
                className={`input-field ${errors.maxGuests ? 'input-error' : ''}`}
                min={1}
                max={10000}
                disabled={isLoading}
              />
              {errors.maxGuests && (
                <p className="text-sm text-red-600 mt-1">{errors.maxGuests}</p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 pt-6">
              <Link
                to="/"
                className="btn-secondary flex-1 text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 inline-flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>Créer l'événement</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de succès */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {}}
        size="lg"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Événement créé avec succès !
          </h3>
          
          {eventCreated && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Votre code administrateur :
              </h4>
              <div className="bg-white border-2 border-dashed border-primary-300 rounded-lg p-4 mb-4">
                <div className="font-mono text-3xl font-bold text-primary-600 tracking-wider">
                  {eventCreated.adminCode}
                </div>
              </div>
              <button
                onClick={copyAdminCode}
                className="btn-secondary inline-flex items-center space-x-2 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copier le code</span>
              </button>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Nom :</strong> {eventCreated.name}</p>
                <p><strong>Lieu :</strong> {eventCreated.location}</p>
                <p><strong>Date :</strong> {new Date(eventCreated.date).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Important :</strong> Conservez précieusement ce code administrateur. 
              Il vous permettra d'accéder à votre dashboard et de gérer votre événement.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="btn-primary w-full"
            >
              Accéder au dashboard
            </button>
            <Link
              to="/"
              className="btn-secondary w-full text-center block"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateEventPage;
