import React from 'react';
import { usePrint } from './PrintProvider';
import { usePermissions } from '../../../lib/usePermissions';

export function PrintButton({ data, title, initialSettings = {} }) {
  const { preparePrint } = usePrint();
  const { can } = usePermissions();

  // Vérifier si l'utilisateur a la permission d'imprimer
  if (!can('printData')) {
    return null;
  }

  // Adapter automatiquement l'orientation et autres paramètres
  const prepareSettings = () => {
    // Si les données contiennent beaucoup de colonnes ou sont pour l'historique unifié, suggérer le mode paysage
    const isUnifiedHistory = data && data.length > 0 && (data[0].type === 'mouvement' || data[0].type === 'deces');
    const defaultOrientation = isUnifiedHistory ? 'landscape' : 'portrait';
    
    // Déterminer le nombre d'éléments à imprimer par défaut (limité à 10)
    const totalItems = Array.isArray(data) ? data.length : (data?.items?.length || 0);
    const itemsToPrint = Math.min(10, totalItems);
    
    return {
      ...initialSettings,
      orientation: initialSettings.orientation || defaultOrientation,
      itemsToPrint: initialSettings.itemsToPrint || itemsToPrint
    };
  };

  return (
    <button
      onClick={() => preparePrint(data, title, prepareSettings())}
      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
      title="Imprimer les données"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Imprimer
    </button>
  );
}