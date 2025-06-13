import React, { useState } from 'react';
import { AdminPermissions } from './AdminPermissions';
import { AdminUsers } from './AdminUsers';
import { AdminLocations } from './AdminLocations';
import { AdminArchives } from './AdminArchives';
import { AdminLoginHistory } from './LoginHistory/AdminLoginHistory';  // Importer le nouveau composant

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Administration du système</h2>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Permissions des services
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gestion des utilisateurs
          </button>
          
          <button
            onClick={() => setActiveTab('locations')}
            className={`${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Gestion des emplacements
          </button>
          
          <button
            onClick={() => setActiveTab('archives')}
            className={`${
              activeTab === 'archives'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Archivage des mouvements
          </button>
          
          {/* Nouvel onglet pour l'historique des connexions */}
          <button
            onClick={() => setActiveTab('login-history')}
            className={`${
              activeTab === 'login-history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Historique des connexions
          </button>
        </nav>
      </div>
      
      {activeTab === 'permissions' && <AdminPermissions />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'locations' && <AdminLocations />}
      {activeTab === 'archives' && <AdminArchives />}
      {activeTab === 'login-history' && <AdminLoginHistory />}
    </div>
  );
}