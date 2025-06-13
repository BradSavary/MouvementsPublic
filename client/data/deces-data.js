import { apiRequest } from "../lib/api-request";

export const getAllDeces = async (
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  dateFrom = "",
  dateTo = "",
  checkStatus = ""
) => {
  let endpoint = `deces?sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  return await apiRequest.get(endpoint, true);
};

export const addDeces = async (decesData) => {
  return await apiRequest.post("deces", decesData, true);
};

export const searchDeces = async (
  query,
  sortOrder = "desc",
  page = 1,
  itemsPerPage = 10,
  dateFrom = "",
  dateTo = "",
  checkStatus = ""
) => {
  let endpoint = `deces?q=${encodeURIComponent(
    query
  )}&sort=${sortOrder}&page=${page}&limit=${itemsPerPage}`;

  if (dateFrom) {
    endpoint += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  }

  if (dateTo) {
    endpoint += `&dateTo=${encodeURIComponent(dateTo)}`;
  }

  if (checkStatus) {
    endpoint += `&checkStatus=${encodeURIComponent(checkStatus)}`;
  }

  return await apiRequest.get(endpoint, true);
};

export const deleteDeces = async (id) => {
  return await apiRequest.delete(`deces/${id}`, true);
};

export const toggleDecesChecked = async (id, checked) => {
  return await apiRequest.put(`deces/${id}`, { checked }, true);
};
