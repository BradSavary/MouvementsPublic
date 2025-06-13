import React from 'react';

export function LoadingSpinner({ size = 'medium' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-blue-500`}></div>
    </div>
  );
}