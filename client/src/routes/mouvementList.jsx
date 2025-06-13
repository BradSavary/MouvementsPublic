import React from 'react';
import { MouvementsList } from '../components/Mouvement/List/MouvementsList';
import { ProtectedRoute } from '../components/Protection/ProtectedRoute';

export function MouvementListPage() {
  return (
    <ProtectedRoute>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des mouvements</h2>
        <MouvementsList />
      </div>
    </ProtectedRoute>
  );
}