import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { InfoField } from '../../ui/InfoField';
import { formatDate } from '../../../../lib/date';
import { usePermissions } from '../../../../lib/usePermissions';
import { deleteDeces, toggleDecesChecked } from '../../../../data/deces-data';
import { useOutletContext } from 'react-router-dom';
import {DeleteConfirmationModal} from './DeleteConfirmationModal';

export function DecesDetail({ deces: initialDeces, onClose, onDecesDeleted, onDecesChecked }) {
  const [deces, setDeces] = useState(initialDeces);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState('');
  const { can } = usePermissions();
  const { userData } = useOutletContext();

  if (!deces) return null;

  const chambreDisplay = deces.section 
    ? `${deces.chambre} (${deces.section})` 
    : deces.chambre;

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteDeces(deces.id);
      
      if (response.status === 'success') {
        if (onDecesDeleted) {
          onDecesDeleted(deces.id);
        }
        onClose();
      } else {
        setError('Erreur lors de la suppression: ' + response.message);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du décès:', err);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Fonction pour gérer le cochage/décochage
  const handleToggleChecked = async () => {
    try {
      setIsToggling(true);
      setError('');
      
      const newCheckedStatus = !deces.checked;
      const response = await toggleDecesChecked(deces.id, newCheckedStatus);
      
      if (response.status === 'success') {
        const updatedDeces = {
          ...deces,
          checked: newCheckedStatus,
          checkedBy: newCheckedStatus ? userData.username : null
        };
        
        setDeces(updatedDeces);
        
        if (onDecesChecked) {
          onDecesChecked(updatedDeces);
        }
      } else {
        setError('Erreur lors de la modification du statut: ' + response.message);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Une erreur est survenue lors de la modification du statut');
    } finally {
      setIsToggling(false);
    }
  };

  const footerButtons = (
    <div className="flex justify-between w-full">
      <div className="flex space-x-2">
        {can('deleteMovement') && (
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Supprimer
          </button>
        )}
        {can('checkMovement') && (
          <button
            onClick={handleToggleChecked}
            disabled={isToggling}
            className={`px-4 py-2 rounded ${
              deces.checked 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isToggling 
              ? 'Traitement...' 
              : deces.checked 
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

  return (
    <>
      <Modal 
        isOpen={true} 
        onClose={onClose} 
        title="Détails du décès"
        footer={footerButtons}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Informations du résident</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField label="Nom d'usage" value={deces.nom} />
              <InfoField label="Nom de naissance" value={deces.nom_naissance} />
              <InfoField label="Prénom" value={deces.prenom} />
              <InfoField 
                label="Date de naissance" 
                value={new Date(deces.naissance).toLocaleDateString('fr-FR')} 
              />
              <InfoField label="Sexe" value={deces.sex} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Détails du décès</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
              <InfoField 
                label="Date et heure" 
                value={`${new Date(deces.date_deces).toLocaleDateString('fr-FR')} à ${deces.heure_deces}`} 
              />
              <InfoField label="Chambre" value={chambreDisplay} />
              <InfoField label="Ajouté par" value={deces.author} />
              <InfoField 
                label="Statut de vérification" 
                value={deces.checked 
                  ? <span className="inline-flex items-center text-green-700">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Vérifié par {deces.checkedBy}
                    </span> 
                  : "Non vérifié"
                } 
              />
            </div>
          </div>
        </div>
      </Modal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        residentName={`${deces.nom} (né(e) ${deces.nom_naissance}) ${deces.prenom}`}
      />
    </>
  );
}