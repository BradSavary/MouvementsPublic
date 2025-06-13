import React from 'react';

export function FormDurationSelection({ formData, onChange }) {
    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Durée du séjour</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de durée</label>
                    <select
                        name="dureeType"
                        value={formData.dureeType}
                        onChange={onChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="indéterminé">Indéterminée</option>
                        <option value="date">Date de fin</option>
                    </select>
                </div>
                
                {formData.dureeType === 'date' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
                        <input
                            type="date"
                            name="dateFin"
                            value={formData.dateFin || ''}
                            onChange={onChange}
                            min={formData.date} // La date de fin ne peut pas être antérieure à la date du mouvement
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}