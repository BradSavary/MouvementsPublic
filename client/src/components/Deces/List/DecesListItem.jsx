import React from 'react';
import { formatDate } from '../../../../lib/date';
import { usePermissions } from '../../../../lib/usePermissions';

export function DecesListItem({ deces, onViewDetails, onToggleChecked }) {
    const { can } = usePermissions();
    const canCheckDeath = can('checkMovement');

    // Afficher la chambre avec la section si disponible
    const chambreDisplay = deces.section 
        ? `${deces.chambre} (${deces.section})` 
        : deces.chambre;
    
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        if (canCheckDeath) {
            onToggleChecked(deces.id, !deces.checked);
        }
    };
    
    // Afficher nom d'usage et nom de naissance
    const fullName = `${deces.nom} (né(e) ${deces.nom_naissance}) ${deces.prenom}`;
    
    return (
        <div 
            className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${deces.checked ? 'border-l-4 border-green-500' : ''}`}
            onClick={onViewDetails}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                    {canCheckDeath && (
                        <div 
                            className="flex items-center cursor-pointer mr-2" 
                            onClick={handleCheckboxClick}
                        >
                            <input
                                type="checkbox"
                                checked={deces.checked || false}
                                onChange={() => {}} // Requis pour React, mais le vrai gestionnaire est sur onClick
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                        </div>
                    )}
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Décès
                    </span>
                    <span className="font-medium">{fullName}</span>
                    
                    {deces.checked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Vérifié par {deces.checkedBy}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    {formatDate(deces.date_deces, deces.heure_deces)}
                </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Chambre:</span> {chambreDisplay}
            </div>
        </div>
    );
}