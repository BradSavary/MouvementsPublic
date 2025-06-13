import React from 'react';

export function ConfirmationModal({ formData, mouvementType, onConfirm, onCancel, isLoading }) {
    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Confirmer le mouvement</h3>
                <div className="space-y-3 mb-4">
                    <p><span className="font-medium">Type:</span> {mouvementType}</p>
                    <p>
                        <span className="font-medium">Résident:</span> {formData.nom} (né(e) {formData.nom_naissance}) {formData.prenom}
                    </p>
                    <p><span className="font-medium">Date:</span> {new Date(formData.date).toLocaleDateString('fr-FR')} à {formData.time}</p>
                    {mouvementType !== "Entrée" && (
                        <p><span className="font-medium">Provenance:</span> {formData.provenance}</p>
                    )}
                    {mouvementType !== "Sortie" && (
                        <p><span className="font-medium">Destination:</span> {formData.destination}</p>
                    )}
                    {(mouvementType === "Entrée" || mouvementType === "Transfert") && (
                        <p>
                            <span className="font-medium">Durée de séjour:</span> {' '}
                            {formData.dureeType === 'indéterminé' 
                                ? 'Indéterminée' 
                                : `Jusqu'au ${new Date(formData.dateFin).toLocaleDateString('fr-FR')}`}
                        </p>
                    )}
                </div>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onCancel}
                        disabled={isLoading}
                        className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isLoading ? 'Traitement...' : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
}