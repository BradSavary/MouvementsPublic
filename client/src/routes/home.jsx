import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../lib/usePermissions';
import { logoutUser } from '../../data/user-data';
import { countUnvalidatedItems } from '../../data/unified-history-data';
import { getActiveNoMovementDays } from '../../data/no-movement-days-data';
import { NoMovementBanner } from '../components/NoMovement/NoMovementBanner';
import { NoMovementModal } from '../components/NoMovement/NoMovementModal';

export function Home() {
    const { userData } = useOutletContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { can } = usePermissions(userData);
    const [unvalidatedCount, setUnvalidatedCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(false);

    // Récupérer le message d'erreur d'accès refusé du state de location
    const accessDenied = location.state?.accessDenied;
    const accessDeniedMessage = location.state?.message;

        // États pour gérer les jours sans mouvement
        const [noMovementDays, setNoMovementDays] = useState([]);
        const [isNoMovementModalOpen, setIsNoMovementModalOpen] = useState(false);
        const [loadingNoMovementDays, setLoadingNoMovementDays] = useState(false);

    // Charger le nombre d'éléments non validés si l'utilisateur a la permission
    useEffect(() => {
        if (can('viewUnifiedHistory')) {
            const fetchUnvalidatedCount = async () => {
                setLoadingCount(true);
                try {
                    const response = await countUnvalidatedItems();
                    if (response && response.status === 'success') {
                        setUnvalidatedCount(response.data.count || 0);
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération du nombre d'éléments non validés:", error);
                } finally {
                    setLoadingCount(false);
                }
            };
            
            fetchUnvalidatedCount();
        }
    }, [can]);

    // Effacer le state de location après affichage
    useEffect(() => {
        if (accessDenied) {
            const timer = setTimeout(() => {
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [accessDenied, navigate, location]);    
    
    const handleLogout = () => {
        logoutUser();
        navigate('/logout');
    };

    if (!userData) {
        return (
            <div className="text-center py-10">
                <p>Chargement des données utilisateur...</p>
            </div>
        );
    }

    // Charger le jour sans mouvement actif
        useEffect(() => {
            const fetchNoMovementDays = async () => {
                setLoadingNoMovementDays(true);
                try {
                    const response = await getActiveNoMovementDays();
                    if (response.status === 'success') {
                        setNoMovementDays(response.data || []);
                    } else {
                        console.error("Erreur lors de la récupération des jours sans mouvement:", response.message);
                        setNoMovementDays([]);
                    }
                } catch (error) {
                    console.error("Erreur:", error);
                    setNoMovementDays([]);
                } finally {
                    setLoadingNoMovementDays(false);
                }
            };
            
            fetchNoMovementDays();
        }, []);

        const handleNoMovementSuccess = async () => {
            setIsNoMovementModalOpen(false);
            // Recharger les jours sans mouvement
            setLoadingNoMovementDays(true);
            try {
                const response = await getActiveNoMovementDays();
                if (response.status === 'success') {
                    setNoMovementDays(response.data || []);
                }
            } catch (error) {
                console.error("Erreur:", error);
            } finally {
                setLoadingNoMovementDays(false);
            }
        };

        const handleDismissNoMovementDay = () => {
    // Recharger les jours sans mouvement
    setLoadingNoMovementDays(true);
    try {
        const fetchNoMovementDays = async () => {
            const response = await getActiveNoMovementDays();
            if (response.status === 'success') {
                setNoMovementDays(response.data || []);
            }
        };
        fetchNoMovementDays();
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        setLoadingNoMovementDays(false);
    }
};
    
    // Fonction pour générer la liste des fonctionnalités accessibles à l'utilisateur
    const renderUserFeatures = () => {
        const features = [];
        
        // Code existant pour les autres fonctionnalités...
        
        if (can('viewHistory')) {
            features.push({
                name: "Historique des mouvements",
                description: "Consulter l'historique des mouvements",
                path: "/mouvements",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                )
            });
        }
        
        if (can('createMovement')) {
            features.push({
                name: "Ajouter un mouvement",
                description: "Enregistrer un nouveau mouvement (entrée, sortie, transfert)",
                path: "/mouvements/ajout",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                )
            });
        }
        
        if (can('viewUnifiedHistory')) {
            features.push({
                name: "Historique",
                description: "Consulter l'historique des mouvements",
                path: "/historique",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                )
            });
        }
        
        if (can('viewDeathRecords')) {
            features.push({
                name: "Registre des décès",
                description: "Consulter l'historique des décès",
                path: "/deces",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                    </svg>
                )
            });
        }
            
        if (can('createDeathRecord')) {
            features.push({
                name: 'Ajouter un décès',
                path: '/deces/ajout',
                description: 'Enregistrer un nouveau décès',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                )
            });
        }
        
        if (can('adminAccess')) {
            features.push({
                name: "Administration",
                description: "Gérer les utilisateurs et les paramètres",
                path: "/admin",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            });
        }
        
        return features;
    };

    const features = renderUserFeatures();

    return (
        <div className="space-y-6">
            {accessDenied && (
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Accès refusé: </span>
                        <span className="ml-1">{accessDeniedMessage || "Vous n'avez pas les permissions nécessaires."}</span>
                    </div>
                </div>
            )}

             

            {can('viewUnifiedHistory') && unvalidatedCount > 0 && (
                <div className="p-4 mb-4 bg-amber-100 border border-amber-300 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center mb-2 sm:mb-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="font-medium text-amber-800">
                                Il y a {unvalidatedCount} élément{unvalidatedCount > 1 ? 's' : ''} non validé{unvalidatedCount > 1 ? 's' : ''}.
                            </span>
                        </div>
                        <button 
                            className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                            onClick={() => navigate('/historique')}
                        >
                            Voir l'historique
                        </button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6">
                {/* Bannière pour les jours sans mouvement */}
                   {loadingNoMovementDays ? (
                        <div className="mb-6">
                            <div className="bg-gray-100 border-l-4 border-gray-300 p-4 rounded-md animate-pulse">
                                Chargement...
                            </div>
                        </div>
                    ) : (
                        noMovementDays.length > 0 && (
                            <NoMovementBanner 
                                noMovementDays={noMovementDays} 
                                onDismiss={handleDismissNoMovementDay} 
                            />
                        )
                    )}

                    <div className="flex flex-row justify-between pb-2">
                        <h2 className="text-xl font-semibold mb-4">Tableau de bord</h2>
                        {/* Bouton pour signaler un jour sans mouvement */}
                        {can('createMovement') && !loadingNoMovementDays && (
                            <button 
                                onClick={() => setIsNoMovementModalOpen(true)} 
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Signaler aucun mouvement
                            </button>
                        )}
                    </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                    <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-blue-700">Bienvenue dans l'application Mouvement</span>
                    </div>
                    <p className="text-blue-600">
                        Vous êtes connecté en tant que <strong>{userData.username}</strong>.
                    </p>
                </div>
                
                <h3 className="text-lg font-medium mb-3">Fonctionnalités disponibles</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <div 
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer"
                            onClick={() => navigate(feature.path)}
                        >
                            <div className="flex items-center justify-center mb-3">
                                {feature.icon}
                            </div>
                            <h4 className="font-medium text-center mb-2">{feature.name}</h4>
                            <p className="text-gray-600 text-sm text-center">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

             {/* Modal pour signaler un jour sans mouvement */}
            <NoMovementModal 
                isOpen={isNoMovementModalOpen} 
                onClose={() => setIsNoMovementModalOpen(false)} 
                onSuccess={handleNoMovementSuccess}
            />
        </div>
    );
}