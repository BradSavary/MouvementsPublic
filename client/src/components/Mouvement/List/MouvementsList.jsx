import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAllMouvements, searchMouvements, toggleMouvementChecked } from '../../../../data/mouvement-data';
import { MouvementSearchBar } from './MouvementSearchBar';
import { MouvementListItem } from './MouvementListItem';
import { Pagination } from '../../ui/Pagination';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { MouvementDetail } from '../Details/MouvementDetail';
import { MouvementFilterModal } from './MouvementFilterModal';
import { Badge } from '../../ui/Badge';
import { getAllSystemServices } from '../../../../data/admin-data';
import { PrintButton } from '../../Print/PrintButton';



export function MouvementsList() {
    const { userData } = useOutletContext();
    const [mouvements, setMouvements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(true);
    
    // États pour le tri et la pagination
    const [isFiltered, setIsFiltered] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;
    

    // État pour le modal de filtres
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // État pour les filtres
    const [filters, setFilters] = useState({
        type: '',
        dateFrom: '',
        dateTo: '',
        filterService: '',
        checkStatus: ''
    });
    
    const [availableServices, setAvailableServices] = useState([]);
    const [canFilterByService, setCanFilterByService] = useState(false);

    // État pour le modal de détails
    const [selectedMouvement, setSelectedMouvement] = useState(null);

  // Vérifier si l'utilisateur peut filtrer par service
  useEffect(() => {
    if (userData) {
      const privilegedServices = ['Admin', 'Accueil', 'Cadre de Santé'];
      const canFilter = privilegedServices.includes(userData.service);
      setCanFilterByService(canFilter);
    }
  }, [userData]);

   // Vérifier si l'utilisateur peut filtrer par service
useEffect(() => {
    if (userData) {
      const privilegedServices = ['Admin', 'Accueil', 'Cadre de Santé'];
      const canFilter = privilegedServices.includes(userData.service);
      setCanFilterByService(canFilter);
      
      if (canFilter) {
        // Charger la liste des services disponibles
        const fetchServices = async () => {
          try {
            const response = await getAllSystemServices();
            if (response.status === 'success' && Array.isArray(response.data)) {
              setAvailableServices(response.data);
              console.log('Services disponibles:', response.data);
            }
          } catch (error) {
            console.error("Erreur lors du chargement des services:", error);
          }
        };
        fetchServices();
      }
    }
  }, [userData]);

 // Charger tous les mouvements au chargement initial
 useEffect(() => {
    const fetchMouvements = async () => {
        // Ne pas recharger les données si une recherche est déjà en cours
        // et que le changement provient de searchQuery
        if (isSearching && searchQuery) return;
        
        try {
            setLoading(true);
            // Cacher temporairement les résultats pendant le chargement
            // mais avec un petit délai pour éviter un clignotement inutile pour les requêtes rapides
            const hideTimeout = setTimeout(() => setShowResults(false), 100);
            
            setError(null);
            
            let response;
            
            // Si une recherche est en cours
            if (searchQuery && searchQuery.length >= 3) {
                response = await searchMouvements(
                    searchQuery,
                    sortOrder,
                    currentPage,
                    ITEMS_PER_PAGE,
                    filters.type,
                    filters.dateFrom,
                    filters.dateTo,
                    filters.filterService,
                    filters.checkStatus // Ajout du paramètre de filtre
                );
            } else {
                // Sinon, charger tous les mouvements avec filtres
                response = await getAllMouvements(
                    sortOrder,
                    currentPage,
                    ITEMS_PER_PAGE,
                    filters.type,
                    filters.dateFrom,
                    filters.dateTo,
                    filters.filterService,
                    filters.checkStatus // Ajout du paramètre de filtre
                );
            }
            
            clearTimeout(hideTimeout); // Annuler le timeout si la réponse arrive rapidement
            
            if (response.status === 'success') {
                setMouvements(response.data.items || []);
                setTotalPages(response.data.totalPages || 1);
                
                // Si les services disponibles sont renvoyés par l'API et que l'utilisateur peut filtrer par service
                if (canFilterByService && response.data.availableServices) {
                    setAvailableServices(response.data.availableServices);
                }
            } else {
                setError(response.message || 'Une erreur est survenue lors du chargement des mouvements');
            }
        } catch (error) {
            setError('Une erreur est survenue lors du chargement des mouvements');
            console.error(error);
        } finally {
            setLoading(false);
            // Réafficher les résultats avec une transition douce
            setTimeout(() => setShowResults(true), 100);
        }
    };
    
    fetchMouvements();
}, [userData, sortOrder, currentPage, filters, canFilterByService]);

    // Recherche automatique après chaque caractère si 3+ caractères
   useEffect(() => {
        const doSearch = async () => {
            if (searchQuery.length === 0) {
                // Réafficher tous les mouvements quand la recherche est vide
                setIsSearching(false);
                setLoading(true);
                
                try {
                    const response = await getAllMouvements(
                        sortOrder, 
                        1, // Revenir à la première page
                        ITEMS_PER_PAGE, 
                        filters.type, 
                        filters.dateFrom, 
                        filters.dateTo,
                        filters.filterService,
                        filters.checkStatus 
                    );
                    
                    if (response.status === 'success') {
                        setMouvements(response.data.items || []);
                        setTotalPages(response.data.totalPages || 1);
                        setCurrentPage(1); // Réinitialiser à la première page
                        setAvailableServices(response.data.availableServices || []);
                        setError(null);
                    } else {
                        setError(response.message || 'Erreur lors du chargement des mouvements');
                        setMouvements([]);
                        setTotalPages(1);
                    }
                } catch (err) {
                    console.error("Erreur lors du rechargement des mouvements:", err);
                    setError('Erreur lors du chargement des mouvements');
                } finally {
                    setLoading(false);
                }
                return;
            }
            
            if (searchQuery.length >= 3) {
                setIsSearching(true);
                setLoading(true);
                
                try {
                    const response = await searchMouvements(
                        searchQuery, 
                        sortOrder, 
                        1, // Toujours revenir à la première page lors d'une recherche
                        ITEMS_PER_PAGE, 
                        filters.type, 
                        filters.dateFrom, 
                        filters.dateTo,
                        filters.filterService,
                        filters.checkStatus 
                    );
                    
                    if (response.status === 'success') {
                        setMouvements(response.data.items || []);
                        setTotalPages(response.data.totalPages || 1);
                        setCurrentPage(1); // Réinitialiser à la première page
                        setAvailableServices(response.availableServices || []);
                        setError(null);
                    } else {
                        setError(response.message || 'Erreur lors de la recherche');
                        setMouvements([]);
                        setTotalPages(1);
                    }
                } catch (err) {
                    console.error("Erreur lors de la recherche:", err);
                    setError('Erreur lors de la recherche');
                    setMouvements([]);
                    setTotalPages(1);
                } finally {
                    setLoading(false);
                }
            }
        };
    
        // TimeOut pour éviter les appels API trop fréquents
        const timeoutId = setTimeout(doSearch, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, sortOrder, filters, ITEMS_PER_PAGE]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        
        // Si la requête est trop courte, on annule la recherche
        if (query.length < 3) {
            if (isSearching) {
                setIsSearching(false);
                
                // Recharger les mouvements sans critère de recherche
                setCurrentPage(1);
            }
        } else {
            // Sinon on active le mode recherche
            if (!isSearching) {
                setIsSearching(true);
            }
        }
    };
    

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setCurrentPage(1);
    };

    // Gestionnaire pour changer l'ordre de tri
    const handleSortChange = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Gestionnaire pour changer de page
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

// Mise à jour de la fonction handleApplyFilters
const handleApplyFilters = (newFilters) => {
    console.log("Filtres appliqués:", newFilters);
    setFilters(newFilters);
    setIsFiltered(true);
    setCurrentPage(1); // Réinitialiser la pagination
    setIsFilterModalOpen(false); // Fermer explicitement la modal
  };
  
  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    setFilters({
      type: '',
      dateFrom: '',
      dateTo: '',
      filterService: '',
      checkStatus: '' 
    });
    setIsFiltered(false);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
};

    // Fonction pour afficher les détails d'un mouvement
    const handleViewDetails = (mouvement) => {
        setSelectedMouvement(mouvement);
    };

    // Fonction pour fermer le modal de détails
    const handleCloseDetails = () => {
        setSelectedMouvement(null);
    };

// Mise à jour de la fonction getActiveFiltersText
const getActiveFiltersText = () => {
    const activeFilters = [];
    
    if (filters.type) {
      activeFilters.push(`Type: ${filters.type}`);
    }
    
    if (filters.dateFrom) {
      activeFilters.push(`Du: ${new Date(filters.dateFrom).toLocaleDateString('fr-FR')}`);
    }
    
    if (filters.dateTo) {
      activeFilters.push(`Au: ${new Date(filters.dateTo).toLocaleDateString('fr-FR')}`);
    }
    
    if (filters.filterService) {
      activeFilters.push(`Service: ${filters.filterService}`);
    }
    
    // Ajouter le filtre de statut de vérification
    if (filters.checkStatus) {
      activeFilters.push(`Statut: ${filters.checkStatus === 'checked' ? 'Vérifiés' : 'Non vérifiés'}`);
    }
    
    return activeFilters.join(' • ');
};

    // Ajouter cette méthode dans le composant MouvementsList
const handleMouvementDeleted = (deletedId) => {
    // Supprimer le mouvement de la liste locale sans refaire d'appel API
    setMouvements(prevMouvements => 
      prevMouvements.filter(mouvement => mouvement.id !== deletedId)
    );
    setSelectedMouvement(null);
  };

  const handleMouvementChecked = (updatedMouvement) => {
    setMouvements(prevMouvements => 
      prevMouvements.map(mouvement => 
        mouvement.id === updatedMouvement.id ? updatedMouvement : mouvement
      )
    );
  };

  const handleToggleChecked = async (id, checked) => {
    try {
        const response = await toggleMouvementChecked(id, checked);
        
        if (response.status === 'success') {
            // Mettre à jour l'état local pour refléter le changement sans avoir à recharger la liste
            setMouvements(prevMouvements => 
                prevMouvements.map(mouvement => 
                    mouvement.id === id 
                        ? { 
                            ...mouvement, 
                            checked: checked, 
                            checkedBy: checked ? userData.username : null 
                          } 
                        : mouvement
                )
            );
        } else {
            setError(response.message || "Erreur lors de la mise à jour du statut");
            setTimeout(() => {
                setError(null);
            }, 3000);
        }
    } catch (err) {
        console.error("Erreur lors de la modification du statut:", err);
        setError("Une erreur est survenue lors de la modification du statut");
        setTimeout(() => {
            setError(null);
        }, 3000);
    }
};

    return (
        <div className="space-y-6">
            {isFiltered && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                        Vous visualisez uniquement les mouvements créés par votre service: <strong>{userData.service}</strong>
                        </p>
                    </div>
                    </div>
                </div>
                )}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <div className="flex items-center space-x-2 w-full">
                    {/* Bouton pour ouvrir le modal de filtres */}
                    <div className="flex items-center relative w-full">
                        <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtrer
                        </button>

                        <div className="absolute right-5">
                         {/* Bouton pour imprimer */}
                        <PrintButton 
                        data={mouvements} 
                        title="Historique des mouvements" 
                        initialSettings={{
                            dateFrom: filters.dateFrom,
                            dateTo: filters.dateTo
                        }}
                        />
                        </div>
                        
                        {isFiltered && (
                        <div className="flex items-center justify-center text-sm text-gray-500 ">
                            {getActiveFiltersText()}
                        </div>
                        )}
                        {(filters.type || filters.dateFrom || filters.dateTo) && (
                        <button
                            onClick={handleResetFilters}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    </div>     
                </div>
            </div>
            
            {/* Toujours afficher la barre de recherche */}
            <MouvementSearchBar 
                searchQuery={searchQuery} 
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isSearching={isSearching}
            />
            
            <div className="flex justify-between items-center mb-4">
                <div>
                    <span className="text-gray-600">
                        {mouvements.length > 0 
                            ? `Affichage de ${mouvements.length} mouvement(s)` 
                            : 'Aucun mouvement trouvé'}
                    </span>
                </div>
                <button 
                    onClick={handleSortChange}
                    className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                    {sortOrder === 'desc' ? 'Plus récent ↓' : 'Plus ancien ↑'}
                </button>
            </div>
            
            {/* Afficher un spinner de chargement pendant les recherches */}
            {loading && (
                <div className="flex justify-center items-center py-10">
                    <LoadingSpinner size="large" />
                </div>
            )}
            
            {/* Afficher les erreurs s'il y en a et qu'on n'est pas en chargement */}
            {error && !loading && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                    {error}
                </div>
            )}
            
           {/* Afficher les résultats ou un message "aucun résultat" */}
            {!loading && (
                <>
                    {mouvements.length > 0 ? (
                        <div className={`space-y-4 transition-opacity duration-300 ${showResults ? 'opacity-100' : 'opacity-0'}`}>
                            {mouvements.map((mouvement) => (
                                <MouvementListItem 
                                key={mouvement.id}
                                mouvement={mouvement}
                                onViewDetails={() => handleViewDetails(mouvement)}
                                onToggleChecked={handleToggleChecked}
                                />
                            ))}
                            
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    ) : (
                        <div className={`text-center py-10 bg-gray-50 rounded-lg transition-opacity duration-300 ${showResults ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-gray-500">Aucun mouvement ne correspond à votre recherche</p>
                        </div>
                    )}
                </>
            )}
            
            {/* Modal de détails du mouvement */}
            {selectedMouvement && (
                <MouvementDetail 
                    mouvement={selectedMouvement}
                    onClose={handleCloseDetails}
                    onMouvementDeleted={handleMouvementDeleted}
                    onMouvementChecked={handleMouvementChecked}
                />
            )}
            
            {/* Modal de filtres avec option pour filtrer par service */}
            <MouvementFilterModal
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                availableServices={availableServices}
                canFilterByService={canFilterByService}
            />
        </div>
    );
}