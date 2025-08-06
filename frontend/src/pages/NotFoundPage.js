import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <FiAlertCircle className="mx-auto h-24 w-24 text-gray-400 mb-6" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
          <p className="text-gray-600 mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FiHome className="h-5 w-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Page précédente
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
