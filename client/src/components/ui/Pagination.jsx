import React from 'react';

export function Pagination({ currentPage, totalPages, onPageChange }) {
    const renderPageButtons = () => {
        const pages = [];
        
        // Toujours afficher la première page
        pages.push(
            <button
                key={1}
                onClick={() => onPageChange(1)}
                className={`cursor-pointer px-3 py-1 rounded ${
                    currentPage === 1 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
                1
            </button>
        );
        
        // Pagination simplifié pour beaucoup de pages
        if (totalPages > 7) {
            if (currentPage > 3) {
                pages.push(
                    <span key="ellipsis1" className="px-2">...</span>
                );
            }
            
            // Pages autour de la page actuelle
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`cursor-pointer px-3 py-1 rounded ${
                            currentPage === i 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {i}
                    </button>
                );
            }
            
            if (currentPage < totalPages - 2) {
                pages.push(
                    <span key="ellipsis2" className="px-2">...</span>
                );
            }
        } else {
            // Afficher toutes les pages si peu nombreuses
            for (let i = 2; i < totalPages; i++) {
                pages.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`cursor-pointer px-3 py-1 rounded ${
                            currentPage === i 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {i}
                    </button>
                );
            }
        }
        
        // Toujours afficher la dernière page si plus d'une page
        if (totalPages > 1) {
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className={`cursor-pointer px-3 py-1 rounded ${
                        currentPage === totalPages 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    {totalPages}
                </button>
            );
        }
        
        return pages;
    };
    
    return (
        <div className="flex justify-center items-center space-x-2 mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`cursor-pointer px-3 py-1 rounded ${
                    currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
                &lt;
            </button>
            
            {renderPageButtons()}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`cursor-pointer px-3 py-1 rounded ${
                    currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
                &gt;
            </button>
        </div>
    );
}