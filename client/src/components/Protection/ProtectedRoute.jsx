import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isUserLoggedIn, verifyToken, logoutUser } from '../../../data/user-data';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            // Vérifier si un token existe
            if (!isUserLoggedIn()) {
                console.log("Aucun token trouvé - Redirection vers login");
                setLoading(false);
                return;
            }

            // Vérifier la validité du token auprès du serveur
            try {
                const response = await verifyToken();
                if (response.status === 'success') {
                    console.log("Token valide - Autorisation accordée");
                    setIsAuthenticated(true);
                } else {                    console.error("Token invalide ou expiré:", response.message);
                    logoutUser();
                    // Rediriger vers la page de déconnexion
                    navigate('/logout', { replace: true });
                }            } catch (error) {
                console.error('Erreur lors de la vérification du token:', error);
                logoutUser();
                navigate('/logout', { replace: true });
            }finally {
                setLoading(false);
            }
        };

        // Vérifier l'authentification à chaque changement de route
        checkAuth();
    }, [navigate, location.pathname]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-2 text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }    if (!isAuthenticated) {
        return <Navigate to="/logout" replace />;
    }
    
    return children;
}