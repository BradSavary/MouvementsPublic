import { apiRequest } from "../lib/api-request";

export const getUnifiedHistory = async (
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  type = "",
  dateFrom = "",
  dateTo = "",
  checkStatus = ""
) => {
  let endpoint = `unified-history?sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  // Ajout des filtres à l'URL
  if (type) {
    endpoint += `&type=${encodeURIComponent(type)}`;
  }

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  console.log(`Chargement de l'historique unifié: ${endpoint}`);

  try {
    const response = await apiRequest.get(endpoint, true);
    console.log("Réponse de l'API:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { items: [], totalPages: 0, totalItems: 0 },
    };
  }
};

export const searchUnifiedHistory = async (
  query,
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  type = "",
  dateFrom = "",
  dateTo = "",
  checkStatus = ""
) => {
  if (!query || query.length < 3) {
    return {
      status: "error",
      message: "La requête de recherche doit contenir au moins 3 caractères",
      data: { items: [], totalPages: 0, totalItems: 0 },
    };
  }

  let endpoint = `unified-history?q=${encodeURIComponent(
    query
  )}&sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  // Ajout des filtres à l'URL
  if (type) {
    endpoint += `&type=${encodeURIComponent(type)}`;
  }

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  console.log(`Recherche dans l'historique unifié: ${endpoint}`);

  try {
    const response = await apiRequest.get(endpoint, true);
    console.log("Réponse de recherche:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors de la recherche dans l'historique:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { items: [], totalPages: 0, totalItems: 0 },
    };
  }
};

export const toggleItemChecked = async (id, checked, type) => {
  try {
    console.log(`Mise à jour du statut: ${id}, ${type}, checked=${checked}`);
    return await apiRequest.put(
      `unified-history/${id}?type=${type}`,
      { checked },
      true
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return {
      status: "error",
      message:
        error.message || "Une erreur s'est produite lors de la mise à jour",
    };
  }
};

export const countUnvalidatedItems = async () => {
  try {
    return await apiRequest.get("unified-history/count-unvalidated", true);
  } catch (error) {
    console.error("Erreur lors du comptage des éléments non validés:", error);
    return {
      status: "error",
      message: error.message || "Une erreur s'est produite",
      data: { count: 0 },
    };
  }
};
