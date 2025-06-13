import React from 'react';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../../lib/date';
import { usePermissions } from '../../../lib/usePermissions';

export function UnifiedHistoryListItem({ item, onViewDetails, onToggleChecked }) {
    const { can } = usePermissions();
    // Permettre à tous ceux ayant la permission checkMovement de cocher les items
    const canCheckItems = can('checkMovement');
    
    // Déterminer le type de badge à afficher
    const getBadgeType = () => {
        if (item.type === 'deces') return 'Décès';
        return item.subType; // 'Entrée', 'Sortie', 'Transfert' pour les mouvements
    };
    
    const handleCheckboxClick = (e) => {
        e.stopPropagation(); // Empêcher la propagation vers l'élément parent
        if (canCheckItems) {
            onToggleChecked(item.id, !item.checked, item.type);
        }
    };

    // Afficher les informations de localisation en fonction du type
    const renderLocationInfo = () => {
        if (item.type === 'deces') {
            // Pour un décès, on affiche simplement la chambre/section
            return (
                <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Emplacement:</span> {item.location}
                </div>
            );
        } else {
            // Pour un mouvement, on affiche provenance et destination
            const details = item.details;
            
            // Déterminer la provenance à afficher
            const provenanceDisplay = details.chambreDepart 
                ? (details.sectionDepart 
                    ? `${details.chambreDepart} (${details.sectionDepart})` 
                    : details.chambreDepart) 
                : details.lieuDepart || 'N/A';
            
            // Déterminer la destination à afficher
            const destinationDisplay = details.chambreArrivee 
                ? (details.sectionArrivee 
                    ? `${details.chambreArrivee} (${details.sectionArrivee})` 
                    : details.chambreArrivee) 
                : details.lieuArrivee || 'N/A';
            
            return (
                <div className="mt-2 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <span className="font-medium">Provenance:</span> {provenanceDisplay}
                    </div>
                    <div>
                        <span className="font-medium">Destination:</span> {destinationDisplay}
                    </div>
                </div>
            );
        }
    };

    const fullName = `${item.nom} (né(e) ${item.nom_naissance}) ${item.prenom}`;
    
    return (
        <div 
            className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${item.checked ? 'border-l-4 border-green-500' : ''}`}
            onClick={onViewDetails}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                    {canCheckItems && (
                        <div 
                            className="flex items-center cursor-pointer mr-2" 
                            onClick={handleCheckboxClick}
                        >
                            <input
                                type="checkbox"
                                checked={item.checked || false}
                                onChange={() => {}} // Requis pour React, mais le vrai gestionnaire est sur onClick
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                        </div>
                    )}
                    <Badge type={getBadgeType()} text={item.subType} />
                    <span className="font-medium">{fullName}</span>
                    
                    {item.checked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Vérifié par {item.checkedBy}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    {formatDate(item.date, item.time)}
                </div>
            </div>
            
            {renderLocationInfo()}
        </div>
    );
}