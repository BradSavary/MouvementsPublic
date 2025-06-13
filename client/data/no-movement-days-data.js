import { apiRequest } from "../lib/api-request";

/**
 * Récupérer les jours sans mouvement actifs (aujourd'hui)
 */
export const getActiveNoMovementDays = async () => {
  try {
    const response = await apiRequest.get("no-movement-days?active=true", true);
    console.log("Jours sans mouvement actifs:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la récupération des jours sans mouvement actifs:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: []
    };
  }
};

/**
 * Signaler un jour sans mouvement
 */
export const createNoMovementDay = async (date, service) => {
  try {
    const response = await apiRequest.post("no-movement-days", { date, service }, true);
    console.log("Réponse après création d'un jour sans mouvement:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la création d'un jour sans mouvement:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};

/**
 * Supprimer un jour sans mouvement
 */
export const deleteNoMovementDay = async (date, service) => {
  try {
    let endpoint = `no-movement-days/${date}`;
    if (service) {
      endpoint += `?service=${encodeURIComponent(service)}`;
    }
    
    const response = await apiRequest.delete(endpoint, true);
    console.log("Réponse après suppression d'un jour sans mouvement:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la suppression d'un jour sans mouvement:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};