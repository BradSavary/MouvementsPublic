import React from 'react';
import { DecesList } from '../components/Deces/List/DecesList';
import { PermissionProtectedRoute } from '../components/Protection/PermissionProtectedRoute';

export function DecesListPage() {
  return (
    <PermissionProtectedRoute requiredPermission="viewDeathRecords">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Registre des décès</h2>
        <DecesList />
      </div>
    </PermissionProtectedRoute>
  );
}