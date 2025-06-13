import React from 'react';
import { Modal } from '../../ui/Modal';

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, isLoading, residentName }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la suppression"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Suppression en cours...' : 'Supprimer'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-lg font-medium">
          Voulez-vous vraiment supprimer cet enregistrement de décès ?
        </p>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p>Cette action est <strong>irréversible</strong>.</p>
          <p className="mt-2">
            Vous êtes sur le point de supprimer l'enregistrement de décès pour <strong>{residentName}</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
}