import React, { useRef } from 'react';
import { usePrint } from './PrintProvider';
import { formatDate } from '../../../lib/date';

export function PrintPreview() {
  const { 
    showPrintPreview, 
    printData, 
    printTitle, 
    printSettings, 
    executePrint,
    cancelPrint 
  } = usePrint();
  
  const printContainerRef = useRef(null);

  if (!showPrintPreview || !printData) return null;

    const renderLoginHistoryItems = (items) => {
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Utilisateur
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date et heure
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Adresse IP
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Détails
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((log, index) => (
            <tr key={log.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-xs text-gray-900">
                {log.username}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {formatDate(log.login_date)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {log.ip_address || 'N/A'}
              </td>
              <td className="px-4 py-3 text-xs">
                {log.success ? 'Réussie' : 'Échouée'}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {log.details || 'Aucun détail'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderPageHeader = () => {
    return (
      <div className="print-header mb-6">
        <h1 className="text-2xl font-bold mb-2">{printTitle}</h1>
        
        {printSettings.showDateRange && (printSettings.dateFrom || printSettings.dateTo) && (
          <div className="text-sm text-gray-600">
            Période: {printSettings.dateFrom ? formatDate(printSettings.dateFrom) : 'Non définie'} 
            {' '} à {' '}
            {printSettings.dateTo ? formatDate(printSettings.dateTo) : 'aujourd\'hui'}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          Date d'impression: {formatDate(new Date().toISOString().split('T')[0])}
        </div>
      </div>
    );
  };

  // Fonction pour rendre le contenu en fonction du type de données
  const renderContent = () => {
    // Vérifier si printData.items existe (pour les listes paginées)
    const items = printData.items || printData;
    
    if (!items || items.length === 0) {
      return <div className="text-center py-6">Aucune donnée à imprimer</div>;
    }

    if (items[0].username && items[0].login_date !== undefined) {
    return renderLoginHistoryItems(items);
    }

    if (items[0].type === 'mouvement' || items[0].type === 'deces') {
      // Pour l'historique unifié
      return renderUnifiedItems(items);
    } else if (items[0].hasOwnProperty('date_deces')) {
      // Pour les décès
      return renderDecesItems(items);
    } else {
      // Pour les mouvements
      return renderMouvementItems(items);
    }
  };

  const renderMouvementItems = (items) => {
    return (
      <table className="min-w-full divide-y divide-gray-300">
        <thead className={printSettings.includeHeaders ? "bg-gray-100" : "hidden"}>
          <tr>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-narrow">Type</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Nom & Prénom</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-narrow">Date</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Provenance</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Destination</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => {
            const provenanceDisplay = item.chambreDepart 
              ? (item.sectionDepart ? `${item.chambreDepart} (${item.sectionDepart})` : item.chambreDepart)
              : item.lieuDepart || 'N/A';
              
            const destinationDisplay = item.chambreArrivee 
              ? (item.sectionArrivee ? `${item.chambreArrivee} (${item.sectionArrivee})` : item.chambreArrivee)
              : item.lieuArrivee || 'N/A';
              
            return (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-1 px-2 text-sm">{item.type}</td>
                <td className="py-1 px-2 text-sm font-medium">{item.nom} {item.prenom}</td>
                <td className="py-1 px-2 text-sm">{formatDate(item.date, item.time)}</td>
                <td className="py-1 px-2 text-sm">{provenanceDisplay}</td>
                <td className="py-1 px-2 text-sm">{destinationDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderDecesItems = (items) => {
    return (
      <table className="min-w-full divide-y divide-gray-300">
        <thead className={printSettings.includeHeaders ? "bg-gray-100" : "hidden"}>
          <tr>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-wide">Nom & Prénom</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Date de naissance</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Date du décès</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Chambre</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => {
            const chambreDisplay = item.section 
              ? `${item.chambre} (${item.section})` 
              : item.chambre;
              
            return (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-1 px-2 text-sm font-medium">{item.nom} {item.prenom}</td>
                <td className="py-1 px-2 text-sm">{formatDate(item.naissance)}</td>
                <td className="py-1 px-2 text-sm">{formatDate(item.date_deces, item.heure_deces)}</td>
                <td className="py-1 px-2 text-sm">{chambreDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderUnifiedItems = (items) => {
    return (
      <table className="min-w-full divide-y divide-gray-300">
        <thead className={printSettings.includeHeaders ? "bg-gray-100" : "hidden"}>
          <tr>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-narrow">Type</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Nom & Prénom</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-medium">Date</th>
            <th className="py-2 px-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider col-wide">Emplacement</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => {
            let locationDisplay = '';
            
            if (item.type === 'deces') {
              locationDisplay = item.location || '';
            } else {
              const provenanceDisplay = item.details.chambreDepart 
                ? (item.details.sectionDepart ? `${item.details.chambreDepart} (${item.details.sectionDepart})` : item.details.chambreDepart)
                : item.details.lieuDepart || '';
                
              const destinationDisplay = item.details.chambreArrivee 
                ? (item.details.sectionArrivee ? `${item.details.chambreArrivee} (${item.details.sectionArrivee})` : item.details.chambreArrivee)
                : item.details.lieuArrivee || '';
              
              locationDisplay = `${provenanceDisplay} → ${destinationDisplay}`;
            }
              
            return (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="py-1 px-2 text-sm">{item.subType}</td>
                <td className="py-1 px-2 text-sm font-medium">{item.nom} {item.prenom}</td>
                <td className="py-1 px-2 text-sm">{formatDate(item.date, item.time)}</td>
                <td className="py-1 px-2 text-sm">{locationDisplay}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex flex-col">
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Prévisualisation de l'impression</h2>
        <div className="space-x-2">
          <button
            onClick={executePrint}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Imprimer
          </button>
          <button
            onClick={cancelPrint}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Fermer
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div 
          ref={printContainerRef}
          className={`print-container bg-white mx-auto shadow-lg p-6 mb-8 ${
            printSettings.orientation === 'landscape' ? 'landscape-container max-w-5xl' : 'max-w-3xl'
          }`}
          style={{
            minHeight: '842px', // A4 height in pixels
            width: printSettings.orientation === 'landscape' ? '1170px' : '827px',
          }}
        >
          {printSettings.includeHeaders && renderPageHeader()}
          <div className="overflow-x-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );

}