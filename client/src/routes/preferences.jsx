import React from 'react';
import { UserPreferences } from '../components/Preferences/UserPreferences';
import { ProtectedRoute } from '../components/Protection/ProtectedRoute';

export function PreferencesPage() {
  return (
    <ProtectedRoute>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Paramètres utilisateur</h2>
        <UserPreferences />
      </div>
    </ProtectedRoute>
  );
}