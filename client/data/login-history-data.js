import { apiRequest } from "../lib/api-request";

export const getLoginHistory = async (
  page = 1,
  limit = 20,
  username = "",
  dateFrom = "",
  dateTo = "",
  status = ""
) => {
  let endpoint = `login-history?page=${page}&limit=${limit}`;

  if (username) {
    endpoint += `&username=${encodeURIComponent(username)}`;
  }

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (status) {
    endpoint += `&status=${encodeURIComponent(status)}`;
  }

  console.log(`Chargement de l'historique des connexions: ${endpoint}`);

  try {
    const response = await apiRequest.get(endpoint, true);
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'historique des connexions:",
      error
    );
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { items: [], totalPages: 0, totalItems: 0 },
    };
  }
};
