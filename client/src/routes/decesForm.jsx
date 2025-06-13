import React from 'react';
import { DecesForm } from '../components/Deces/Form/DecesForm';
import { PermissionProtectedRoute } from '../components/Protection/PermissionProtectedRoute';

export function DecesFormPage() {
  return (
    <PermissionProtectedRoute requiredPermission="createDeathRecord">
      <DecesForm />
    </PermissionProtectedRoute>
  );
}