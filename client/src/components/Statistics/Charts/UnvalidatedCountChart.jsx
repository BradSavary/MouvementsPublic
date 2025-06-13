import React from 'react';
import { ChartWrapper } from './ChartWrapper';

export function UnvalidatedCountCard({ data, isLoading }) {
  // Extraire les données
  const movementsCount = data?.movements || 0;
  const deathsCount = data?.deaths || 0;
  const totalCount = data?.total || 0;

  const title = `Éléments non validés (Total: ${totalCount})`;

  return (
    <ChartWrapper title={title} isLoading={isLoading}>
      {totalCount > 0 ? (
        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-700 mb-2">{movementsCount}</div>
              <div className="text-sm text-blue-600 font-medium">Mouvements non validés</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-gray-700 mb-2">{deathsCount}</div>
              <div className="text-sm text-gray-600 font-medium">Décès non validés</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-700 mb-2">{totalCount}</div>
              <div className="text-sm text-purple-600 font-medium">Total non validés</div>
            </div>
          </div>
          
          {/* Ajouter une information supplémentaire si nécessaire */}
          {totalCount > 10 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Veillez à valider les éléments avant échéance</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-lg text-green-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tous les éléments sont validés !
          </p>
        </div>
      )}
    </ChartWrapper>
  );
}