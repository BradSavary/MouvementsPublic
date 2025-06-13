import { apiRequest } from "../lib/api-request";

export const getUserPreferences = async () => {
  try {
    const response = await apiRequest.get("preferences", true);
    console.log("Préférences récupérées:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des préférences utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { notification_type: "never", email: null },
    };
  }
};

export const getUnvalidatedStats = async () => {
  try {
    const response = await apiRequest.get("preferences/stats", true);
    console.log("Statistiques récupérées:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { uncheckedMovements: 0, uncheckedDeaths: 0, totalUnchecked: 0 },
    };
  }
};

export const updateUserPreferences = async (preferencesData) => {
  try {
    console.log("Mise à jour des préférences:", preferencesData);
    const response = await apiRequest.put("preferences", preferencesData, true);
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des préférences utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};

export const resetUserPreferences = async () => {
  try {
    console.log("Réinitialisation des préférences");
    const response = await apiRequest.delete("preferences", true);
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation des préférences utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};
