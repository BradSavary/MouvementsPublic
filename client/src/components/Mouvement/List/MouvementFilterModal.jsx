import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';

export function MouvementFilterModal({ 
  isOpen, 
  onClose, 
  filters, 
  onApplyFilters, 
  onResetFilters, 
  availableServices = [], 
  canFilterByService 
}) {
  const [localFilters, setLocalFilters] = useState({...filters});

  // Synchroniser l'état local avec les props quand elles changent
  useEffect(() => {
    setLocalFilters({...filters});
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      type: '',
      dateFrom: '',
      dateTo: '',
      filterService: '',
      checkStatus: ''
    });
    if (onResetFilters) {
      onResetFilters();
      onClose(); // Fermer la modal après réinitialisation
    }
  };

  const handleApply = () => {
    // Appliquer les filtres
    onApplyFilters(localFilters);
    // Fermer la modal explicitement
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrer les mouvements"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Appliquer
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de mouvement</label>
          <select
            name="type"
            value={localFilters.type || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="Entrée">Entrée</option>
            <option value="Sortie">Sortie</option>
            <option value="Transfert">Transfert</option>
          </select>
        </div>

         {/* Nouveau filtre: statut de validation */}
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut de vérification</label>
          <select
            name="checkStatus"
            value={localFilters.checkStatus || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="checked">Validés</option>
            <option value="unchecked">Non validés</option>
          </select>
        </div>
        
        {/* Option de filtrage par service (visible uniquement pour certains utilisateurs) */}
        {canFilterByService && availableServices.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              name="filterService"
              value={localFilters.filterService || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tous les services</option>
              {availableServices
                .filter(service => !["Admin", "Accueil", "Cadre de Santé"].includes(service))
                .map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
            </select>
          </div>
        )}
        
    {/* ... Filtres des dates ... */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
            <input
              type="date"
              name="dateFrom"
              value={localFilters.dateFrom || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
            <input
              type="date"
              name="dateTo"
              value={localFilters.dateTo || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}