import React, { useState, useEffect } from 'react';
import { getAllUsers, addUser, deleteUser, updateUserService } from '../../../data/user-data';
import { getAllSystemServices } from '../../../data/admin-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { DeleteConfirmationModal } from '../Mouvement/Details/DeleteConfirmationModal';
import { UserPermissions } from './UserPermissions';

export function AdminUsers() {
  const [users, setUsers] = useState({ items: [], totalPages: 0, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    service: '',
    newServiceName: ''
  });
  
  const [availableServices, setAvailableServices] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // États pour le tri, la recherche et la pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;


    //États pour la modal de modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editUserService, setEditUserService] = useState('');
  const [isEditing, setIsEditing] = useState(false);


  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  

  // Chargement initial des données
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Charger les services disponibles
        const servicesResponse = await getAllSystemServices();
        if (servicesResponse.status === 'success' && Array.isArray(servicesResponse.data)) {
          setAvailableServices(servicesResponse.data);
        } else {
          console.error("Erreur lors du chargement des services:", servicesResponse.message);
        }

        // Charger les utilisateurs
        await fetchUsers();
      } catch (err) {
        console.error("Erreur lors du chargement initial:", err);
        setError("Erreur lors du chargement des données: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Effet pour recharger les utilisateurs lors du changement de page ou de filtre
  useEffect(() => {
    if (!loading) {
      fetchUsers();
    }
  }, [currentPage, serviceFilter]);

  // Fonction pour charger les utilisateurs avec filtres et pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAllUsers(currentPage, ITEMS_PER_PAGE, serviceFilter, searchQuery);
      console.log("Réponse API users:", response);

      if (response.status === 'success') {
        setUsers({
          items: response.data || [],
          totalPages: response.totalPages || 1,
          currentPage: response.currentPage || currentPage
        });
      } else {
        setError(response.message || "Erreur lors du chargement des utilisateurs");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Erreur lors du chargement des utilisateurs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      if (!newUser.username || !newUser.password || !newUser.service) {
        setError("Tous les champs sont obligatoires");
        setActionLoading(false);
        return;
      }

      // Vérifier si un nouveau service doit être créé
      if (newUser.service === 'Nouveau' && !newUser.newServiceName) {
        setError("Veuillez spécifier le nom du nouveau service");
        setActionLoading(false);
        return;
      }

      const response = await addUser(newUser);
      
      if (response.status === 'success') {
        setSuccess("Utilisateur ajouté avec succès");
        setNewUser({
          username: '',
          password: '',
          service: '',
          newServiceName: ''
        });
        fetchUsers();
        
        // Si un nouveau service a été ajouté, le récupérer
        if (newUser.service === 'Nouveau') {
          const servicesResponse = await getAllSystemServices();
          if (servicesResponse.status === 'success') {
            setAvailableServices(servicesResponse.data);
          }
        }
        
        setIsAddModalOpen(false);
      } else {
        setError(response.message || "Échec de l'ajout de l'utilisateur");
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", err);
      setError("Erreur lors de l'ajout de l'utilisateur: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      if (!userToDelete) {
        setError("Aucun utilisateur sélectionné pour la suppression");
        setActionLoading(false);
        return;
      }

      const response = await deleteUser(userToDelete.id);
      
      if (response.status === 'success') {
        setSuccess("Utilisateur supprimé avec succès");
        fetchUsers();
        setIsDeleteModalOpen(false);
      } else {
        setError(response.message || "Échec de la suppression de l'utilisateur");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      setError("Erreur lors de la suppression de l'utilisateur: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestionnaire de recherche
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Soumettre la recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1); // Retour à la première page pour les résultats de recherche
    fetchUsers();
    setIsSearching(false);
  };

  // Effacer la recherche
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(true);
    setCurrentPage(1);
    fetchUsers();
    setIsSearching(false);
  };

  // Gérer le filtre par service
  const handleServiceFilterChange = (e) => {
    setServiceFilter(e.target.value);
    setCurrentPage(1); // Retour à la première page lors du changement de filtre
  };

  // Gérer la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Ouvrir la modal de modification
  const handleEditUser = (user) => {
    setUserToEdit(user);
    setEditUserService(user.service);
    setIsEditModalOpen(true);
  };

  // Fermer la modal de modification
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setUserToEdit(null);
    setEditUserService('');
  };

  // Soumettre les modifications
  const handleSaveEdit = async () => {
    if (!userToEdit || !editUserService) return;
    
    try {
      setIsEditing(true);
      setError('');
      
      const response = await updateUserService(userToEdit.id, editUserService);
      
      if (response.status === 'success') {
        // Mettre à jour la liste des utilisateurs avec le service modifié
        setUsers(prevState => ({
          ...prevState,
          items: prevState.items.map(user => 
            user.id === userToEdit.id 
              ? { ...user, service: editUserService } 
              : user
          )
        }));
        
        setSuccess(`Le service de l'utilisateur ${userToEdit.username} a été mis à jour avec succès.`);
        setIsEditModalOpen(false);
      } else {
        setError(response.message || "Échec de la mise à jour du service");
      }
    } catch (err) {
      setError(`Une erreur est survenue: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  };


  const handleManagePermissions = (user) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsModalOpen(true);
  };


  if (loading && !isSearching) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  // Déterminer si des filtres sont actifs pour afficher un indicateur
  const hasActiveFilters = serviceFilter !== '' || searchQuery !== '';

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Gestion des utilisateurs</h3>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md shadow-sm border border-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-md shadow-sm border border-green-200">
          {success}
        </div>
      )}
      
      {/* Barre de recherche et filtres - SECTION MODIFIÉE pour correspondre à AdminLocations */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <h4 className="text-base font-medium text-gray-700">Recherche et filtres</h4>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter un utilisateur
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={serviceFilter}
              onChange={handleServiceFilterChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
            >
              <option value="">Tous les services</option>
              {availableServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <form onSubmit={handleSearchSubmit} className="flex w-full">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isSearching ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <button 
                        type="button"
                        onClick={handleClearSearch} 
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium mr-2">Filtres actifs:</span>
            {serviceFilter && <span className="mr-2">Service: {serviceFilter}</span>}
            {searchQuery && <span>Recherche: "{searchQuery}"</span>}
            <button 
              onClick={() => {
                setServiceFilter('');
                setSearchQuery('');
                setCurrentPage(1);
                fetchUsers();
              }}
              className="ml-auto text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">Réinitialiser</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {users.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">Aucun utilisateur trouvé.</p>
            <p className="mt-1">Modifiez vos critères de recherche ou ajoutez un nouvel utilisateur.</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom d'utilisateur
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Options
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.items.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-md px-3 py-1 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleManagePermissions(user)}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md px-3 py-1 transition-colors"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-red-100 text-red-600 hover:bg-red-200 rounded-md px-3 py-1 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
            
            {/* Pagination */}
            {users.totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={users.currentPage}
                  totalPages={users.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal pour ajouter un utilisateur */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un utilisateur"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsAddModalOpen(false)}
              disabled={actionLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddUser}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {actionLoading ? (
                <>
                  <LoadingSpinner size="small" /> 
                  <span className="ml-2">Traitement...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
            <input
              id="username"
              name="username"
              type="text"
              value={newUser.username}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              id="service"
              name="service"
              value={newUser.service}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionner un service</option>
              {availableServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
              <option value="Nouveau">+ Créer un nouveau service</option>
            </select>
          </div>
          
          {newUser.service === 'Nouveau' && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <label htmlFor="newServiceName" className="block text-sm font-medium text-gray-700 mb-1">Nom du nouveau service</label>
              <input
                id="newServiceName"
                name="newServiceName"
                type="text"
                value={newUser.newServiceName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal pour confirmer la suppression */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        isLoading={actionLoading}
        mouvementType="Utilisateur"
        residentName={userToDelete?.username || ""}
      />
        {/* Nouvelle modal de modification du service */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Modifier le service utilisateur"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseEditModal}
              disabled={isEditing}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isEditing || !editUserService}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isEditing ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        {userToEdit && (
          <div className="space-y-4">
            <div>
              <p className="mb-2">
                <span className="font-medium">Nom d'utilisateur:</span> {userToEdit.username}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                value={editUserService}
                onChange={(e) => setEditUserService(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isEditing}
              >
                <option value="" disabled>Sélectionner un service</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
      {/* Modal de gestion des permissions */}
        {isPermissionsModalOpen && selectedUserForPermissions && (
          <Modal
            isOpen={isPermissionsModalOpen}
            onClose={() => setIsPermissionsModalOpen(false)}
            title={`Permissions pour ${selectedUserForPermissions.username}`}
          >
            <UserPermissions 
              userId={selectedUserForPermissions.id}
              username={selectedUserForPermissions.username}
              service={selectedUserForPermissions.service}
              onClose={() => setIsPermissionsModalOpen(false)}
            />
          </Modal>
        )}
    </div>
  );
}