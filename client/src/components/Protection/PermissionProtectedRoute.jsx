import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../../lib/usePermissions';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Composant qui restreint l'accès aux routes en fonction des permissions
 */
export function PermissionProtectedRoute({ 
  requiredPermission, 
  children, 
  redirectTo = '/home' 
}) {
  const { can, isLoading, currentPermissions, getUserService, isUsingCustomPermissions } = usePermissions();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Vérifier si l'utilisateur a la permission requise une fois que les permissions sont chargées
  useEffect(() => {
    if (!isLoading) {
      // console.log("Vérification de permission pour", requiredPermission);
      // console.log("Service de l'utilisateur:", getUserService());
      // console.log("Permissions actuelles:", currentPermissions);
      
      const permitted = can(requiredPermission);
      console.log("Permission accordée:", permitted);
      
      setHasPermission(permitted);
      setIsChecking(false);
    }
  }, [isLoading, can, requiredPermission, currentPermissions, getUserService]);
  
  // Afficher un spinner pendant le chargement des permissions
  if (isLoading || isChecking) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }
  
  // Redirection si l'utilisateur n'a pas la permission requise
  if (!hasPermission) {
    console.log("Redirection: permission refusée pour", requiredPermission);
    return (
      <Navigate 
        to={redirectTo} 
        replace 
        state={{ 
          accessDenied: true, 
          message: `Vous n'avez pas la permission '${requiredPermission}' nécessaire pour accéder à cette page.` 
        }}
      />
    );
  }
  
  // Afficher le contenu si l'utilisateur a la permission
  return children;
}