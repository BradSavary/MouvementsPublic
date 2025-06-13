import { apiRequest } from "../lib/api-request";

/**
 * Récupérer les statistiques générales (résumé)
 */
export const getStatisticsSummary = async (fromDate = "") => {
  let endpoint = "statistics/summary";

  if (fromDate) {
    endpoint += `?fromDate=${encodeURIComponent(fromDate)}`;
  }

  try {
    return await apiRequest.get(endpoint, true);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: {},
    };
  }
};

/**
 * Récupérer les statistiques de mouvements par type
 */
export const getMovementsByTypeStats = async (fromDate = "") => {
  let endpoint = "statistics/movements-by-type";

  if (fromDate) {
    endpoint += `?fromDate=${encodeURIComponent(fromDate)}`;
  }

  try {
    return await apiRequest.get(endpoint, true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques de mouvements:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: [],
    };
  }
};

/**
 * Récupérer les statistiques de décès
 */
export const getDeathsStats = async (fromDate = "") => {
  let endpoint = "statistics/deaths-count";

  if (fromDate) {
    endpoint += `?fromDate=${encodeURIComponent(fromDate)}`;
  }

  try {
    return await apiRequest.get(endpoint, true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques de décès:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { total: 0, byMonth: [] },
    };
  }
};

/**
 * Récupérer les statistiques de connexions
 */
export const getLoginsStats = async (fromDate = "") => {
  let endpoint = "statistics/logins-count";

  if (fromDate) {
    endpoint += `?fromDate=${encodeURIComponent(fromDate)}`;
  }

  try {
    return await apiRequest.get(endpoint, true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques de connexions:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { totals: {}, byDay: [] },
    };
  }
};

/**
 * Récupérer les statistiques de connexions par utilisateur
 */
export const getUserLoginsStats = async (fromDate = "") => {
  let endpoint = "statistics/user-logins";

  if (fromDate) {
    endpoint += `?fromDate=${encodeURIComponent(fromDate)}`;
  }

  try {
    return await apiRequest.get(endpoint, true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques de connexions utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: [],
    };
  }
};

/**
 * Récupérer les statistiques de mouvements à venir
 */
export const getUpcomingMovementsStats = async () => {
  try {
    return await apiRequest.get("statistics/upcoming-movements", true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des mouvements à venir:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { summary: {}, upcoming: [] },
    };
  }
};

/**
 * Récupérer le nombre d'éléments non validés
 */
export const getUnvalidatedCountStats = async () => {
  try {
    return await apiRequest.get("statistics/unvalidated-count", true);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du nombre d'éléments non validés:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { movements: 0, deaths: 0, total: 0 },
    };
  }
};
