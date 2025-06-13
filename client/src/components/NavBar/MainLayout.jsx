import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { verifyToken, logoutUser, getAuthToken } from '../../../data/user-data';
import { usePermissions } from '../../../lib/usePermissions';

export function MainLayout() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Pass userData directly to usePermissions
  const { can } = usePermissions(userData);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
          if (!token) {
          console.error("Aucun token trouvé");
          navigate('/logout');
          return;
        }
        
        console.log("Vérification du token...");
        const response = await verifyToken();
        console.log("Réponse de vérification complète:", response);
        
        if (response.status === 'success' && response.data) {
          console.log("Données utilisateur récupérées:", response.data);
          
          if (!response.data.service) {
            console.error("Service manquant dans les données utilisateur");
          }
          
          setUserData(response.data);        } else {
          console.error("Échec de la vérification du token:", response.message);
          logoutUser();
          navigate('/logout');
        }      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        logoutUser();
        navigate('/logout');
      }finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);
  const handleLogout = () => {
    logoutUser();
    navigate('/logout');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Navigation basé sur les permissions avec système de couleurs
  const renderNavItems = () => {
    const items = [];
    const currentPath = location.pathname;
    
    // Lien d'accueil
    items.push(
      <li key="home">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `block px-4 py-2 ${
              isActive ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-700 hover:bg-indigo-50'
            } rounded border-l-4 border-indigo-500`
          }
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Accueil
          </div>
        </NavLink>
      </li>
    );
    
    // Section Mouvements
    if (can('viewHistory') || can('createMovement')) {
      items.push(
        <li key="mouvements-section" className="mt-6 mb-2">
          <h3 className="px-4 text-xs font-semibold text-green-800 uppercase tracking-wider">Mouvements</h3>
        </li>
      );
      
      if (can('viewHistory')) {
        items.push(
          <li key="mouvements-list">
            <NavLink
              to="/mouvements"
              className={({ isActive }) =>
                `block px-4 py-2 ${
                  isActive ? 'bg-green-100 text-green-700' : 'text-green-700 hover:bg-green-50'
                } rounded border-l-4 border-green-500`
              }
              end // Ajouté pour assurer que seule la route exacte est active
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Historique des mouvements
              </div>
            </NavLink>
          </li>
        );
      }
      
      if (can('createMovement')) {
        items.push(
          <li key="mouvements-add">
            <NavLink
              to="/mouvements/ajout"
              className={({ isActive }) =>
                `block px-4 py-2 ${
                  isActive ? 'bg-green-100 text-green-700' : 'text-green-700 hover:bg-green-50'
                } rounded border-l-4 border-green-500`
              }
              end // Ajouté pour assurer que seule la route exacte est active
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un mouvement
              </div>
            </NavLink>
          </li>
        );
      }
    }
    
    // Section Historique Unifié (séparé des mouvements)
    if (can('viewUnifiedHistory')) {
      items.push(
        <li key="unified-history-section" className="mt-6 mb-2">
          <h3 className="px-4 text-xs font-semibold text-purple-800 uppercase tracking-wider">Historique</h3>
        </li>
      );
      
      items.push(
        <li key="unified-history">
          <NavLink
            to="/historique"
            className={({ isActive }) =>
              `block px-4 py-2 ${
                isActive ? 'bg-purple-100 text-purple-700' : 'text-purple-700 hover:bg-purple-50'
              } rounded border-l-4 border-purple-500`
            }
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Historique
            </div>
          </NavLink>
        </li>
      );
    }

    // Section Décès
    if (can('viewDeathRecords') || can('createDeathRecord')) {
      items.push(
        <li key="deces-section" className="mt-6 mb-2">
          <h3 className="px-4 text-xs font-semibold text-red-800 uppercase tracking-wider">Décès</h3>
        </li>
      );
      
      if (can('viewDeathRecords')) {
        items.push(
          <li key="deces-list">
            <NavLink
              to="/deces"
              end // Ajouter 'end' pour s'assurer que ce lien est actif seulement pour /deces exactement
              className={({ isActive }) =>
                `block px-4 py-2 ${
                  isActive ? 'bg-red-100 text-red-700' : 'text-red-700 hover:bg-red-50'
                } rounded border-l-4 border-red-500`
              }
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Registre des décès
              </div>
            </NavLink>
          </li>
        );
      }
      
      if (can('createDeathRecord')) {
        items.push(
          <li key="deces-add">
            <NavLink
              to="/deces/ajout"
              className={({ isActive }) =>
                `block px-4 py-2 ${
                  isActive ? 'bg-red-100 text-red-700' : 'text-red-700 hover:bg-red-50'
                } rounded border-l-4 border-red-500`
              }
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un décès
              </div>
            </NavLink>
          </li>
        );
      }
    }
    
    // Section Administration
    if (can('adminAccess')) {
      items.push(
        <li key="admin-section" className="mt-6 mb-2">
          <h3 className="px-4 text-xs font-semibold text-blue-800 uppercase tracking-wider">Administration</h3>
        </li>
      );
      
      items.push(
        <li key="admin">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `block px-4 py-2 ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
              } rounded border-l-4 border-blue-500`
            }
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Administration
            </div>
          </NavLink>
        </li>
      );
    }
    
    return items;
  };


  const renderHeaderButtons = () => {
  const buttons = [];
  
  // Bouton Statistiques - uniquement si l'utilisateur a la permission
  if (can('viewStatistics')) {
    buttons.push(
      <Link 
        key="stats-button"
        to="/statistics" 
        className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Statistiques
      </Link>
    );
  }

  buttons.push(
    <Link
      key="preferences"
      to="/preferences"
      className="flex items-center px-3 py-1 text-purple-700 hover:bg-purple-50 rounded-md"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Paramètres
    </Link>
  );
  
  return buttons;
};



  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header with Menu Button */}
      <div className="md:hidden bg-blue-50 border-b p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-blue-800">Mouvement</h2>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded text-blue-700 hover:bg-blue-100"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} md:block
        fixed md:static inset-0 z-20 md:z-auto
        w-full md:w-64 bg-white shadow-md md:h-auto
        md:flex-shrink-0 overflow-y-auto
      `}>
        <div className="p-4 border-b bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-800">Mouvement</h2>
          <p className="text-sm text-blue-600">{userData?.service}</p>
        </div>
        
        {/* Close button only on mobile */}
        <div className="md:hidden p-2 flex justify-end">
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="mt-4 pb-4">
          <ul className="space-y-1 px-2">
            {renderNavItems()}
            <li className="mt-8 pt-4 border-t">
              <button
                onClick={handleLogout}
                className="cursor-pointer w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded border-l-4 border-red-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Bienvenue, {userData?.username}</h1>
          <div className="hidden md:flex items-center space-x-2 ml-4">
          {renderHeaderButtons()}
        </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet context={{ userData }} />
        </main>
      </div>
      
      {/* Dark overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}