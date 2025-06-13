import React from 'react';
import { Badge } from '../../ui/Badge';
import { formatDate } from '../../../../lib/date';
import { usePermissions } from '../../../../lib/usePermissions';


export function MouvementListItem({ mouvement, onViewDetails, onToggleChecked }) {
    const { can } = usePermissions();
    const canCheckMovement = can('checkMovement');
    
    // Déterminer la provenance à afficher avec section
    const provenanceDisplay = mouvement.chambreDepart 
        ? (mouvement.sectionDepart 
            ? `${mouvement.chambreDepart} (${mouvement.sectionDepart})` 
            : mouvement.chambreDepart) 
        : mouvement.lieuDepart || 'N/A';
    
    // Déterminer la destination à afficher avec section
    const destinationDisplay = mouvement.chambreArrivee 
        ? (mouvement.sectionArrivee 
            ? `${mouvement.chambreArrivee} (${mouvement.sectionArrivee})` 
            : mouvement.chambreArrivee) 
        : mouvement.lieuArrivee || 'N/A';
        
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        if (canCheckMovement) {
            onToggleChecked(mouvement.id, !mouvement.checked);
        }
    };
    
    // Afficher nom d'usage et nom de naissance
    const fullName = `${mouvement.nom} (né(e) ${mouvement.nom_naissance}) ${mouvement.prenom}`;
    
    return (
        <div 
            className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${mouvement.checked ? 'border-l-4 border-green-500' : ''}`}
            onClick={() => onViewDetails(mouvement)}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                    {canCheckMovement && (
                        <div 
                            className="flex items-center cursor-pointer mr-2" 
                            onClick={handleCheckboxClick}
                        >
                            <input
                                type="checkbox"
                                checked={mouvement.checked || false}
                                onChange={() => {}} // Requis pour React, mais le vrai gestionnaire est sur onClick
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                        </div>
                    )}
                    <Badge type={mouvement.type} />
                    <span className="font-medium">{fullName}</span>
                    
                    {mouvement.checked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Vérifié par {mouvement.checkedBy}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    {formatDate(mouvement.date, mouvement.time)}
                </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2">
                {mouvement.type !== 'Entrée' && (
                    <div><span className="font-medium">Provenance:</span> {provenanceDisplay}</div>
                )}
                {mouvement.type !== 'Sortie' && (
                    <div><span className="font-medium">Destination:</span> {destinationDisplay}</div>
                )}
            </div>
        </div>
    );
}