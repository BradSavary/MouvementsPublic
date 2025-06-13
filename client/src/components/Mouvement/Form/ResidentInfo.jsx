import React from 'react';
import { InfoField } from '../../ui/InfoField';

export function ResidentInfo({ resident }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Informations du résident</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
        <InfoField label="Nom d'usage" value={resident.nom} />
        <InfoField label="Nom de naissance" value={resident.nom_naissance} />
        <InfoField label="Prénom" value={resident.prenom} />
        <InfoField 
          label="Date de naissance" 
          value={new Date(resident.naissance).toLocaleDateString('fr-FR')} 
        />
        <InfoField label="Sexe" value={resident.sex} />
      </div>
    </div>
  );
}