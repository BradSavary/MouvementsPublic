import React from 'react';

export function ChartWrapper({ title, children, isLoading = false }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="chart-container">
          {children}
        </div>
      )}
    </div>
  );
}