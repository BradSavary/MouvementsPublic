import React from 'react';

export function Badge({ type, text }) {
  let bgColor = '';
  
  switch (type) {
    case 'Entrée':
      bgColor = 'bg-green-100 text-green-800 border-green-300';
      break;
    case 'Sortie':
      bgColor = 'bg-red-100 text-red-800 border-red-300';
      break;
    case 'Transfert':
      bgColor = 'bg-blue-100 text-blue-800 border-blue-300';
      break;
    case 'Décès':
      bgColor = 'bg-gray-100 text-gray-800 border-gray-300';
      break;
    default:
      bgColor = 'bg-gray-100 text-gray-800 border-gray-300';
  }
  
  return (
    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${bgColor}`}>
      {text || type}
    </span>
  );
}