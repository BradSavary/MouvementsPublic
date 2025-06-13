import React, { useState } from 'react';
import { deleteArchives } from '../../../data/mouvement-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AdminArchives() {
  const [selectedMonths, setSelectedMonths] = useState(12); // Par défaut: 12 mois
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState(''); // Nouvel état pour gérer le texte de confirmation

  const monthsOptions = [
    { value: 6, label: '6 mois' },
    { value: 12, label: '1 an' },
    { value: 24, label: '2 ans' },
    { value: 36, label: '3 ans' },
    { value: 60, label: '5 ans' },
  ];

  const handleMonthsChange = (e) => {
    setSelectedMonths(Number(e.target.value));
  };

  const handleOpenConfirmation = () => {
    setIsConfirmModalOpen(true);
    setConfirmText(''); // Réinitialiser le texte de confirmation
  };

  const handleCloseConfirmation = () => {
    setIsConfirmModalOpen(false);
    setConfirmText(''); // Réinitialiser le texte de confirmation
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      
      const response = await deleteArchives(selectedMonths);
      
      if (response.status === 'success') {
        setResult({
          count: response.count,
          months: selectedMonths
        });
      } else {
        setError(response.message || 'Une erreur est survenue lors de la suppression');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la communication avec le serveur');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  // Gérer le changement de texte dans le champ de confirmation
  const handleConfirmTextChange = (e) => {
    setConfirmText(e.target.value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Gestion des archives</h3>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      {result ? (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded border border-green-300">
          <p>
            <strong>{result.count}</strong> mouvements datant de plus de <strong>{result.months}</strong> mois ont été supprimés avec succès.
          </p>
          <button
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            OK
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-6">
            <p className="mb-2">
              Cette fonctionnalité vous permet de supprimer définitivement les mouvements anciens de la base de données.
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p className="font-medium">⚠️ Attention :</p>
              <p>Cette opération est irréversible. Les données supprimées ne pourront pas être récupérées.</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supprimer les mouvements datant de plus de :
            </label>
            <select
              value={selectedMonths}
              onChange={handleMonthsChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {monthsOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleOpenConfirmation}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Supprimer les archives
            </button>
          </div>
        </div>
      )}
      
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirmation de suppression</h3>
            <div className="space-y-3 mb-4">
              <p className="font-medium text-red-600">Cette action est irréversible !</p>
              <p>
                Vous êtes sur le point de supprimer tous les mouvements datant de plus de <strong>{selectedMonths} mois</strong>.
              </p>
              <p>
                Pour confirmer, veuillez taper "SUPPRIMER" ci-dessous :
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={handleConfirmTextChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="SUPPRIMER"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseConfirmation}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || confirmText !== "SUPPRIMER"}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <span className="mr-2">Suppression...</span>
                    <LoadingSpinner size="small" />
                  </>
                ) : (
                  'Confirmer la suppression'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}