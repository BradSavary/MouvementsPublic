import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { usePermissions } from '../../../lib/usePermissions';
import { toggleItemChecked } from '../../../data/unified-history-data';
import { InfoField } from '../ui/InfoField';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../../lib/date';

export function UnifiedHistoryDetail({ item, onClose, onItemChecked }) {
  const [localItem, setLocalItem] = useState(item);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState('');
  const { userData } = useOutletContext();
  const { can } = usePermissions();

  if (!localItem) return null;

  // Déterminer le titre du modal en fonction du type
  const getModalTitle = () => {
    if (localItem.type === 'mouvement') {
      return `Détail du mouvement (${localItem.subType})`;
    } else {
      return 'Détail du décès';
    }
  };

  // Fonction pour mettre à jour le statut de vérification
  const handleToggleChecked = async () => {
    try {
      setIsToggling(true);
      setError('');
      
      const newCheckedStatus = !localItem.checked;
      const response = await toggleItemChecked(localItem.id, newCheckedStatus, localItem.type);
      
      if (response.status === 'success') {
        const updatedItem = {
          ...localItem,
          checked: newCheckedStatus,
          checkedBy: newCheckedStatus ? userData.username : null
        };
        
        setLocalItem(updatedItem);
        
        if (onItemChecked) {
          onItemChecked(updatedItem);
        }
      } else {
        setError(response.message || 'Échec de la modification du statut');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Une erreur est survenue lors de la modification du statut');
    } finally {
      setIsToggling(false);
    }
  };

  // Le bouton pour marquer comme vérifié/non vérifié
  const footerButtons = (
    <div className="flex justify-between w-full">
      <div className="flex space-x-2">
        {/* Permettre à tous les utilisateurs ayant la permission checkMovement */}
        {can('checkMovement') && (
          <button
            onClick={handleToggleChecked}
            disabled={isToggling}
            className={`px-4 py-2 rounded ${
              localItem.checked 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isToggling 
              ? 'Traitement...' 
              : localItem.checked 
                ? 'Marquer comme non vérifié' 
                : 'Marquer comme vérifié'
            }
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Fermer
      </button>
    </div>
  );

  // Déterminer les détails à afficher en fonction du type
  const renderDetails = () => {
    if (localItem.type === 'mouvement') {
      // Afficher les détails spécifiques aux mouvements
      const details = localItem.details;
      
      // Déterminer la provenance à afficher avec section
      const provenanceDisplay = details.chambreDepart 
        ? (details.sectionDepart 
            ? `${details.chambreDepart} (${details.sectionDepart})` 
            : details.chambreDepart) 
        : details.lieuDepart || 'N/A';
      
      // Déterminer la destination à afficher avec section
      const destinationDisplay = details.chambreArrivee 
        ? (details.sectionArrivee 
            ? `${details.chambreArrivee} (${details.sectionArrivee})` 
            : details.chambreArrivee) 
        : details.lieuArrivee || 'N/A';
      
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Informations du résident</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField label="Nom d'usage" value={localItem.nom} />
              <InfoField label="Nom de naissance" value={localItem.nom_naissance} />
              <InfoField label="Prénom" value={localItem.prenom} />
              <InfoField 
                label="Date de naissance" 
                value={localItem.naissance ? new Date(localItem.naissance).toLocaleDateString('fr-FR') : 'N/A'} 
              />
              <InfoField label="Sexe" value={localItem.sex} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Détails du mouvement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField label="Type" value={localItem.subType} />
              <InfoField label="Date" value={formatDate(localItem.date, localItem.time)} />
              <InfoField label="Provenance" value={provenanceDisplay} />
              <InfoField label="Destination" value={destinationDisplay} />
              <InfoField label="Ajouté par" value={details.author || 'N/A'} />
              <InfoField 
                label="Statut de vérification" 
                value={
                  localItem.checked 
                    ? <span className="inline-flex items-center text-green-700">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Vérifié par {localItem.checkedBy}
                      </span> 
                    : "Non vérifié"
                } 
              />
            </div>
          </div>
        </div>
      );
    } else {
      // Afficher les détails spécifiques aux décès
      const details = localItem.details;
      
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Informations du résident</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField label="Nom" value={localItem.nom} />
              <InfoField label="Nom de naissance" value={localItem.nom_naissance} />
              <InfoField label="Prénom" value={localItem.prenom} />
              <InfoField 
                label="Date de naissance" 
                value={localItem.naissance ? new Date(localItem.naissance).toLocaleDateString('fr-FR') : 'N/A'} 
              />
              <InfoField label="Sexe" value={localItem.sex} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Détails du décès</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField 
                label="Date du décès" 
                value={formatDate(details.date_deces, details.heure_deces)} 
              />
              <InfoField label="Chambre" value={localItem.location} />
              <InfoField label="Ajouté par" value={details.author || 'N/A'} />
              <InfoField 
                label="Statut de vérification" 
                value={
                  localItem.checked 
                    ? <span className="inline-flex items-center text-green-700">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Vérifié par {localItem.checkedBy}
                      </span> 
                    : "Non vérifié"
                } 
              />
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={getModalTitle()}
      footer={footerButtons}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {renderDetails()}
      </div>
    </Modal>
  );
}