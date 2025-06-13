import { apiRequest } from "../lib/api-request";

/**
 * Récupérer tous les services
 */
export const getAllSystemServices = async () => {
  try {
    const response = await apiRequest.get("admin/services", true);

    // Vérifier que la réponse est correcte et contient des données
    if (response.status === "success") {
      // S'assurer que les données sont un tableau
      if (Array.isArray(response.data)) {
        return response;
      } else {
        // Si les données ne sont pas un tableau, créer une nouvelle réponse
        console.warn(
          "getAllServices: response.data is not an array",
          response.data
        );
        return {
          status: "success",
          data: response.data ? [response.data] : [],
        };
      }
    }

    return response;
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de la récupération des services",
      data: [],
    };
  }
};

/**
 * Ajouter un nouveau service
 */
export const addService = async (serviceName) => {
  return await apiRequest.post("admin/services", { name: serviceName }, true);
};

/**
 * Supprimer un service
 */
export const deleteService = async (serviceName) => {
  return await apiRequest.delete(
    `admin/services/${encodeURIComponent(serviceName)}`,
    true
  );
};

/**
 * Mettre à jour les permissions d'un service
 */
export const updateServicePermissions = async (serviceName, permissions) => {
  return await apiRequest.put(
    `admin/permissions/${encodeURIComponent(serviceName)}`,
    { permissions },
    true
  );
};

/**
 * Récupérer les permissions d'un service spécifique
 */
export const getServicePermissions = async (serviceName) => {
  return await apiRequest.get(
    `admin/permissions/${encodeURIComponent(serviceName)}`,
    true
  );
};

/**
 * Ajouter un emplacement (chambre ou établissement)
 */
export const addLocation = async (location) => {
  return await apiRequest.post("admin/locations", location, true);
};

/**
 * Supprimer un emplacement
 */
export const deleteLocation = async (locationId) => {
  return await apiRequest.delete(
    `admin/locations/${encodeURIComponent(locationId)}`,
    true
  );
};
