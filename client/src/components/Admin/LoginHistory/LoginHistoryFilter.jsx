import React from 'react';

export function LoginHistoryFilter({ filters, onFilterChange, onResetFilters, onApplyFilters }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-medium mb-3">Filtres</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
          <input
            type="text"
            name="username"
            value={filters.username || ''}
            onChange={handleChange}
            placeholder="Rechercher par nom d'utilisateur"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="success">Réussies</option>
            <option value="failed">Échouées</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onResetFilters}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md mr-2 hover:bg-gray-200"
        >
          Réinitialiser
        </button>
        <button
          onClick={onApplyFilters}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}