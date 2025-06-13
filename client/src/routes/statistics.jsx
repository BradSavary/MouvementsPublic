import React from 'react';
import { StatisticsDashboard } from '../components/Statistics/StatisticsDashboard';
import { PermissionProtectedRoute } from '../components/Protection/PermissionProtectedRoute';

export function StatisticsPage() {
  return (
    <PermissionProtectedRoute requiredPermission="viewStatistics">
      <div className="bg-white rounded-lg shadow p-6">
        <StatisticsDashboard />
      </div>
    </PermissionProtectedRoute>
  );
}