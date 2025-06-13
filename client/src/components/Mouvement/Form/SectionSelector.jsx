import React, { useEffect, useState } from 'react';

export function SectionSelector({ service, onSectionChange, selectedSection }) {
  const [sections, setSections] = useState([]);
  
  useEffect(() => {
    // Si le service est Médecine, proposer les sections
    if (service === 'Médecine') {
      setSections(['Médecine', 'USLD']);
    } else {
      setSections([]);
    }
  }, [service]);
  
  if (sections.length === 0) {
    return null;
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Précision</label>
      <select
        value={selectedSection || ''}
        onChange={(e) => onSectionChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Sélectionner un type</option>
        {sections.map(section => (
          <option key={section} value={section}>{section}</option>
        ))}
      </select>
    </div>
  );
}