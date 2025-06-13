import { apiRequest } from "../lib/api-request";

export const getAllMouvements = async (
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  type = "",
  dateFrom = "",
  dateTo = "",
  filterService = "",
  checkStatus = ""
) => {
  let endpoint = `mouvement?sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  if (type) {
    endpoint += `&type=${encodeURIComponent(type)}`;
  }

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (filterService) {
    endpoint += `&filterService=${encodeURIComponent(filterService)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  const response = await apiRequest.get(endpoint, true);

  // Adapter la réponse si nécessaire
  if (response.status === "success" && !response.data?.items) {
    // Si les données sont directement dans data sans sous-objet items
    return {
      status: "success",
      data: {
        items: response.data || [],
        totalPages: 1, // valeur par défaut
        currentPage: 1,
        availableServices: response.availableServices || [],
      },
    };
  }

  return response;
};
export const addMouvement = async (mouvementData) => {
  return await apiRequest.post("mouvement", mouvementData, true);
};

export const searchMouvements = async (
  query,
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  type = "",
  dateFrom = "",
  dateTo = "",
  filterService = "",
  checkStatus = ""
) => {
  let endpoint = `mouvement?q=${encodeURIComponent(
    query
  )}&sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  if (type) {
    endpoint += `&type=${encodeURIComponent(type)}`;
  }

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (filterService) {
    endpoint += `&filterService=${encodeURIComponent(filterService)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  console.log("Recherche avec endpoint:", endpoint);

  const response = await apiRequest.get(endpoint, true);

  console.log("Réponse de recherche:", response);

  return response;
};

export const deleteMouvement = async (id) => {
  return await apiRequest.delete(`mouvement/${id}`, true);
};

export const deleteArchives = async (months) => {
  if (!months || months <= 0) {
    return {
      status: "error",
      message: "Paramètre de mois invalide",
    };
  }

  return await apiRequest.delete(`mouvement/archives?months=${months}`, true);
};

export const toggleMouvementChecked = async (id, checked) => {
  return await apiRequest.put(`mouvement/${id}`, { checked }, true);
};
