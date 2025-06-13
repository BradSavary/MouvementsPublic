import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { MouvementHeader } from './MouvementHeader';
import { ResidentInfo } from '../Form/ResidentInfo';
import { MouvementInfo } from '../Form/MouvementInfo';
import { usePermissions } from '../../../../lib/usePermissions';
import { deleteMouvement, toggleMouvementChecked } from '../../../../data/mouvement-data';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useOutletContext } from 'react-router-dom';

export function MouvementDetail({ mouvement: initialMouvement, onClose, onMouvementDeleted, onMouvementChecked }) {
  const [mouvement, setMouvement] = useState(initialMouvement);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState('');
  const { can } = usePermissions();
  const { userData } = useOutletContext();

  if (!mouvement) return null;

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      
      const response = await deleteMouvement(mouvement.id);
      
      if (response.status === 'success') {
        setIsDeleteModalOpen(false);
        onClose();
        if (onMouvementDeleted) {
          onMouvementDeleted(mouvement.id);
        }
      } else {
        setError(response.message || 'Échec de la suppression');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Nouvelle fonction pour gérer le cochage/décochage
  const handleToggleChecked = async () => {
    try {
      setIsToggling(true);
      setError('');
      
      const newCheckedStatus = !mouvement.checked;
      const response = await toggleMouvementChecked(mouvement.id, newCheckedStatus);
      
      if (response.status === 'success') {
        const updatedMouvement = { 
          ...mouvement, 
          checked: newCheckedStatus,
          checkedBy: newCheckedStatus ? userData.username : null
        };
        setMouvement(updatedMouvement);
        
        if (onMouvementChecked) {
          onMouvementChecked(updatedMouvement);
        }
      } else {
        setError(response.message || 'Échec de la modification du statut');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la modification du statut');
      console.error(err);
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
              mouvement.checked 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isToggling 
              ? 'Traitement...' 
              : mouvement.checked 
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
        title="Détails du mouvement"
        footer={footerButtons}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {error}
          </div>
        )}
        
        <MouvementHeader 
          type={mouvement.type} 
          date={mouvement.date} 
          time={mouvement.time} 
          checked={mouvement.checked}
          checkedBy={mouvement.checkedBy}
        />
        
        <ResidentInfo resident={mouvement} />
        
        <MouvementInfo mouvement={mouvement} />
      </Modal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        mouvementType={mouvement.type}
        residentName={`${mouvement.nom} ${mouvement.prenom}`}
      />
    </>
  );
}