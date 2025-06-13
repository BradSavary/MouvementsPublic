import React from 'react';
import { Modal } from '../ui/Modal';
import { usePrint } from './PrintProvider';

export function PrintSettingsModal() {
  const { 
    showSettings, 
    printTitle, 
    printSettings, 
    setPrintSettings, 
    startPrintPreview, 
    cancelPrint,
    originalData
  } = usePrint();

  if (!showSettings) return null;

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrintSettings({
      ...printSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Calculer le nombre total d'éléments disponibles
  const totalItems = originalData 
    ? (Array.isArray(originalData) 
        ? originalData.length 
        : (originalData.items ? originalData.items.length : 0))
    : 0;

  // Options pour le sélecteur d'éléments
  const itemOptions = [10, 25, 50, 100, totalItems];
  
  // Si le total est inférieur à certaines options, les supprimer
  const filteredOptions = itemOptions.filter(option => option <= totalItems);
  
  // S'assurer que totalItems est toujours inclus
  if (!filteredOptions.includes(totalItems) && totalItems > 0) {
    filteredOptions.push(totalItems);
  }
  
  // Trier les options numériquement
  filteredOptions.sort((a, b) => a - b);

  return (
    <Modal
      isOpen={showSettings}
      onClose={cancelPrint}
      title="Paramètres d'impression"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={cancelPrint}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={startPrintPreview}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Prévisualiser
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <h3 className="font-medium text-lg">{printTitle}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille du papier</label>
            <select
              name="pageSize"
              value={printSettings.pageSize}
              onChange={handleSettingChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="A4">A4</option>
              <option value="letter">Lettre</option>
              <option value="legal">Légal</option>
            </select>
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
            <select
              name="orientation"
              value={printSettings.orientation}
              onChange={handleSettingChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Paysage</option>
            </select>
          </div>
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'éléments à imprimer</label>
          <select
            name="itemsToPrint"
            value={printSettings.itemsToPrint}
            onChange={handleSettingChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {filteredOptions.map(num => (
              <option key={num} value={num}>
                {num === totalItems ? `Tous (${num})` : num}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {totalItems > 0 ? `${totalItems} éléments disponibles au total` : 'Aucun élément disponible'}
          </p>
        </div> */}

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeHeaders"
              name="includeHeaders"
              checked={printSettings.includeHeaders}
              onChange={handleSettingChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeHeaders" className="ml-2 block text-sm text-gray-700">
              Inclure les en-têtes
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}