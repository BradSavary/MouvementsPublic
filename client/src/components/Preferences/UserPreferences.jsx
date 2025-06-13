import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getUserPreferences, updateUserPreferences, resetUserPreferences, getUnvalidatedStats } from '../../../data/preferences-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { usePermissions } from '../../../lib/usePermissions';

export function UserPreferences() {
  const { userData } = useOutletContext();
  const { can } = usePermissions();
  const [preferences, setPreferences] = useState({
    notification_type: 'never',
    email: '',
  });
  
  const [stats, setStats] = useState({
    uncheckedMovements: 0,
    uncheckedDeaths: 0,
    totalUnchecked: 0
  });
  
  const [originalPreferences, setOriginalPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Vérifier si l'utilisateur peut voir les statistiques
  const canViewStats = can('checkMovement');

  // Charger les préférences de l'utilisateur
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const response = await getUserPreferences();
        if (response.status === 'success') {
          setPreferences(response.data);
          setOriginalPreferences(response.data);
        } else {
          setError(response.message || 'Erreur lors du chargement des préférences');
        }
        
        // Charger les statistiques uniquement si l'utilisateur a la permission
        if (canViewStats) {
          const statsResponse = await getUnvalidatedStats();
          if (statsResponse.status === 'success') {
            setStats(statsResponse.data);
          }
        }
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des préférences');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreferences();
  }, [canViewStats]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Pour les notifications, réinitialiser l'email si "jamais"
    if (name === 'notification_type' && value === 'never') {
      setPreferences(prev => ({ ...prev, [name]: value, email: '' }));
    } else {
      setPreferences(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer les messages
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Valider le format de l'email si des notifications sont activées
      if (preferences.notification_type !== 'never') {
        if (!preferences.email) {
          setError("L'adresse email est requise pour recevoir des notifications");
          setSaving(false);
          return;
        }
        
        if (!preferences.email.match(/^[a-zA-Z0-9._%+-]+@chimb\.fr$/)) {
          setError("L'adresse email doit être au format example@chimb.fr");
          setSaving(false);
          return;
        }
      }
      
      const response = await updateUserPreferences(preferences);
      
      if (response.status === 'success') {
        setSuccess('Préférences mises à jour avec succès');
        setOriginalPreferences(preferences);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour des préférences');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour des préférences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Voulez-vous vraiment réinitialiser vos préférences ?')) {
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await resetUserPreferences();
      
      if (response.status === 'success') {
        // Recharger les préférences
        const prefResponse = await getUserPreferences();
        if (prefResponse.status === 'success') {
          setPreferences(prefResponse.data);
          setOriginalPreferences(prefResponse.data);
          setSuccess('Préférences réinitialisées avec succès');
        }
      } else {
        setError(response.message || 'Erreur lors de la réinitialisation des préférences');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la réinitialisation des préférences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Vérifier si des modifications ont été effectuées
  const hasChanges = originalPreferences && (
    preferences.notification_type !== originalPreferences.notification_type ||
    preferences.email !== originalPreferences.email
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="p-4 mb-5 bg-red-100 text-red-700 rounded-md border border-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-5 bg-green-100 text-green-700 rounded-md border border-green-300">
          {success}
        </div>
      )}
      
      {/* Section des statistiques - afficher uniquement si l'utilisateur a la permission */}
      {canViewStats && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium mb-3 text-blue-800">Statistiques actuelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <span className="block text-sm text-gray-500">Mouvements non validés</span>
              <span className="block text-3xl font-bold text-blue-600">{stats.uncheckedMovements}</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <span className="block text-sm text-gray-500">Décès non validés</span>
              <span className="block text-3xl font-bold text-blue-600">{stats.uncheckedDeaths}</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <span className="block text-sm text-gray-500">Total à valider</span>
              <span className="block text-3xl font-bold text-blue-600">{stats.totalUnchecked}</span>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Notifications par email */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Notifications par email</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recevoir des notifications pour
              </label>
              <select
                name="notification_type"
                value={preferences.notification_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="never">Jamais</option>
                <option value="death_only">Uniquement les décès</option>
                <option value="all">Tous les mouvements</option>
              </select>
            </div>
            
            {preferences.notification_type !== 'never' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  name="email"
                  value={preferences.email || ''}
                  onChange={handleChange}
                  placeholder="votre.nom@chimb.fr"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  L'adresse email doit être au format @chimb.fr
                </p>
              </div>
            )}
          </div>
          
          {/* Boutons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2 hover:bg-gray-300 disabled:opacity-50"
            >
              Réinitialiser tout
            </button>
            
            <button
              type="submit"
              disabled={saving || !hasChanges}
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
      </form>
    </div>
  );
}