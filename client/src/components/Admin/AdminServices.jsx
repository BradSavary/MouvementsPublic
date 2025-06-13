import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getAllSystemServices, addService, deleteService } from '../../../data/admin-data';
import { Modal } from '../ui/Modal';

export function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getAllSystemServices();
      
      if (response.status === 'success' && response.data) {
        setServices(response.data);
      } else {
        setError('Erreur lors du chargement des services');
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      if (!newServiceName.trim()) {
        setError('Le nom du service ne peut pas être vide');
        return;
      }
      
      const response = await addService(newServiceName);
      
      if (response.status === 'success') {
        await fetchServices();
        setNewServiceName('');
        setIsAddModalOpen(false);
        setSuccess('Service ajouté avec succès');
      } else {
        setError(response.message || 'Échec de l\'ajout du service');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'ajout');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteService = async () => {
    try {
      setActionLoading(true);
      setError('');
      
      const response = await deleteService(serviceToDelete);
      
      if (response.status === 'success') {
        await fetchServices();
        setServiceToDelete('');
        setIsDeleteModalOpen(false);
        setSuccess('Service supprimé avec succès');
      } else {
        setError(response.message || 'Échec de la suppression du service');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Gestion des services</h3>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-4 bg-green-100 text-green-700 rounded border border-green-300">
          {success}
        </div>
      )}
      
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ajouter un service
        </button>
      </div>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom du service
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun service disponible
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setServiceToDelete(service);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                      disabled={service === 'Admin'} // Empêcher la suppression du service Admin
                    >
                      {service === 'Admin' ? 'Protégé' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal d'ajout de service */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un service"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={actionLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleAddService}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={actionLoading || !newServiceName.trim()}
            >
              {actionLoading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Entrez le nom du nouveau service. Ce service pourra ensuite être associé à des utilisateurs
            et ses permissions pourront être configurées.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du service</label>
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: Service Social"
            />
          </div>
        </div>
      </Modal>
      
      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={actionLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteService}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={actionLoading}
            >
              {actionLoading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-lg font-medium">
            Êtes-vous sûr de vouloir supprimer ce service ?
          </p>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p>Cette action est <strong>irréversible</strong>.</p>
            <p className="mt-2">
              Le service <strong>{serviceToDelete}</strong> sera définitivement supprimé.
              Les utilisateurs associés à ce service n'auront plus accès au système.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}