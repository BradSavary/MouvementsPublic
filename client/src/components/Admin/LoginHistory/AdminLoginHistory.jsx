import React, { useState, useEffect } from 'react';
import { getLoginHistory } from '../../../../data/login-history-data';
import { LoginHistoryFilter } from './LoginHistoryFilter';
import { Pagination } from '../../ui/Pagination';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { formatDate } from '../../../../lib/date';
import { PrintButton } from '../../Print/PrintButton';

export function AdminLoginHistory() {
  const [loginHistory, setLoginHistory] = useState({ items: [], totalPages: 0, currentPage: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // États pour la pagination et le filtrage
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    username: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({...filters});
  const ITEMS_PER_PAGE = 20;

  // Charger les données initiales
  useEffect(() => {
    loadLoginHistory();
  }, [currentPage, appliedFilters]);

  // Fonction pour charger l'historique des connexions
  const loadLoginHistory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getLoginHistory(
        currentPage,
        ITEMS_PER_PAGE,
        appliedFilters.username,
        appliedFilters.dateFrom,
        appliedFilters.dateTo,
        appliedFilters.status
      );
      
      if (response.status === 'success') {
        setLoginHistory(response.data);
      } else {
        setError(response.message || "Une erreur s'est produite lors du chargement de l'historique");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires d'événements
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      username: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({...filters});
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Formatter l'adresse IP
  const formatIpAddress = (ip) => {
    return ip || 'N/A';
  };

  // Formatter le statut
  const formatStatus = (success) => {
    return success ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Réussie
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        Échouée
      </span>
    );
  };

  // Formatter l'agent utilisateur
  const formatUserAgent = (userAgent) => {
    if (!userAgent) return 'N/A';
    
    // Essayer d'extraire des informations utiles
    let browserInfo = 'Navigateur inconnu';
    let osInfo = 'OS inconnu';
    
    if (userAgent.includes('Firefox')) {
      browserInfo = 'Firefox';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserInfo = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browserInfo = 'Edge';
    } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
      browserInfo = 'Internet Explorer';
    }
    
    if (userAgent.includes('Windows')) {
      osInfo = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      osInfo = 'macOS';
    } else if (userAgent.includes('Linux')) {
      osInfo = 'Linux';
    } else if (userAgent.includes('Android')) {
      osInfo = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      osInfo = 'iOS';
    }
    
    return `${browserInfo} sur ${osInfo}`;
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  // Déterminer si des filtres sont actifs
const hasActiveFilters = appliedFilters.username || 
                         appliedFilters.dateFrom || 
                         appliedFilters.dateTo || 
                         (appliedFilters.status && appliedFilters.status !== 'all');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Historique des connexions</h3>
        <PrintButton 
          data={loginHistory.items} 
          title="Historique des connexions" 
          initialSettings={{ includeHeaders: true, showDateRange: true, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }}
        />
      </div>

      <LoginHistoryFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
      />
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      {hasActiveFilters && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 flex justify-between items-center">
          <div>
            <span className="font-medium text-blue-700">Filtres actifs: </span>
            {appliedFilters.username && <span className="mr-2">Utilisateur: <b>{appliedFilters.username}</b></span>}
            {appliedFilters.status && appliedFilters.status !== 'all' && (<span className="mr-2">Statut: <b>{appliedFilters.status === 'success' ? 'Réussies' : 'Échouées'}</b></span>)}
            {appliedFilters.dateFrom && <span className="mr-2">Du: <b>{appliedFilters.dateFrom}</b></span>}
            {appliedFilters.dateTo && <span>Au: <b>{appliedFilters.dateTo}</b></span>}
          </div>
          <button 
            onClick={handleResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Effacer les filtres
          </button>
        </div>
      )}
      
      {loginHistory.items.length === 0 ? (
        <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
          <p className="text-gray-500">Aucune donnée d'historique de connexion disponible</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date et heure
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse IP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navigateur
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loginHistory.items.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.login_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatIpAddress(log.ip_address)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {formatUserAgent(log.user_agent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatStatus(log.success)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details || 'Aucun détail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
            <div className="text-sm text-gray-500 mb-2 sm:mb-0">
              Affichage de {loginHistory.items.length} sur {loginHistory.totalItems} entrées
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={loginHistory.totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </>
      )}
    </div>
  );
}