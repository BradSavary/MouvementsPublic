import React from 'react';

export function InfoField({ label, value }) {
  if (value === undefined || value === null) return null;
  
  return (
    <div>
      <span className="font-medium">{label}:</span> {value}
    </div>
  );
}