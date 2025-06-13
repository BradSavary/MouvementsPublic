import { useEffect, useState } from 'react';
import { getLocationsPaginated, addLocation, deleteLocation } from '../../../data/location-data';
import { getAllSystemServices } from '../../../data/admin-data';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';

export function AdminLocations() {
  const [locations, setLocations] = useState({ items: [], totalPages: 0, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'room',
    service: '',
    section: '',
  });

  const [availableServices, setAvailableServices] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    // Charger les services disponibles
    const fetchServices = async () => {
      try {
        const servicesResponse = await getAllSystemServices();
        if (servicesResponse.status === 'success') {
          setAvailableServices(servicesResponse.data || []);
        }
      } catch (error) {
        console.error("Erreur de chargement des services:", error);
      }
    };
    
    fetchServices();
  }, []);

  // Charger les emplacements avec filtres et pagination
  useEffect(() => {
    fetchLocations(currentPage, searchQuery, typeFilter);
  }, [currentPage, typeFilter]);

  // Fonction pour charger les emplacements
  const fetchLocations = async (page = 1, query = '', type = '') => {
    try {
      setLoading(true);
      const response = await getLocationsPaginated(page, 10, type, query);
      
      if (response.status === 'success') {
        setLocations(response.data || { items: [], totalPages: 0, currentPage: 1 });
      } else {
        setError(response.message || 'Erreur lors du chargement des emplacements');
      }
    } catch (error) {
      setError('Une erreur est survenue lors du chargement des emplacements');
      console.error(error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleAddLocation = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await addLocation(newLocation);
      
      if (response.status === 'success') {
        setSuccess('Emplacement ajouté avec succès');
        setNewLocation({ name: '', type: 'room', service: '' });
        setIsAddModalOpen(false);
        fetchLocations(currentPage, searchQuery, typeFilter);
      } else {
        setError(response.message || 'Erreur lors de l\'ajout de l\'emplacement');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de l\'ajout de l\'emplacement');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await deleteLocation(locationToDelete.id);
      
      if (response.status === 'success') {
        setSuccess('Emplacement supprimé avec succès');
        setIsDeleteModalOpen(false);
        fetchLocations(currentPage, searchQuery, typeFilter);
      } else {
        setError(response.message || 'Erreur lors de la suppression de l\'emplacement');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la suppression de l\'emplacement');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLocation(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mise à jour du gestionnaire de recherche pour ne pas déclencher automatiquement
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Nouvelle fonction pour soumettre la recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    fetchLocations(1, searchQuery, typeFilter);
  };
  
  // Effacer la recherche
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchLocations(1, '', typeFilter);
  };
  
  const handleTypeFilterChange = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
    setCurrentPage(1);
  };
  
  // Gérer la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && !isSearching) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h3 className="text-lg font-medium mb-2 md:mb-0">Gestion des emplacements</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un emplacement
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-md border border-green-300">
          {success}
        </div>
      )}
      
      {/* Section de recherche et filtrage */}
      <div className=" bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Filtre par type */}
          <div className="md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="room">Chambres</option>
              <option value="facility">Établissements</option>
            </select>
          </div>
          
          {/* Recherche */}
          <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un emplacement..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex items-center shadow-sm"
              >
                {isSearching ? <LoadingSpinner size="small" /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Affichage des filtres actifs */}
        {(searchQuery || typeFilter) && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Recherche: "{searchQuery}"
                <button onClick={handleClearSearch} className="ml-1 text-blue-500 hover:text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {typeFilter === 'room' ? 'Chambres' : 'Établissements'}
                <button onClick={() => setTypeFilter('')} className="ml-1 text-blue-500 hover:text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                fetchLocations(1, '', '');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 ml-auto flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner />
        </div>
      ) : locations.items.length > 0 ? (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.items.map((location) => (
              <tr key={location.id}>
                <td className="px-6 py-4 whitespace-nowrap">{location.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {location.type === 'room' ? 'Chambre' : 'Établissement'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{location.service || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{location.section || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setLocationToDelete(location);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
          
          {locations.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination 
                currentPage={currentPage} 
                totalPages={locations.totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun emplacement trouvé</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || typeFilter ? `Aucun résultat pour les critères de recherche actuels` : 'Aucun emplacement disponible dans le système'}
          </p>
          {(searchQuery || typeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                fetchLocations(1, '', '');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser la recherche
            </button>
          )}
        </div>
      )}
      
      {/* Modal pour confirmer la suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteLocation}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        }
      >
        <p className="text-gray-700">
          Êtes-vous sûr de vouloir supprimer l'emplacement <strong>{locationToDelete?.name}</strong> ?
        </p>
        <p className="text-red-600 mt-2">
          Cette action est irréversible.
        </p>
      </Modal>
      
      {/* Modal pour ajouter un emplacement */}
      <Modal
  isOpen={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  title="Ajouter un emplacement"
  footer={
    <div className="flex justify-end space-x-3">
      <button
        onClick={() => setIsAddModalOpen(false)}
        disabled={actionLoading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        Annuler
      </button>
      <button
        onClick={handleAddLocation}
        disabled={actionLoading || !newLocation.name || (newLocation.type === 'room' && !newLocation.service)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {actionLoading ? 'Ajout en cours...' : 'Ajouter'}
      </button>
    </div>
  }
>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
    <input
      type="text"
      name="name"
      value={newLocation.name}
      onChange={handleInputChange}
      required
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      placeholder="Nom de l'emplacement"
    />
  </div>
  
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
    <select
      name="type"
      value={newLocation.type}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="room">Chambre</option>
      <option value="facility">Établissement</option>
    </select>
  </div>
  
  {newLocation.type === 'room' && (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
      <select
        name="service"
        value={newLocation.service}
        onChange={handleInputChange}
        required
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Sélectionner un service</option>
        {availableServices.map(service => (
          <option key={service} value={service}>{service}</option>
        ))}
      </select>
    </div>
  )}
  
  {newLocation.type === 'room' && (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Section (optionnel)</label>
      <input
        type="text"
        name="section"
        value={newLocation.section}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="Nom de la section"
      />
    </div>
  )}
</Modal>
    </div>
  );
}