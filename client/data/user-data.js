import { apiRequest } from "../lib/api-request";

// Mettre à jour la fonction authenticateUser
export const authenticateUser = async (username, password) => {
  try {
    const response = await apiRequest.post("user", { username, password });
    // console.log("Réponse d'authentification complète:", response); // Log pour débogage
    return response;
  } catch (error) {
    console.error("Erreur dans authenticateUser:", error);
    return {
      status: "error",
      message: error.message || "Erreur d'authentification",
    };
  }
};

/**
 * Fonction pour sauvegarder le token d'authentification
 * @param {string} token - Token à stocker
 */
export const saveAuthToken = (token) => {
  if (!token) {
    console.error("Tentative de sauvegarde d'un token null ou undefined");
    return;
  }
  try {
    localStorage.setItem("authToken", token);
    // console.log("Token sauvegardé avec succès:", token);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du token:", error);
  }
};

/**
 * Récupérer le token d'authentification
 * @returns {string|null} - Token stocké ou null si non trouvé
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem("authToken");
    return token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token:", error);
    return null;
  }
};

/**
 * Récupérer tous les utilisateurs
 */
export const getAllUsers = async (
  page = 1,
  limit = 10,
  serviceFilter = "",
  searchQuery = ""
) => {
  let endpoint = `user?page=${page}&limit=${limit}`;

  if (serviceFilter) {
    endpoint += `&service=${encodeURIComponent(serviceFilter)}`;
  }

  if (searchQuery) {
    endpoint += `&q=${encodeURIComponent(searchQuery)}`;
  }

  const response = await apiRequest.get(endpoint, true);

  console.log("Réponse API utilisateurs:", response);

  // Adapter la réponse si nécessaire
  if (response.status === "success") {
    return {
      status: "success",
      data: response.data || [],
      totalPages: response.totalPages || 1,
      currentPage: response.currentPage || page,
    };
  }

  return response;
};

/**
 * Vérifier si l'utilisateur est connecté
 * @returns {boolean} - True si un token est présent
 */
export const isUserLoggedIn = () => {
  return !!getAuthToken();
};

/**
 * Vérifier si le token est valide auprès du serveur
 * @returns {Promise} - Résultat de la vérification avec les données utilisateur
 */
export const verifyToken = async () => {
  const token = getAuthToken();
  if (!token) {
    return { status: "error", message: "Aucun token trouvé" };
    console.log("Aucun token trouvé pour la vérification.");
  }

  // console.log("Envoi du token pour vérification:", token);
  const response = await apiRequest.post("user", {
    action: "verify_token",
    token,
  });
  // console.log("Réponse de vérification du token:", response);

  return response;
};

/**
 * Déconnecter l'utilisateur en supprimant le token
 */
export const logoutUser = () => {
  localStorage.removeItem("authToken");

  console.log("Utilisateur déconnecté et token supprimé.");
};

/**
 * Ajouter un nouvel utilisateur
 */
export const addUser = async (userData) => {
  const data = { ...userData };

  // Si c'est un nouveau service, utiliser la valeur spécifiée
  if (userData.service === "Nouveau" && userData.newServiceName) {
    data.service = userData.newServiceName;
    delete data.newServiceName;
  }

  return await apiRequest.post("user/add", data, true);
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (userId) => {
  return await apiRequest.delete(`user/${userId}`, true);
};

export const updateUserService = async (userId, newService) => {
  console.log(
    `Envoi requête PUT vers user/update-service avec userId=${userId} et service=${newService}`
  );
  return await apiRequest.put(
    "user/update-service",
    {
      userId: userId,
      service: newService,
    },
    true
  );
};

/**
 * Récupérer les permissions d'un utilisateur spécifique
 */
export const getUserPermissions = async (userId) => {
  try {
    console.log(`Récupération des permissions pour l'utilisateur ${userId}`);
    const response = await apiRequest.get(
      `user/permissions?userId=${userId}`,
      true
    );
    console.log("Réponse de l'API permissions:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des permissions utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};

/**
 * Mettre à jour les permissions d'un utilisateur
 */
export const updateUserPermissions = async (userId, permissions) => {
  try {
    console.log(
      `Mise à jour des permissions pour l'utilisateur ${userId}:`,
      permissions
    );
    const response = await apiRequest.put(
      "user/permissions",
      { userId, permissions },
      true
    );
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des permissions utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};

/**
 * Réinitialiser les permissions personnalisées d'un utilisateur
 */
export const resetUserPermissions = async (userId) => {
  try {
    console.log(
      `Réinitialisation des permissions pour l'utilisateur ${userId}`
    );
    const response = await apiRequest.put(
      "user/reset-permissions",
      { userId },
      true
    );
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation des permissions utilisateur:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
    };
  }
};
