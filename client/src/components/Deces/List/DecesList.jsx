import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAllDeces, searchDeces, deleteDeces, toggleDecesChecked } from '../../../../data/deces-data';
import { usePermissions } from '../../../../lib/usePermissions';
import { DecesListItem } from './DecesListItem';
import { DecesSearchBar } from './DecesSearchBar';
import { Pagination } from '../../ui/Pagination';
import { DecesFilterModal } from './DecesFilterModal';
import { DecesDetail } from './DecesDetail';
import { formatDate } from '../../../../lib/date';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { PrintButton } from '../../Print/PrintButton';

export function DecesList() {
    const { userData } = useOutletContext();
    const [deces, setDeces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
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
        dateFrom: '',
        dateTo: '',
        checkStatus: '',
    });

    // État pour le modal de détails
    const [selectedDeces, setSelectedDeces] = useState(null);

    // Charger tous les décès au chargement initial et quand les filtres changent
    useEffect(() => {
        if (isFiltered || searchQuery !== '') {
            return;
        }
        else {
    const fetchDeces = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getAllDeces(
                sortOrder,
                currentPage,
                ITEMS_PER_PAGE,
                filters.dateFrom,
                filters.dateTo,
                filters.checkStatus // Ajout du paramètre checkStatus
            );
            
            if (response.status === 'success') {
                setDeces(response.data || []);
                setTotalPages(response.totalPages || 1);
            } else {
                setError(response.message || 'Une erreur est survenue lors du chargement des données');
                setDeces([]);
            }
        } catch (err) {
            setError('Une erreur est survenue lors du chargement des données');
            console.error(err);
            setDeces([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Si on n'est pas en train de faire une recherche, charger tous les décès
    if (!isSearching) {
        fetchDeces();
    }
}
}, [userData, sortOrder, currentPage, filters, isSearching]);

    // Recherche automatique après chaque caractère si 3+ caractères
   useEffect(() => {
    const performSearch = async () => {
        if (!searchQuery || searchQuery.length < 3) return;
        
        setIsSearching(true);
        setLoading(true);
        
        try {
            const response = await searchDeces(
                searchQuery,
                sortOrder,
                currentPage,
                ITEMS_PER_PAGE,
                filters.dateFrom,
                filters.dateTo,
                filters.checkStatus // Ajouter le paramètre checkStatus
            );
            
            if (response.status === 'success') {
                setDeces(response.data || []);
                setTotalPages(response.totalPages || 1);
                setError(null);
            } else {
                setError(response.message || 'Une erreur est survenue lors de la recherche');
                setDeces([]);
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la recherche');
            console.error(err);
            setDeces([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };
    
    if (searchQuery && searchQuery.length >= 3) {
        performSearch();
    }
}, [searchQuery, sortOrder, currentPage, filters.dateFrom, filters.dateTo, filters.checkStatus]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Revenir à la première page pour la recherche
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
    };

    // Gestionnaire pour changer l'ordre de tri
    const handleSortChange = () => {
        setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
        setCurrentPage(1); // Revenir à la première page quand on change l'ordre
    };

    // Gestionnaire pour changer de page
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Fonction pour gérer les changements de filtres
    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Revenir à la première page quand on applique des filtres
    };

    // Fonction pour réinitialiser tous les filtres
    const handleResetFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: ''
        });
        setCurrentPage(1);
    };

    // Fonction pour afficher les détails d'un décès
    const handleViewDetails = (deces) => {
        setSelectedDeces(deces);
    };

    // Fonction pour fermer le modal de détails
    const handleCloseDetails = () => {
        setSelectedDeces(null);
    };

    // Fonction pour afficher un résumé des filtres actifs
    const getActiveFiltersText = () => {
        const activeFilters = [];
        
        if (filters.dateFrom) {
            activeFilters.push(`À partir du: ${new Date(filters.dateFrom).toLocaleDateString('fr-FR')}`);
        }
        
        if (filters.dateTo) {
            activeFilters.push(`Jusqu'au: ${new Date(filters.dateTo).toLocaleDateString('fr-FR')}`);
        }
        
        if (filters.checkStatus) {
            if (filters.checkStatus === 'checked') {
                activeFilters.push('Statut: Validés');
            } else if (filters.checkStatus === 'unchecked') {
                activeFilters.push('Statut: Non validés');
            }
        }
        
        return activeFilters.length > 0 
            ? `Filtres actifs: ${activeFilters.join(' • ')}` 
            : '';
    };

    // Fonction pour gérer la suppression d'un décès
    const handleDecesDeleted = (deletedId) => {
        setDeces(prevDeces => prevDeces.filter(d => d.id !== deletedId));
    };

    const handleToggleChecked = async (id, checked) => {
        try {
            const response = await toggleDecesChecked(id, checked);
            
            if (response.status === 'success') {
                // Mettre à jour l'état local pour refléter le changement sans avoir à recharger la liste
                setDeces(prevDeces => 
                    prevDeces.map(deces => 
                        deces.id === id 
                            ? { 
                                ...deces, 
                                checked: checked, 
                                checkedBy: checked ? userData.username : null 
                            } 
                            : deces
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

    // Fonction pour gérer la mise à jour du statut depuis le modal de détails
    const handleDecesChecked = (updatedDeces) => {
        setDeces(prevDeces => 
            prevDeces.map(deces => 
                deces.id === updatedDeces.id ? updatedDeces : deces
            )
        );
    };

    return (
        
        <div className="space-y-4">
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
                        Vous visualisez uniquement les décès enregistrés par votre service: <strong>{userData.service}</strong>
                        </p>
                    </div>
                    </div>
                </div>
                )}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <h3 className="text-lg font-medium">Liste des décès</h3>
                
                <div className="flex space-x-2">
                    <button 
                        onClick={handleSortChange}
                        className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                        <span>Tri</span>
                        {sortOrder === 'desc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>Filtrer</span>
                    </button>

                    {/* Bouton pour imprimer */}
                    <PrintButton 
                    data={deces} 
                    title="Historique des décès" 
                    initialSettings={{
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo
                    }}
                    />
                </div>
            </div>
            
            <DecesSearchBar 
                searchQuery={searchQuery} 
                onSearch={handleSearch} 
                onClear={handleClearSearch}
                isSearching={isSearching && loading}
            />
            
            {(filters.dateFrom || filters.dateTo) && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 flex justify-between items-center">
                    <div>{getActiveFiltersText()}</div>
                    <button 
                        onClick={handleResetFilters}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Réinitialiser
                    </button>
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
                    {error}
                </div>
            )}
            
            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Chargement des données...</p>
                </div>
            ) : deces.length === 0 ? (
                <div className="bg-gray-50 p-8 text-center rounded-md">
                    <p className="text-gray-500">Aucun décès trouvé.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deces.map(item => (
                        <DecesListItem 
                            key={item.id} 
                            deces={item} 
                            onViewDetails={() => handleViewDetails(item)}
                            onToggleChecked={handleToggleChecked}
                        />
                    ))}
                </div>
            )}
            
            {totalPages > 1 && (
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange}
                />
            )}
            
            <DecesFilterModal 
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
            />
            
            {selectedDeces && (
                <DecesDetail 
                    deces={selectedDeces}
                    onClose={handleCloseDetails}
                    onDecesDeleted={handleDecesDeleted}
                    onDecesChecked={handleDecesChecked}
                />
            )}
        </div>
    );
}