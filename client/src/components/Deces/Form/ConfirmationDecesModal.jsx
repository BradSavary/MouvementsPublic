import React from 'react';

export function ConfirmationDecesModal({ formData, onConfirm, onCancel, isLoading }) {
    // Déterminer l'affichage de la chambre avec la section si disponible
    const chambreDisplay = formData.section 
        ? `${formData.chambre} (${formData.section})` 
        : formData.chambre;
    
    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Confirmer l'enregistrement du décès</h3>
                <div className="space-y-3 mb-4">
                    <p className="font-medium">Veuillez vérifier les informations suivantes :</p>
                    <p>
                        <span className="font-medium">Résident:</span> {formData.nom} (né(e) {formData.nom_naissance}) {formData.prenom}
                    </p>
                    <p><span className="font-medium">Date et heure du décès:</span> {new Date(formData.date_deces).toLocaleDateString('fr-FR')} à {formData.heure_deces}</p>
                    <p><span className="font-medium">Chambre:</span> {chambreDisplay}</p>
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