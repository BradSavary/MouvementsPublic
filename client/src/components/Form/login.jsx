import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser, saveAuthToken, logoutUser } from '../../../data/user-data';

export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Vérifier et supprimer tout token existant au chargement de la page
    useEffect(() => {
        // Toujours déconnecter l'utilisateur quand il arrive sur la page de login
        logoutUser();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log("Tentative de connexion pour:", username);
            const response = await authenticateUser(username, password);
            console.log("Réponse d'authentification:", response);
            
            if (response.status === 'success' && response.token) {
                console.log("Token reçu:", response.token);
                
                // Stocker le token d'authentification
                saveAuthToken(response.token);
                
                // Vérifier que le token a bien été sauvegardé
                const savedToken = localStorage.getItem('authToken');
                console.log("Token sauvegardé:", savedToken);
                
                if (savedToken) {
                    // Rediriger vers la page d'accueil
                    navigate('/home');
                } else {
                    setError("Erreur lors de la sauvegarde du token d'authentification");
                }
            } else {
                setError(response.message || 'Erreur lors de la connexion: token manquant');
                console.error("Réponse sans token:", response);
            }
        } catch (err) {
            setError('Une erreur est survenue lors de la connexion');
            console.error("Erreur de connexion:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-center mb-6">
                <h2 className="text-2xl font-semibold text-blue-600">CHIMB Mouvements</h2>
            </div>
            
            {error && (
                <div className="p-4 mb-5 bg-red-100 text-red-700 rounded-md border border-red-300">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 mt-4 border border-transparent rounded-md shadow-sm text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Application de gestion des mouvements résidents</p>
                <p className="mt-1">Centre Hospitalier Intercommunal de Monts et Barrages</p>
            </div>
        </div>
    );
}