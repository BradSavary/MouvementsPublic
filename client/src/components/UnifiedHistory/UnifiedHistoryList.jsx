import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { getUnifiedHistory, searchUnifiedHistory, toggleItemChecked } from '../../../data/unified-history-data';
import { UnifiedHistoryListItem } from './UnifiedHistoryListItem';
import { UnifiedHistoryFilterModal } from './UnifiedHistoryFilterModal';
import { UnifiedHistorySearchBar } from './UnifiedHistorySearchBar';
import { UnifiedHistoryDetail } from './UnifiedHistoryDetail';
import { PrintButton } from '../Print/PrintButton';

export function UnifiedHistoryList() {
    const { userData } = useOutletContext();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // États pour le tri et la pagination
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // État pour le modal de filtres
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // État pour les filtres
    const [filters, setFilters] = useState({
        type: '',
        dateFrom: '',
        dateTo: '',
        checkStatus: 'unchecked'    
    });

    // État pour le modal de détails
    const [selectedItem, setSelectedItem] = useState(null);
    
    // État pour suivre si une recherche est active
    const [isSearchActive, setIsSearchActive] = useState(false);
    
    // État pour suivre le dernier terme de recherche effectif (3+ caractères)
    const [effectiveSearchQuery, setEffectiveSearchQuery] = useState('');
    
    // Référence pour conserver le focus de la barre de recherche
    const searchInputRef = useRef(null);

    // Fonction pour charger les données d'historique
    const loadHistoryData = useCallback(async (search = null) => {
        try {
            setLoading(true);
            setError(null);
            
            let response;
            
            if (search && search.length >= 3) {
                // Mode recherche
                setIsSearching(true);
                response = await searchUnifiedHistory(
                    search,
                    sortOrder,
                    1, // Toujours commencer par la première page lors d'une recherche
                    ITEMS_PER_PAGE,
                    filters.type,
                    filters.dateFrom,
                    filters.dateTo,
                    filters.checkStatus
                );
                setCurrentPage(1); // Réinitialiser à la première page pour les recherches
            } else {
                // Mode normal (sans recherche)
                setIsSearching(false);
                response = await getUnifiedHistory(
                    sortOrder,
                    currentPage,
                    ITEMS_PER_PAGE,
                    filters.type,
                    filters.dateFrom,
                    filters.dateTo,
                    filters.checkStatus
                );
            }
            
            if (response && response.status === 'success' && response.data) {
                setHistoryItems(response.data.items || []);
                setTotalPages(response.data.totalPages || 1);
                setTotalItems(response.data.totalItems || 0);
            } else {
                setError(response?.message || 'Erreur lors du chargement des données');
                setHistoryItems([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (err) {
            console.error('Erreur lors du chargement de l\'historique unifié:', err);
            setError('Impossible de charger les données. Veuillez réessayer plus tard.');
            setHistoryItems([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [sortOrder, currentPage, ITEMS_PER_PAGE, filters]);

    // Effet pour charger les données initiales ou lorsque les paramètres de pagination/filtres changent
    useEffect(() => {
        if (!userData) return;
        
        // Si nous ne sommes pas en mode recherche active ou si la recherche est vide
        if (!isSearchActive || effectiveSearchQuery.length === 0) {
            loadHistoryData();
        }
        // Si une recherche est active avec un terme valide
        else if (isSearchActive && effectiveSearchQuery.length >= 3) {
            loadHistoryData(effectiveSearchQuery);
        }
    }, [userData, sortOrder, currentPage, filters, loadHistoryData, isSearchActive, effectiveSearchQuery]);

    // Gestionnaire de recherche avec délai optimisé
    useEffect(() => {
        // Ne rien faire si la longueur est entre 1 et 2 caractères
        if (searchQuery.length > 0 && searchQuery.length < 3) {
            return;
        }
        
        // Si la recherche est vide, réinitialiser l'état de recherche
        if (searchQuery === '') {
            // Mais ne pas déclencher de rechargement complet ici
            setIsSearchActive(false);
            setEffectiveSearchQuery('');
            return;
        }

        // Pour 3 caractères ou plus, activer la recherche avec un délai
        const searchTimer = setTimeout(() => {
            setIsSearchActive(true);
            setEffectiveSearchQuery(searchQuery);
        }, 500);
        
        return () => clearTimeout(searchTimer);
    }, [searchQuery]);

    // Gestionnaires d'événements
    const handleSearch = (query) => {
        setSearchQuery(query);
        // Ne pas modifier isSearchActive ici, laissez l'effet s'en occuper
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchActive(false);
        setEffectiveSearchQuery('');
        // Maintenir le focus sur la barre de recherche après l'effacement
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleSortChange = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Réinitialiser à la première page lors de l'application des filtres
    };

    const handleResetFilters = () => {
        setFilters({
            type: '',
            dateFrom: '',
            dateTo: '',
            checkStatus: 'unchecked'
        });
        setCurrentPage(1);
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
    };

    const handleCloseDetails = () => {
        setSelectedItem(null);
    };

    const getActiveFiltersText = () => {
        const activeFilters = [];
        
        if (filters.type) {
            activeFilters.push(`Type: ${filters.type}`);
        }
        
        if (filters.dateFrom) {
            activeFilters.push(`Du: ${new Date(filters.dateFrom).toLocaleDateString()}`);
        }
        
        if (filters.dateTo) {
            activeFilters.push(`Au: ${new Date(filters.dateTo).toLocaleDateString()}`);
        }
        
        if (filters.checkStatus === 'checked') {
            activeFilters.push('Validés');
        } else if (filters.checkStatus === 'unchecked') {
            activeFilters.push('Non validés');
        }
        
        return activeFilters.join(' | ');
    };

    const handleItemDeleted = (deletedId) => {
        setHistoryItems(prev => prev.filter(item => item.id !== deletedId || 
            (item.id === deletedId && item.type !== selectedItem.type)));
        setSelectedItem(null);
    };

    const handleToggleChecked = async (id, checked, type) => {
        try {
            const response = await toggleItemChecked(id, checked, type);
            
            if (response.status === 'success') {
                setHistoryItems(prev => 
                    prev.map(item => 
                        (item.id === id && item.type === type) 
                            ? { 
                                ...item, 
                                checked: checked,
                                checkedBy: checked ? userData.username : null
                            }
                            : item
                    )
                );
            } else {
                console.error('Erreur lors de la mise à jour du statut:', response.message);
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut:', err);
        }
    };

    const handleItemChecked = (updatedItem) => {
        setHistoryItems(prev => 
            prev.map(item => 
                (item.id === updatedItem.id && item.type === updatedItem.type) 
                    ? updatedItem
                    : item
            )
        );
    };

    // Afficher un loader pendant le chargement initial
    if (loading && !isSearching && historyItems.length === 0) {
        return (
            <div className="py-10">
                <LoadingSpinner />
            </div>
        );
    }
    
    const hasActiveFilters = filters.type !== '' || filters.dateFrom !== '' || filters.dateTo !== '' || filters.checkStatus !== '';

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-medium">
                    {searchQuery && isSearchActive ? 'Résultats de la recherche' : 'Événements récents'}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className={`px-3 py-1.5 flex items-center rounded border ${
                            hasActiveFilters 
                                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtres
                        {hasActiveFilters && (
                            <span className="ml-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                ✓
                            </span>
                        )}
                    </button>
                    
                    <button
                        onClick={handleSortChange}
                        className="px-3 py-1.5 flex items-center rounded border bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 transition-transform ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        {sortOrder === 'desc' ? 'Plus récent d\'abord' : 'Plus ancien d\'abord'}
                    </button>

                    {/* Bouton pour imprimer */}
                    <PrintButton 
                    data={historyItems} 
                    title="Historique des mouvements" 
                    initialSettings={{
                        dateFrom: filters.dateFrom,
                        dateTo: filters.dateTo,
                        orientation: 'landscape'
                    }}
                    />
                </div>
            </div>
            
            {hasActiveFilters && (
                <div className="bg-blue-50 p-2 rounded border border-blue-100 text-blue-700 text-sm">
                    <span className="font-medium">Filtres actifs:</span> {getActiveFiltersText()}
                </div>
            )}
            
            <UnifiedHistorySearchBar 
                searchQuery={searchQuery}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isSearching={isSearching}
                searchInputRef={searchInputRef}
            />
            
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded border border-red-300">
                    {error}
                </div>
            )}
            
            {/* Afficher un indicateur lorsque moins de 3 caractères sont saisis */}
            {searchQuery && searchQuery.length < 3 && (
                <div className="p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-100 mb-4">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Veuillez saisir au moins 3 caractères pour lancer la recherche
                    </div>
                </div>
            )}
            
            {isSearching && (
                <div className="flex justify-center py-4">
                    <LoadingSpinner />
                </div>
            )}
            
            {!isSearching && historyItems.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded border border-gray-200">
                    <p className="text-gray-500">Aucun événement trouvé.</p>
                    
                    {searchQuery && isSearchActive && (
                        <p className="text-sm text-gray-400 mt-1">
                            Essayez de modifier votre recherche ou vos filtres.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {historyItems.map(item => (
                        <UnifiedHistoryListItem
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onViewDetails={() => handleViewDetails(item)}
                            onToggleChecked={(id, checked) => handleToggleChecked(id, checked, item.type)}
                        />
                    ))}
                </div>
            )}
            
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                    <p className="text-center text-sm text-gray-500 mt-2">
                        {totalItems} élément{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
                    </p>
                </div>
            )}
            
            <UnifiedHistoryFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
            />
            
            {selectedItem && (
                <UnifiedHistoryDetail
                    item={selectedItem}
                    onClose={handleCloseDetails}
                    onItemDeleted={handleItemDeleted}
                    onItemChecked={handleItemChecked}
                />
            )}
        </div>
    );
}