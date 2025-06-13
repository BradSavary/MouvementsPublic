import React from 'react';
import { InfoField } from '../../ui/InfoField';

export function MouvementInfo({ mouvement }) {
  // Déterminer la provenance à afficher avec section
  const provenanceDisplay = mouvement.chambreDepart 
    ? (mouvement.sectionDepart 
        ? `${mouvement.chambreDepart} (${mouvement.sectionDepart})` 
        : mouvement.chambreDepart) 
    : mouvement.lieuDepart;
  
  // Déterminer la destination à afficher avec section
  const destinationDisplay = mouvement.chambreArrivee 
    ? (mouvement.sectionArrivee 
        ? `${mouvement.chambreArrivee} (${mouvement.sectionArrivee})` 
        : mouvement.chambreArrivee) 
    : mouvement.lieuArrivee;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Détails du mouvement</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
        {provenanceDisplay && (
          <InfoField label="Provenance" value={provenanceDisplay} />
        )}
        
        {destinationDisplay && (
          <InfoField label="Destination" value={destinationDisplay} />
        )}
        
        <InfoField label="Durée du séjour" value={mouvement.sejour} />
        <InfoField label="Ajouté par" value={mouvement.author} />
        
        {/* Afficher le statut de vérification */}
        <InfoField 
          label="Statut de vérification" 
          value={mouvement.checked 
            ? <span className="inline-flex items-center text-green-700">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vérifié par {mouvement.checkedBy}
              </span> 
            : "Non vérifié"
          } 
        />
      </div>
    </div>
  );
}