import React from 'react';
import { UnifiedHistoryList } from '../components/UnifiedHistory/UnifiedHistoryList';
import { PermissionProtectedRoute } from '../components/Protection/PermissionProtectedRoute';

export function UnifiedHistoryPage() {
  return (
    <PermissionProtectedRoute requiredPermission="viewUnifiedHistory">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des mouvements</h2>
        <UnifiedHistoryList />
      </div>
    </PermissionProtectedRoute>
  );
}