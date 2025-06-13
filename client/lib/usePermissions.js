import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "./api-request";

/**
 * Hook personnalisé pour gérer les permissions utilisateur
 */
export function usePermissions(providedUserData = null) {
  // État local pour stocker les permissions
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUsingCustomPermissions, setIsUsingCustomPermissions] =
    useState(false);

  // Récupérer les données utilisateur du contexte si non fournies
  const contextValue = useOutletContext ? useOutletContext() : null;
  const contextUserData = contextValue?.userData;

  // Utiliser les données utilisateur fournies si disponibles, sinon utiliser les données du contexte
  const userData = providedUserData || contextUserData;

  // Obtenir le service et l'id de l'utilisateur
  const userService = userData?.service || null;
  const userId = userData?.id || null;

  // Charger les permissions uniquement à partir de l'ID utilisateur et du service
  useEffect(() => {
    if (!userId || !userService) {
      console.log(
        "Aucun utilisateur trouvé, impossible de charger les permissions"
      );
      setPermissions({});
      setLoading(false);
      return;
    }

    // Toujours récupérer les permissions depuis l'API pour tous les utilisateurs
    const fetchPermissions = async () => {
      try {
        // console.log(`Chargement des permissions pour l'utilisateur ID: ${userId}, Service: ${userService}`);

        // Récupérer les permissions personnalisées ET les permissions du service
        const userPermissionsResponse = await apiRequest.get(
          `user/permissions?userId=${userId}`,
          true
        );

        // console.log("Réponse complète des permissions:", userPermissionsResponse);

        if (userPermissionsResponse.status === "success") {
          const { userPermissions, servicePermissions, hasCustomPermissions } =
            userPermissionsResponse.data;

          // Si l'utilisateur a des permissions personnalisées, appliquer UNIQUEMENT ces permissions
          if (hasCustomPermissions) {
            // console.log("Application des permissions PERSONNALISÉES");
            setPermissions(userPermissions);
            setIsUsingCustomPermissions(true);
          } else {
            // Sinon, utiliser les permissions du service
            // console.log("Application des permissions du SERVICE");
            setPermissions(servicePermissions);
            setIsUsingCustomPermissions(false);
          }
        } else {
          console.error(
            "Échec de la récupération des permissions:",
            userPermissionsResponse.message
          );
          setPermissions({});
        }
      } catch (error) {
        console.error("Erreur lors du chargement des permissions:", error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId, userService]);

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const canFunction = (permission) => {
    // Si les permissions sont en cours de chargement, refuser par défaut
    if (loading) {
      // console.log(`Permission ${permission} refusée car les permissions sont en cours de chargement`);
      return false;
    }

    // Vérifier la permission spécifique dans les données récupérées
    const hasPermission = !!permissions[permission];
    // console.log(`Vérification de la permission ${permission} pour l'utilisateur ${userId} (${userService}): ${hasPermission}`);
    // console.log(`Source des permissions: ${isUsingCustomPermissions ? 'PERSONNALISÉES' : 'SERVICE'}`);
    return hasPermission;
  };

  return {
    can: canFunction,
    isInService: (service) => userService === service,
    getUserService: () => userService,
    canCreateMovementType: (type) => {
      // Si l'utilisateur n'a pas la permission de base pour créer des mouvements, il ne peut rien créer
      if (!permissions["createMovement"]) {
        return false;
      }

      return true;
    },
    isLoading: loading,
    currentPermissions: permissions,
    isUsingCustomPermissions,
    userId,
  };
}
