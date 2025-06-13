import { apiRequest } from "../lib/api-request";

export const getLocations = async () => {
  const response = await apiRequest.get("location", true);

  // Adapter la réponse si nécessaire
  if (response.status === "success" && !response.data?.all) {
    // Si les données ne sont pas structurées comme attendu
    return {
      status: "success",
      data: {
        all: response.data || [],
        rooms: [],
        facilities: [],
      },
    };
  }

  return response;
};

export const getLocationsPaginated = async (
  page = 1,
  limit = 10,
  type = "",
  searchQuery = ""
) => {
  let endpoint = `location?mode=admin&page=${page}&limit=${limit}`;

  if (type) {
    endpoint += `&type=${encodeURIComponent(type)}`;
  }

  if (searchQuery) {
    endpoint += `&q=${encodeURIComponent(searchQuery)}`;
  }

  return await apiRequest.get(endpoint, true);
};

export const addLocation = async (location) => {
  // Le service et la section sont inclus dans l'objet location
  return await apiRequest.post("location", location, true);
};

export const deleteLocation = async (id) => {
  return await apiRequest.delete(`location/${id}`, true);
};
