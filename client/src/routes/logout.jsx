import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Logout() {
    const navigate = useNavigate();
    
    // Supprime le token du localStorage lors du montage du composant
    useEffect(() => {
        localStorage.removeItem('token');
    }, []);

    const handleLogin = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                </div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Vous avez été déconnecté</h2>
                    <p className="text-gray-600 mb-6">Votre session a été fermée avec succès.</p>
                <button 
                    onClick={handleLogin} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors duration-300"
                >
                    Se reconnecter
                </button>
            </div>
        </div>
    );
}
