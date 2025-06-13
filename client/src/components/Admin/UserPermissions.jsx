import React, { useState, useEffect } from 'react';
import { getAllPermissions } from '../../../config/permissions';
import { getUserPermissions, updateUserPermissions, resetUserPermissions } from '../../../data/user-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function UserPermissions({ userId, username, service, onClose }) {
  const [permissionsData, setPermissionsData] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [servicePermissions, setServicePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const allPermissionsList = getAllPermissions();

  // Charger les données des permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await getUserPermissions(userId);
        
        if (response.status === 'success') {
          setPermissionsData(response.data);
          
          // Si l'utilisateur a des permissions personnalisées, utiliser ces permissions
          if (response.data.hasCustomPermissions) {
            setUserPermissions(response.data.userPermissions || {});
            setHasCustomPermissions(true);
          } else {
            // Sinon, utiliser les permissions du service comme base
            setUserPermissions(response.data.servicePermissions || {});
            setHasCustomPermissions(false);
          }
          
          // Toujours stocker les permissions du service pour référence
          setServicePermissions(response.data.servicePermissions || {});
        } else {
          setError(response.message || 'Erreur lors du chargement des permissions');
        }
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des permissions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [userId]);

  const handlePermissionChange = (key) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Si l'utilisateur n'avait pas de permissions personnalisées avant, il en a maintenant
    if (!hasCustomPermissions) {
      setHasCustomPermissions(true);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await updateUserPermissions(userId, userPermissions);
      
      if (response.status === 'success') {
        setSuccess('Permissions mises à jour avec succès');
        setHasCustomPermissions(true);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour des permissions');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour des permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await resetUserPermissions(userId);
      
      if (response.status === 'success') {
        // Réinitialiser aux permissions du service
        setUserPermissions(servicePermissions);
        setHasCustomPermissions(false);
        setSuccess('Permissions réinitialisées aux valeurs du service');
      } else {
        setError(response.message || 'Erreur lors de la réinitialisation des permissions');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la réinitialisation des permissions');
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
      <h3 className="text-lg font-medium mb-4">Gestion des permissions pour {username}</h3>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="font-medium">Service:</span> {service}
          {hasCustomPermissions && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Permissions personnalisées
            </span>
          )}
        </div>
        {hasCustomPermissions && (
          <button
            onClick={handleResetPermissions}
            disabled={saving}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
          >
            Réinitialiser au service
          </button>
        )}
      </div>
      
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
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
        {Object.entries(allPermissionsList).map(([key, label]) => {
          const hasServicePermission = servicePermissions[key];
          const hasUserPermission = userPermissions[key];
          
          return (
            <div key={key} className="flex items-center pl-2 hover:bg-gray-100 rounded">
              <input
                type="checkbox"
                id={`permission-${key}`}
                checked={hasUserPermission || false}
                onChange={() => handlePermissionChange(key)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`permission-${key}`} className="ml-2 block text-sm text-gray-700 w-full p-2 flex justify-between">
                <span>{label}</span>
                {hasServicePermission && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Service</span>
                )}
                {hasCustomPermissions && hasServicePermission !== hasUserPermission && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Personnalisé</span>
                )}
              </label>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2 hover:bg-gray-300"
        >
          Annuler
        </button>
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
  );
}