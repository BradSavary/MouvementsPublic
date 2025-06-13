import React from 'react';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

export function DecesSearchBar({ searchQuery, onSearch, onClear, isSearching }) {
    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Rechercher par nom d'usage, nom de naissance ou prénom..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                
                {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {isSearching ? (
                            <LoadingSpinner size="small" />
                        ) : (
                            <button 
                                onClick={onClear} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}