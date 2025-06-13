import React, { useEffect } from 'react';
import { formatDate } from '../../../../lib/date';
import { ChartWrapper } from './ChartWrapper';
import { Badge } from '../../ui/Badge';

export function UpcomingMovementsCard({ data, isLoading }) {
  if (!data || isLoading) {
    return <ChartWrapper title="Mouvements à venir" isLoading={isLoading} />;
  }

  const { summary, upcoming } = data;
  const count = summary?.count || 0;

  return (
    <ChartWrapper title={`Mouvements à venir (Total: ${count})`} isLoading={isLoading}>
      {count > 0 ? (
        <div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-blue-700 font-medium">Prochaine échéance</p>
              <p className="text-xl font-bold text-blue-800">{summary.min_days} jour{summary.min_days > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-sm text-green-700 font-medium">Échéance moyenne</p>
              <p className="text-xl font-bold text-green-800">{Math.round(summary.avg_days)} jours</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-sm text-purple-700 font-medium">Échéance maximale</p>
              <p className="text-xl font-bold text-purple-800">{summary.max_days} jours</p>
            </div>
          </div>

          {upcoming && upcoming.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Prochains mouvements</h4>
              <div className="space-y-2">
                {upcoming.map(movement => {
                  // Assurons-nous que la propriété checked est un booléen
                  const isChecked = movement.checked === true || movement.checked === 1;
                  
                  return (
                    <div 
                      key={movement.id} 
                      className={`bg-gray-50 p-3 rounded-lg ${
                        isChecked ? 'border-l-4 border-green-500' : ''
                      }`}
                    >
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge type={movement.type} />
                          <span className="font-medium">{movement.nom} {movement.prenom}</span>
                          
                          {isChecked && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Validé
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(movement.date, movement.time)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-lg text-gray-500">Aucun mouvement à venir</p>
        </div>
      )}
    </ChartWrapper>
  );
}