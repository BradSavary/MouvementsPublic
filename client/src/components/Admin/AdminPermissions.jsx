import React, { useState, useEffect } from 'react';
import { getAllSystemServices, getServicePermissions, updateServicePermissions } from '../../../data/admin-data';
import { getAllPermissions } from '../../../config/permissions';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function AdminPermissions() {
  const [services, setServices] = useState([]);
  const [allPermissions, setAllPermissions] = useState({});
  const [servicePermissions, setServicePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    // Charger la liste des services et des permissions
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const servicesResponse = await getAllSystemServices();
        
        if (servicesResponse.status === 'success') {
          setServices(servicesResponse.data || []);
        } else {
          setError('Erreur lors du chargement des services');
          console.error(servicesResponse.message);
        }
        
        // Charger la définition de toutes les permissions disponibles
        // Cette liste provient de permissions.js et sert uniquement de référence pour l'interface
        setAllPermissions(getAllPermissions());
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      // Charger les permissions du service sélectionné depuis la base de données
      const fetchServicePermissions = async () => {
        try {
          setLoading(true);
          setError('');
          
          const response = await getServicePermissions(selectedService);
          
          if (response.status === 'success') {
            setServicePermissions(response.data || {});
          } else {
            setError(`Erreur lors du chargement des permissions pour ${selectedService}`);
            console.error(response.message);
          }
        } catch (err) {
          setError('Une erreur est survenue lors du chargement des permissions');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchServicePermissions();
    }
  }, [selectedService]);

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setError('');
    setSuccess('');
  };

  const handlePermissionChange = (permission) => {
    setServicePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await updateServicePermissions(selectedService, servicePermissions);
      
      if (response.status === 'success') {
        setSuccess(`Permissions du service "${selectedService}" mises à jour avec succès`);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour des permissions');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la sauvegarde');
      console.error(err);
    } finally {
      setSaving(false);
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
      <h3 className="text-lg font-medium mb-4">Gestion des permissions par service</h3>
      
      {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-blue-700">Guide de gestion des permissions</span>
        </div>
        <p className="text-blue-600 text-sm">
          Les permissions définissent ce que chaque service peut faire dans l'application. 
          Sélectionnez un service et cochez les actions qu'il peut effectuer.
          N'oubliez pas de cliquer sur "Enregistrer les modifications" après avoir ajusté les permissions.
        </p>
      </div> */}
      
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
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sélectionner un service</label>
        <select
          value={selectedService}
          onChange={handleServiceChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Sélectionner un service</option>
          {services.length === 0 ? (
            <option value="" disabled>Aucun service disponible</option>
          ) : (
            services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))
          )}
        </select>
      </div>
      
      {selectedService && (
        <div>
          <h4 className="font-medium mb-3">Permissions pour {selectedService}</h4>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
            {Object.entries(allPermissions).map(([key, label]) => (
              <div key={key} className="flex items-center pl-2 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`permission-${key}`}
                  checked={servicePermissions[key] || false}
                  onChange={() => handlePermissionChange(key)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`permission-${key}`} className="ml-2 block text-sm text-gray-700 w-full p-2">
                  {label}
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSavePermissions}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <span className="mr-2">Enregistrement...</span>
                  <LoadingSpinner size="small" />
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}