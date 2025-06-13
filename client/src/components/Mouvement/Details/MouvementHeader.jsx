import React from 'react';
import { Badge } from '../../ui/Badge';
import { formatDate } from '../../../../lib/date';

export function MouvementHeader({ type, date, time, checked, checkedBy }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-4">
      <div className="mb-2 sm:mb-0 flex items-center space-x-3">
        <Badge type={type} />
        
        {checked && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Vérifié par {checkedBy}
          </span>
        )}
      </div>
      <div className="text-gray-600">
        {formatDate(date, time)}
      </div>
    </div>
  );
}