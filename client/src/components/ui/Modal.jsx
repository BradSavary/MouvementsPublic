import React from 'react';

export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec backdrop-filter */}
      <div 
        className="fixed inset-0 backdrop-blur-sm backdrop-brightness-50" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-10">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {children}
        </div>

        {footer && (
          <div className="p-4 bg-gray-50 border-t flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}