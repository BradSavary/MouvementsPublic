import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { createNoMovementDay } from '../../../data/no-movement-days-data';

export function NoMovementModal({ isOpen, onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [service, setService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };
  
  const handleServiceChange = (e) => {
    setService(e.target.value);
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      if (!service) {
        setError('Veuillez sélectionner un service.');
        setIsSubmitting(false);
        return;
      }
      
      const response = await createNoMovementDay(date, service);
      
      if (response.status === 'success') {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(response.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      setError('Une erreur inattendue est survenue.');
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Signaler aucun mouvement"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !service}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Traitement...' : 'Confirmer'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {error}
          </div>
        )}
        
        <p>
          Cette action signalera qu'aucun mouvement n'est prévu pour le service sélectionné à la date indiquée. Les utilisateurs en seront informés jusqu'à la fin de la journée.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <select
            value={service}
            onChange={handleServiceChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Sélectionnez un service</option>
            <option value="SMR">SMR</option>
            <option value="EHPAD">EHPAD</option>
            <option value="Medecine">Médecine</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}