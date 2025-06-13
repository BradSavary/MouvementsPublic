import React, { useState } from 'react';
import { deleteNoMovementDay } from '../../../data/no-movement-days-data';
import { usePermissions } from '../../../lib/usePermissions';
import { formatDate } from '../../../lib/date';

export function NoMovementBanner({ noMovementDays, onDismiss }) {
  const { can } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingService, setDeletingService] = useState(null);
  
  // Vérifier si la bannière peut être supprimée par l'utilisateur actuel
  const canDismiss = can('createMovement') || can('checkMovement');
  
  // Vérifier si la date est aujourd'hui
  const isToday = noMovementDays && noMovementDays.length > 0 && 
    noMovementDays[0].date === new Date().toISOString().split('T')[0];
  
  const handleDismiss = async (dayData) => {
    if (!canDismiss || !dayData) return;
    
    try {
      setIsDeleting(true);
      setDeletingService(dayData.service);
      const response = await deleteNoMovementDay(dayData.date, dayData.service);
      
      if (response.status === 'success') {
        if (onDismiss) onDismiss();
      } else {
        console.error('Erreur lors de la suppression:', response.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsDeleting(false);
      setDeletingService(null);
    }
  };
  
  if (!noMovementDays || noMovementDays.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {noMovementDays.map((dayData) => (
        <div 
          key={`${dayData.date}-${dayData.service}`}
          className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-700">
                  Aucun mouvement signalé pour le {formatDate(dayData.date)} - Service: {dayData.service}
                </p>
                <p className="text-sm text-green-600">Signalé par {dayData.created_by}</p>
              </div>
            </div>
            
            {canDismiss && isToday && (
              <button
                onClick={() => handleDismiss(dayData)}
                disabled={isDeleting && deletingService === dayData.service}
                className="text-green-700 hover:text-green-900 focus:outline-none disabled:opacity-50"
              >
                {isDeleting && deletingService === dayData.service ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}